// clink.fun API.
//
// Deliberately small. The launchpad contract is the source of truth for which
// tokens exist and what they are worth, so this server never owns that state.
// It does what the chain cannot: host images and descriptors, both
// content-addressed and immutable, and hold the launch drafts an assistant
// plans over MCP until a person signs them. Everything else is a cached read.
//
// Plain node:http, no framework. Besides the routes below, /mcp exposes the
// same reads, plus launch planning, as Model Context Protocol tools.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, normalize, resolve, sep } from 'node:path';
import { isAddress } from 'viem';
import { LAUNCHPAD } from './chain.js';
import { PUBLIC_URL, WEB_DIR, store } from './context.js';
import { INTERVALS, toCandles, tradesCached } from './indexer.js';
import { publicDraft, resolveDraft, storeDescriptor } from './launches.js';
import { handleMcp } from './mcp.js';
import { attesterAddress } from './origin.js';
import { STOCKS } from './stocks.js';
import { feesCached, listTokensCached, tokenCached } from './tokens.js';

const MAX_BODY_BYTES = 8 * 1024 * 1024;

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

// ── routes ───────────────────────────────────────────────────────────────────

const routes = [
	['GET', /^\/api\/healthz$/, async (_req, res) => json(res, 200, { status: 'ok' })],

	['GET', /^\/api\/config$/, async (_req, res) => {
		const fees = await feesCached();
		json(res, 200, {
			chainId: 4663,
			launchpad: LAUNCHPAD || null,
			launchFeeWei: (fees?.launchFeeWei ?? 0n).toString(),
			launchFeeEth: fees?.launchFeeEth ?? '0',
			swapFeeBps: fees?.swapFeeBps ?? 0,
			publicUrl: PUBLIC_URL,
			mcpUrl: `${PUBLIC_URL}/mcp`,
			// Signs the origin block of every coin planned over MCP. Anyone can
			// recover a descriptor's signer and compare it with this.
			attester: attesterAddress(),
		});
	}],

	['GET', /^\/api\/tokens$/, async (req, res, _m, url) => {
		const limit = Math.min(100, Number(url.searchParams.get('limit') || 50));
		const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
		const origin = url.searchParams.get('origin') || undefined;
		if (origin && origin !== 'prompt') return fail(res, 400, 'origin must be prompt');
		const page = await listTokensCached({ limit, offset, origin });
		json(res, 200, page, { 'cache-control': 'public, max-age=5' });
	}],

	['GET', /^\/api\/tokens\/(0x[0-9a-fA-F]{40})$/, async (_req, res, m) => {
		const address = m[1];
		if (!isAddress(address)) return fail(res, 400, 'invalid address');
		try {
			const token = await tokenCached(address);
			json(res, 200, token, { 'cache-control': 'public, max-age=5' });
		} catch {
			fail(res, 404, 'token not found');
		}
	}],

	['GET', /^\/api\/tokens\/(0x[0-9a-fA-F]{40})\/trades$/, async (_req, res, m, url) => {
		const market = url.searchParams.get('market') || undefined;
		const limit = Math.min(500, Number(url.searchParams.get('limit') || 200));
		const trades = await tradesCached(m[1], market);
		json(res, 200, { items: trades.slice(-limit).reverse(), total: trades.length }, {
			'cache-control': 'public, max-age=10',
		});
	}],

	['GET', /^\/api\/tokens\/(0x[0-9a-fA-F]{40})\/candles$/, async (_req, res, m, url) => {
		const market = url.searchParams.get('market') || undefined;
		const key = url.searchParams.get('interval') || '5m';
		const seconds = INTERVALS[key];
		if (!seconds) return fail(res, 400, `interval must be one of ${Object.keys(INTERVALS).join(', ')}`);
		const trades = await tradesCached(m[1], market);
		json(res, 200, { interval: key, candles: toCandles(trades, seconds) }, {
			'cache-control': 'public, max-age=10',
		});
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
			// An uploaded SVG opened directly must not run script on this origin.
			'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
			'x-content-type-options': 'nosniff',
		});
		res.end(found.bytes);
	}],

	['POST', /^\/api\/metadata$/, async (req, res) => {
		// `draft` ties the descriptor to a launch planned over MCP, which is what
		// stamps the signed origin into it. Callers cannot set origin directly.
		json(res, 201, await storeDescriptor(await readJson(req)));
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
		json(res, 200, STOCKS, { 'cache-control': 'public, max-age=300' });
	}],

	['GET', /^\/api\/drafts\/([A-Za-z0-9_-]{8,32})$/, async (_req, res, m) => {
		const draft = await resolveDraft(m[1]);
		if (!draft) return fail(res, 404, 'no planned launch with that id');
		json(res, 200, publicDraft(draft), { 'cache-control': 'no-store' });
	}],
];

const MCP_METHODS = new Set(['GET', 'POST', 'DELETE']);

async function mcpRoute(req, res) {
	res.setHeader('access-control-allow-origin', '*');
	res.setHeader('access-control-expose-headers', 'mcp-session-id, mcp-protocol-version');
	const body = req.method === 'POST' ? await readJson(req) : undefined;
	await handleMcp(req, res, body);
}

export async function handle(req, res) {
	if (req.method === 'OPTIONS') {
		res.writeHead(204, {
			'access-control-allow-origin': '*',
			'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
			'access-control-allow-headers': 'content-type, authorization, mcp-session-id, mcp-protocol-version, last-event-id',
			'access-control-max-age': '86400',
		});
		return res.end();
	}

	const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
	if (url.pathname === '/mcp' && MCP_METHODS.has(req.method)) {
		try {
			return await mcpRoute(req, res);
		} catch (err) {
			if (res.headersSent) return res.end();
			const status = err?.status || 500;
			if (status >= 500) console.error('[mcp]', err);
			return fail(res, status, err?.message || 'internal error');
		}
	}

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
}

export const createApp = () => createServer(handle);

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
