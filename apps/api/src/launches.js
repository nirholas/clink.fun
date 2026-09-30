// Planned launches.
//
// An assistant never signs anything. It plans: the server validates the coin,
// re-hosts its artwork, checks every market is live on the contract, and writes
// a draft. The person opens the draft's launch link, connects their own wallet
// on the launch page, and signs there. That split is the whole safety design:
// the model can prepare a launch freely, and only a human with a wallet can
// make it real.
//
// Finding the coin afterwards needs no report from the browser. The draft's
// descriptor carries its id, the descriptor's hash is committed on chain, so
// scanning `Launched` events for a descriptor naming this draft is enough.

import { randomBytes } from 'node:crypto';
import { isAddress, parseUnits } from 'viem';
import { LAUNCHPAD, cached, launchedEvent, launchpadAbi, publicClient } from './chain.js';
import { PUBLIC_URL, store } from './context.js';
import { fetchImage } from './net.js';
import { buildOrigin } from './origin.js';
import { findStock } from './stocks.js';
import { localDescriptor } from './tokens.js';

export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_MARKETS = 5;
const BPS = 10_000;
// Public RPCs cap how many blocks one getLogs may span.
const LOG_CHUNK = 45_000n;

export class LaunchError extends Error {
	constructor(message, status = 400) {
		super(message);
		this.status = status;
	}
}

// ── validation ───────────────────────────────────────────────────────────────
// The same rules the launch form applies, so a planned launch never lands on
// the page in a state the form would refuse.

export function sanitizeSymbol(raw, max = 10) {
	return String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, max);
}

export function sanitizeName(raw, max = 32) {
	return String(raw ?? '').replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Split 100% evenly in basis points, handing the remainder to the first markets. */
export function evenWeights(count) {
	const base = Math.floor(BPS / count);
	const weights = Array.from({ length: count }, () => base);
	let remainder = BPS - base * count;
	for (let i = 0; remainder > 0; i = (i + 1) % count, remainder--) weights[i] += 1;
	return weights;
}

function optionalText(value, max, label) {
	if (value == null || value === '') return undefined;
	const text = String(value).trim();
	if (text.length > max) throw new LaunchError(`${label} must be ${max} characters or fewer.`);
	return text || undefined;
}

function resolveMarkets(symbols, weights) {
	if (!Array.isArray(symbols) || symbols.length === 0) throw new LaunchError('Pick at least one stock market to pair against.');
	if (symbols.length > MAX_MARKETS) throw new LaunchError(`A coin can pair with at most ${MAX_MARKETS} markets.`);

	const markets = symbols.map((symbol) => {
		const stock = findStock(symbol);
		if (!stock) throw new LaunchError(`${symbol} is not a market here. list_markets shows every stock you can pair against.`);
		return stock;
	});
	if (new Set(markets.map((m) => m.address)).size !== markets.length) throw new LaunchError('Each market can appear only once.');

	let bps;
	if (weights == null) bps = evenWeights(markets.length);
	else {
		if (!Array.isArray(weights) || weights.length !== markets.length) {
			throw new LaunchError('Give one weight per market, as percentages that add up to 100.');
		}
		bps = weights.map((w) => Math.round(Number(w) * 100));
		if (bps.some((w) => !Number.isFinite(w) || w <= 0)) throw new LaunchError('Every market weight must be above 0%.');
		if (bps.reduce((a, b) => a + b, 0) !== BPS) throw new LaunchError('Market weights must add up to exactly 100%.');
	}
	return markets.map((m, i) => ({ symbol: m.symbol, address: m.address, weightBps: bps[i] }));
}

async function assertMarketsLive(markets) {
	const configs = await Promise.all(
		markets.map((m) =>
			cached(`quote:${m.address}`, 300_000, () =>
				publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'quoteConfig', args: [m.address] }),
			),
		),
	);
	const off = markets.filter((_m, i) => !configs[i][1]);
	if (off.length) throw new LaunchError(`${off.map((m) => m.symbol).join(', ')} is not enabled on the launchpad right now.`);
}

/** Re-host a logo link on this server, so the artwork a coin commits to can never change or disappear. */
async function hostImage(url) {
	const { bytes, contentType } = await fetchImage(url);
	const { hash } = await store.putImage(bytes, contentType);
	return `${PUBLIC_URL}/api/images/${hash}`;
}

// ── descriptors ──────────────────────────────────────────────────────────────

/**
 * Build and store a coin descriptor. Callers never supply `origin`: it is
 * attached here, and only for a live draft, so a descriptor claiming to come
 * from a prompt is one this server actually planned.
 */
export async function storeDescriptor(body) {
	const name = sanitizeName(body.name);
	const symbol = sanitizeSymbol(body.symbol);
	if (!name || !symbol) throw new LaunchError('name and symbol are required');

	let origin;
	if (body.draft) {
		const draft = await store.getDraft(String(body.draft));
		if (!draft) throw new LaunchError('That launch draft does not exist.', 404);
		if (draft.status === 'launched') throw new LaunchError('That draft has already been launched.', 409);
		if (Date.now() > Date.parse(draft.expiresAt)) throw new LaunchError('That launch draft has expired. Plan the launch again.', 410);
		origin = await buildOrigin({ channel: draft.channel, draft: draft.id, client: draft.client, name, symbol });
	}

	const descriptor = {
		schemaVersion: '1.0.0',
		name,
		symbol,
		description: body.description ? String(body.description) : undefined,
		image: body.image ? String(body.image) : undefined,
		links: {
			website: body.website || undefined,
			twitter: body.twitter || undefined,
			telegram: body.telegram || undefined,
			discord: body.discord || undefined,
		},
		origin,
	};
	const { hash, body: bytes } = await store.putMetadata(descriptor);
	// The caller commits keccak256 of these exact bytes on chain.
	return { hash, url: `${PUBLIC_URL}/api/metadata/${hash}`, bytes };
}

