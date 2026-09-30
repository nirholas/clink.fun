// Token reads, shared by the HTTP routes and the MCP tools.
//
// The launchpad is the source of truth for which coins exist and what they are
// worth; the only thing layered on top is a coin's launch origin, which comes
// from its hash-committed descriptor in this server's own store.

import { formatUnits } from 'viem';
import { LAUNCHPAD, cached, erc20Abi, launchpadAbi, publicClient, CREATOR_FEE_SHARE_BPS } from './chain.js';
import { store } from './context.js';
import { verifyOrigin } from './origin.js';

const METADATA_PATH = /\/api\/metadata\/([0-9a-f]{64})$/;

/** The descriptor behind a metadata URI, if this server stored it. Content addressing makes the host irrelevant. */
export async function localDescriptor(metadataURI) {
	const hash = METADATA_PATH.exec(metadataURI || '')?.[1];
	if (!hash) return null;
	const raw = await store.getMetadata(hash);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

/** Where a coin was launched from. Only coins planned through MCP carry an origin. */
async function originOf(metadataURI) {
	const descriptor = await localDescriptor(metadataURI);
	const origin = descriptor?.origin;
	if (!origin?.channel) return null;
	return {
		channel: origin.channel,
		client: origin.client ?? null,
		draft: origin.draft ?? null,
		verified: await verifyOrigin(descriptor),
	};
}

export async function loadToken(address) {
	const [name, symbol, totalSupply, metadataURI, creator, markets] = await Promise.all([
		publicClient.readContract({ address, abi: erc20Abi, functionName: 'name' }),
		publicClient.readContract({ address, abi: erc20Abi, functionName: 'symbol' }),
		publicClient.readContract({ address, abi: erc20Abi, functionName: 'totalSupply' }),
		publicClient.readContract({ address, abi: erc20Abi, functionName: 'metadataURI' }).catch(() => ''),
		publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'creatorOf', args: [address] }),
		publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'marketsOf', args: [address] }),
	]);

	const pairs = await Promise.all(
		markets.map(async (quoteToken) => {
			const [curve, price, quoteSymbol] = await Promise.all([
				publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'curveOf', args: [address, quoteToken] }),
				publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'priceOf', args: [address, quoteToken] }),
				publicClient.readContract({ address: quoteToken, abi: erc20Abi, functionName: 'symbol' }).catch(() => '?'),
			]);
			// How much of this pool's slice has been bought. The allocation is
			// derived rather than stored, so it stays right if weights change
			// shape in a future version.
			const allocation = (totalSupply * BigInt(curve.weightBps)) / 10_000n;
			const sold = allocation > curve.tokensLeft ? allocation - curve.tokensLeft : 0n;
			return {
				quoteToken,
				quoteSymbol,
				weightBps: curve.weightBps,
				// The raw reserves travel with the pair so the client can plot
				// the whole curve, not just the point it currently sits on. It
				// is pure math from these two numbers, so the shape renders
				// even for a coin that has never traded.
				virtualQuote: curve.virtualQuote.toString(),
				virtualToken: curve.virtualToken.toString(),
				priceQuote: formatUnits(price, 18),
				// What the curve actually holds, which is the only number here
				// that is a claim on something rather than a quote.
				raisedQuote: formatUnits(curve.realQuote, 18),
				tokensLeft: formatUnits(curve.tokensLeft, 18),
				soldPct: allocation === 0n ? 0 : Number((sold * 10_000n) / allocation) / 100,
			};
		}),
	);

	return {
		address,
		name,
		symbol,
		totalSupply: totalSupply.toString(),
		metadataURI,
		creator,
		origin: await originOf(metadataURI).catch(() => null),
		pairs,
	};
}

export const tokenCached = (address) => cached(`token:${address.toLowerCase()}`, 5_000, () => loadToken(address));

async function tokenAddresses(indices) {
	return Promise.all(
		indices.map((i) => publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'tokenAt', args: [BigInt(i)] })),
	);
}

/**
 * Coins newest first. With `origin`, only coins launched through that channel:
 * the filter walks the whole list in pages, because origin lives in each coin's
 * descriptor rather than in anything the contract can index.
 */
export async function listTokens({ limit = 50, offset = 0, origin } = {}) {
	if (!LAUNCHPAD) return { items: [], total: 0, note: 'CLINK_LAUNCHPAD is not set' };
	const count = Number(await publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'tokenCount' }));

	if (!origin) {
		// The contract appends, so the tail is the front page.
		const indices = [];
		for (let i = count - 1 - offset; i >= 0 && indices.length < limit; i--) indices.push(i);
		const items = await Promise.all((await tokenAddresses(indices)).map((a) => tokenCached(a).catch(() => null)));
		return { items: items.filter(Boolean), total: count };
	}

	const matches = [];
	const PAGE = 25;
	for (let top = count - 1; top >= 0; top -= PAGE) {
		const indices = [];
		for (let i = top; i > top - PAGE && i >= 0; i--) indices.push(i);
		const page = await Promise.all((await tokenAddresses(indices)).map((a) => tokenCached(a).catch(() => null)));
		for (const token of page) if (token?.origin?.channel === origin) matches.push(token);
	}
	return { items: matches.slice(offset, offset + limit), total: matches.length };
}

export const listTokensCached = (options) =>
	cached(`tokens:${options.limit}:${options.offset}:${options.origin ?? 'all'}`, 10_000, () => listTokens(options));

/** Launch fee and swap fee as the contract currently has them. */
export async function readFees() {
	if (!LAUNCHPAD) return null;
	const [launchFeeWei, swapFeeBps] = await Promise.all([
		publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'launchFeeWei' }),
		publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'swapFeeBps' }),
	]);
	return {
		launchFeeWei,
		launchFeeEth: formatUnits(launchFeeWei, 18),
		swapFeeBps: Number(swapFeeBps),
		creatorShareBps: CREATOR_FEE_SHARE_BPS,
	};
}

export const feesCached = () => cached('fees', 60_000, readFees);
