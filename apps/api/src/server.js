// clink.fun API.
//
// Deliberately small. The launchpad contract is the source of truth for which
// tokens exist and what they are worth, so this server never owns that state.
// It does two things the chain cannot: host images and host descriptors, both
// content-addressed and immutable. Everything else is a cached read.
//
// Plain node:http, no framework. The whole surface is nine routes.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { formatUnits, isAddress } from 'viem';
import { createStore, MAX_IMAGE_BYTES } from './store.js';
import { LAUNCHPAD, cached, erc20Abi, launchpadAbi, publicClient } from './chain.js';

const PORT = Number(process.env.PORT || 8787);
const PUBLIC_URL = (process.env.CLINK_PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const DATA_DIR = process.env.CLINK_DATA_DIR || join(dirname(fileURLToPath(import.meta.url)), '../../../data');
const MAX_BODY_BYTES = 8 * 1024 * 1024;
// In production one container serves the built app and the API from the same
// origin, which is what the frontend already assumes: it only ever calls
// /api/* relative paths, so there is no CORS difference between dev and prod.
const WEB_DIR = process.env.CLINK_WEB_DIR || '';

const CONTENT_TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.webp': 'image/webp',
	'.woff2': 'font/woff2',
	'.map': 'application/json; charset=utf-8',
};

const store = createStore(DATA_DIR);

// ── helpers ──────────────────────────────────────────────────────────────────

const json = (res, status, body, headers = {}) => {
	const payload = JSON.stringify(body, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
	res.writeHead(status, {
		'content-type': 'application/json; charset=utf-8',
		'access-control-allow-origin': '*',
		...headers,
	});
	res.end(payload);
};

const fail = (res, status, message) => json(res, status, { error: message });

async function readBody(req) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		size += chunk.length;
		if (size > MAX_BODY_BYTES) throw Object.assign(new Error('body too large'), { status: 413 });
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

const readJson = async (req) => {
	const raw = await readBody(req);
	try {
		return JSON.parse(raw.toString('utf8') || '{}');
	} catch {
		throw Object.assign(new Error('invalid JSON body'), { status: 400 });
	}
};

// ── token reads ──────────────────────────────────────────────────────────────

async function loadToken(address) {
	const [name, symbol, totalSupply, metadataURI, creator, markets] = await Promise.all([
		publicClient.readContract({ address, abi: erc20Abi, functionName: 'name' }),
		publicClient.readContract({ address, abi: erc20Abi, functionName: 'symbol' }),
		publicClient.readContract({ address, abi: erc20Abi, functionName: 'totalSupply' }),
		publicClient.readContract({ address, abi: erc20Abi, functionName: 'metadataURI' }).catch(() => ''),
		publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'creatorOf', args: [address] }),
		publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'marketsOf', args: [address] }),
	]);

	const pairs = await Promise.all(
		markets.map(async (quoteToken) => {  // eslint-disable-line no-shadow
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
		pairs,
	};
}

async function listTokens({ limit = 50, offset = 0 }) {
	if (!LAUNCHPAD) return { items: [], total: 0, note: 'CLINK_LAUNCHPAD is not set' };
	const total = await publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'tokenCount' });
	const count = Number(total);
	// Newest first: the contract appends, so the tail is the front page.
	const indices = [];
	for (let i = count - 1 - offset; i >= 0 && indices.length < limit; i--) indices.push(i);

	const addresses = await Promise.all(
		indices.map((i) => publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'tokenAt', args: [BigInt(i)] })),
	);
	const items = await Promise.all(addresses.map((a) => loadToken(a).catch(() => null)));
	return { items: items.filter(Boolean), total: count };
}

// ── routes ───────────────────────────────────────────────────────────────────