// ── drafts ───────────────────────────────────────────────────────────────────

export const launchUrl = (id) => `${PUBLIC_URL}/launch?draft=${id}`;

export async function planLaunch(input, { client, channel = 'prompt' } = {}) {
	if (!LAUNCHPAD) throw new LaunchError('The launchpad is not configured on this deployment.', 503);

	const name = sanitizeName(input.name);
	const symbol = sanitizeSymbol(input.symbol);
	if (!name) throw new LaunchError('The coin needs a name.');
	if (symbol.length < 2) throw new LaunchError('The ticker needs at least two letters or digits.');

	const markets = resolveMarkets(input.markets, input.weights);
	const description = optionalText(input.description, 480, 'The description');
	const links = {
		website: optionalText(input.website, 200, 'The website link'),
		twitter: optionalText(input.twitter, 200, 'The X link'),
		telegram: optionalText(input.telegram, 200, 'The Telegram link'),
	};

	let devBuy;
	if (input.devBuy != null && String(input.devBuy).trim() !== '' && Number(input.devBuy) !== 0) {
		devBuy = String(input.devBuy).trim();
		if (!/^\d+(\.\d{1,18})?$/.test(devBuy) || parseUnits(devBuy, 18) === 0n) {
			throw new LaunchError(`The launch buy must be a positive amount of ${markets[0].symbol}, like "0.5".`);
		}
	}

	let feeWallet;
	if (input.feeWallet) {
		if (!isAddress(input.feeWallet)) throw new LaunchError('The fee wallet must be a 0x address.');
		feeWallet = input.feeWallet;
	}

	if (input.imageUrl) {
		let parsed;
		try {
			parsed = new URL(String(input.imageUrl));
		} catch {
			throw new LaunchError('The logo link is not a valid URL.');
		}
		if (parsed.protocol !== 'https:') throw new LaunchError('The logo link must use https.');
	}

	await assertMarketsLive(markets);
	const image = input.imageUrl ? await hostImage(String(input.imageUrl)) : undefined;
	const fromBlock = await publicClient.getBlockNumber();

	const now = Date.now();
	const draft = {
		id: randomBytes(9).toString('base64url'),
		channel,
		client: client || null,
		status: 'planned',
		createdAt: new Date(now).toISOString(),
		expiresAt: new Date(now + DRAFT_TTL_MS).toISOString(),
		name,
		symbol,
		description,
		image,
		links,
		markets,
		devBuy,
		feeWallet,
		fromBlock: fromBlock.toString(),
		scannedTo: (fromBlock - 1n).toString(),
	};
	await store.putDraft(draft);
	return draft;
}

/** What a draft is doing now: still waiting, launched as a coin, or expired unsigned. */
export function draftStatus(draft) {
	if (draft.status === 'launched') return 'launched';
	return Date.now() > Date.parse(draft.expiresAt) ? 'expired' : 'awaiting signature';
}

/**
 * Look for the draft's coin on chain, from wherever the last look stopped.
 * Concurrent callers share one scan. A launch can land a little after the draft
 * expires (the page was open, the descriptor was already stored), so expired
 * drafts are still scanned.
 */
export function resolveDraft(id) {
	return cached(`resolve:${id}`, 4_000, async () => {
		const draft = await store.getDraft(id);
		if (!draft || draft.status === 'launched' || !LAUNCHPAD) return draft;

		const head = await publicClient.getBlockNumber();
		let from = BigInt(draft.scannedTo) + 1n;
		while (from <= head) {
			const to = from + LOG_CHUNK - 1n > head ? head : from + LOG_CHUNK - 1n;
			const logs = await publicClient.getLogs({ address: LAUNCHPAD, event: launchedEvent, fromBlock: from, toBlock: to });
			for (const log of logs) {
				const descriptor = await localDescriptor(log.args.metadataURI);
				if (descriptor?.origin?.draft !== draft.id) continue;
				const launched = {
					...draft,
					status: 'launched',
					token: log.args.token,
					creator: log.args.creator,
					txHash: log.transactionHash,
					launchedBlock: log.blockNumber.toString(),
					scannedTo: log.blockNumber.toString(),
				};
				await store.putDraft(launched);
				return launched;
			}
			from = to + 1n;
		}
		const scanned = { ...draft, scannedTo: head.toString() };
		await store.putDraft(scanned);
		return scanned;
	});
}

/** The public shape of a draft: everything the launch page needs, nothing internal. */
export function publicDraft(draft) {
	return {
		id: draft.id,
		channel: draft.channel,
		client: draft.client,
		status: draftStatus(draft),
		createdAt: draft.createdAt,
		expiresAt: draft.expiresAt,
		name: draft.name,
		symbol: draft.symbol,
		description: draft.description ?? null,
		image: draft.image ?? null,
		links: draft.links ?? {},
		markets: draft.markets,
		devBuy: draft.devBuy ?? null,
		feeWallet: draft.feeWallet ?? null,
		launchUrl: launchUrl(draft.id),
		token: draft.token ?? null,
		txHash: draft.txHash ?? null,
	};
}