const routes = [
	['GET', /^\/api\/healthz$/, async (_req, res) => json(res, 200, { status: 'ok' })],

	['GET', /^\/api\/config$/, async (_req, res) => {
		const [launchFeeWei, swapFeeBps] = LAUNCHPAD
			? await Promise.all([
				publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'launchFeeWei' }),
				publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'swapFeeBps' }),
			])
			: [0n, 0];
		json(res, 200, {
			chainId: 4663,
			launchpad: LAUNCHPAD || null,
			launchFeeWei: launchFeeWei.toString(),
			launchFeeEth: formatUnits(launchFeeWei, 18),
			swapFeeBps,
			publicUrl: PUBLIC_URL,
		});
	}],

	['GET', /^\/api\/tokens$/, async (req, res, _m, url) => {
		const limit = Math.min(100, Number(url.searchParams.get('limit') || 50));
		const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
		const page = await cached(`tokens:${limit}:${offset}`, 10_000, () => listTokens({ limit, offset }));
		json(res, 200, page, { 'cache-control': 'public, max-age=5' });
	}],

	['GET', /^\/api\/tokens\/(0x[0-9a-fA-F]{40})$/, async (_req, res, m) => {
		const address = m[1];
		if (!isAddress(address)) return fail(res, 400, 'invalid address');
		try {
			const token = await cached(`token:${address.toLowerCase()}`, 5_000, () => loadToken(address));
			json(res, 200, token, { 'cache-control': 'public, max-age=5' });
		} catch {
			fail(res, 404, 'token not found');
		}
	}],

	['POST', /^\/api\/images$/, async (req, res) => {
		const body = await readJson(req);
		if (typeof body.data !== 'string') return fail(res, 400, 'data must be base64');
		const bytes = Buffer.from(body.data, 'base64');
		const { hash, contentType } = await store.putImage(bytes, body.contentType);
		json(res, 201, { hash, contentType, url: `${PUBLIC_URL}/api/images/${hash}` });
	}],

	['GET', /^\/api\/images\/([0-9a-f]{64})$/, async (_req, res, m) => {
		const found = await store.getImage(m[1]);
		if (!found) return fail(res, 404, 'not found');
		res.writeHead(200, {
			'content-type': found.contentType,
			'access-control-allow-origin': '*',
			// Content-addressed, so it can never change.
			'cache-control': 'public, max-age=31536000, immutable',
		});
		res.end(found.bytes);
	}],

	['POST', /^\/api\/metadata$/, async (req, res) => {
		const body = await readJson(req);
		if (!body.name || !body.symbol) return fail(res, 400, 'name and symbol are required');
		const descriptor = {
			schemaVersion: '1.0.0',
			name: String(body.name),
			symbol: String(body.symbol),
			description: body.description ? String(body.description) : undefined,
			image: body.image ? String(body.image) : undefined,
			links: {
				website: body.website || undefined,
				twitter: body.twitter || undefined,
				telegram: body.telegram || undefined,
				discord: body.discord || undefined,
			},
		};
		const { hash, body: stored } = await store.putMetadata(descriptor);
		json(res, 201, {
			hash,
			url: `${PUBLIC_URL}/api/metadata/${hash}`,
			// The caller commits keccak256 of these exact bytes on chain.
			bytes: stored,
		});
	}],

	['GET', /^\/api\/metadata\/([0-9a-f]{64})$/, async (_req, res, m) => {
		const stored = await store.getMetadata(m[1]);
		if (!stored) return fail(res, 404, 'not found');
		res.writeHead(200, {
			'content-type': 'application/json; charset=utf-8',
			'access-control-allow-origin': '*',
			'cache-control': 'public, max-age=31536000, immutable',
		});
		res.end(stored);
	}],

	['GET', /^\/api\/stocks$/, async (_req, res) => {
		const file = join(dirname(fileURLToPath(import.meta.url)), 'stocks.json');
		const raw = await readFile(file, 'utf8').catch(() => '[]');
		json(res, 200, JSON.parse(raw), { 'cache-control': 'public, max-age=300' });
	}],
];

const server = createServer(async (req, res) => {
	if (req.method === 'OPTIONS') {
		res.writeHead(204, {
			'access-control-allow-origin': '*',
			'access-control-allow-methods': 'GET,POST,OPTIONS',
			'access-control-allow-headers': 'content-type',
		});
		return res.end();
	}

	const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
	for (const [method, pattern, handler] of routes) {
		if (req.method !== method) continue;
		const match = url.pathname.match(pattern);
		if (!match) continue;
		try {
			return await handler(req, res, match, url);
		} catch (err) {
			const status = err?.status || 500;
			if (status >= 500) console.error('[api]', err);
			return fail(res, status, err?.message || 'internal error');
		}
	}
	if (WEB_DIR && req.method === 'GET') return serveStatic(url.pathname, res);
	fail(res, 404, 'no such route');
});

/**
 * Serve the built SPA. Hashed assets are immutable and cached forever;
 * index.html never is, or a deploy would not reach anyone still holding the old
 * one. Unknown paths fall through to index.html because the router owns them.
 */
async function serveStatic(pathname, res) {
	const root = resolve(WEB_DIR);
	const requested = resolve(root, `.${normalize(pathname)}`);
	// Refuse anything that escapes the web root. The path comes off the wire.
	const safe = requested === root || requested.startsWith(root + sep) ? requested : root;

	let file = safe;
	try {
		const info = await stat(file);
		if (info.isDirectory()) file = resolve(file, 'index.html');
	} catch {
		file = resolve(root, 'index.html');
	}

	try {
		const bytes = await readFile(file);
		const ext = extname(file);
		const hashed = /\.[0-9a-zA-Z_-]{8,}\.(js|css)$/.test(file);
		res.writeHead(200, {
			'content-type': CONTENT_TYPES[ext] || 'application/octet-stream',
			'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
		});
		res.end(bytes);
	} catch {
		fail(res, 404, 'not found');
	}
}

server.listen(PORT, () => {
	console.log(`[api] listening on ${PORT}`);
	console.log(`[api] data dir ${DATA_DIR}`);
	console.log(`[api] launchpad ${LAUNCHPAD || 'NOT SET (set CLINK_LAUNCHPAD)'}`);
	console.log(`[api] max image ${(MAX_IMAGE_BYTES / 1024 / 1024).toFixed(0)}MB`);
	console.log(`[api] web dir ${WEB_DIR || 'not serving static files'}`);
});
