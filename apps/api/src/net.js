// Fetching links that come off the wire.
//
// An assistant planning a launch passes a logo as a URL, and this server
// fetches it to re-host it. That is a request to an address someone else chose,
// so it is held to three rules: https only, every hop must resolve to a public
// address, and redirects are followed by hand so each one is checked again.

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from './store.js';

const MAX_REDIRECTS = 3;

export class PublicFetchError extends Error {
	constructor(message) {
		super(message);
		this.status = 400;
	}
}

export async function publicFetch(url, init = {}) {
	let current = url;
	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		let parsed;
		try {
			parsed = new URL(current);
		} catch {
			throw new PublicFetchError('The link is not a valid URL.');
		}
		if (parsed.protocol !== 'https:') throw new PublicFetchError('The link must use https.');
		if (!(await resolvesPublic(parsed.hostname))) throw new PublicFetchError('The link must point to a public host.');

		let res;
		try {
			res = await fetch(parsed, { ...init, redirect: 'manual', signal: AbortSignal.timeout(init.timeoutMs ?? 10_000) });
		} catch {
			throw new PublicFetchError('The link could not be reached.');
		}
		if (res.status >= 300 && res.status < 400) {
			const location = res.headers.get('location');
			await res.body?.cancel();
			if (!location) throw new PublicFetchError('The link redirects nowhere.');
			current = new URL(location, parsed).toString();
			continue;
		}
		return res;
	}
	throw new PublicFetchError('The link redirects too many times.');
}

/** Download an image link into memory, refusing anything that is not an allowed image or is too big. */
export async function fetchImage(url) {
	const res = await publicFetch(url, { headers: { accept: 'image/*' } });
	if (!res.ok) {
		await res.body?.cancel();
		throw new PublicFetchError(`The image link answered HTTP ${res.status}.`);
	}
	const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
	if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
		await res.body?.cancel();
		throw new PublicFetchError(`The image link serves ${contentType || 'unknown content'}; use PNG, JPG, GIF, WebP or SVG.`);
	}
	const declared = Number(res.headers.get('content-length') || 0);
	if (declared > MAX_IMAGE_BYTES) {
		await res.body?.cancel();
		throw new PublicFetchError('The image must be 5 MB or smaller.');
	}

	// Content-Length can lie or be absent, so the cap is enforced on the bytes
	// actually read.
	const chunks = [];
	let size = 0;
	for await (const chunk of res.body) {
		size += chunk.length;
		if (size > MAX_IMAGE_BYTES) throw new PublicFetchError('The image must be 5 MB or smaller.');
		chunks.push(chunk);
	}
	return { bytes: Buffer.concat(chunks), contentType };
}

async function resolvesPublic(hostname) {
	const host = hostname.replace(/^\[|\]$/g, '');
	if (host === 'localhost' || host.endsWith('.localhost')) return false;
	let addresses;
	if (isIP(host)) addresses = [host];
	else {
		try {
			addresses = (await lookup(host, { all: true })).map((a) => a.address);
		} catch {
			return false;
		}
	}
	return addresses.length > 0 && addresses.every((address) => !isPrivate(address));
}

export function isPrivate(address) {
	if (address.includes(':')) {
		const a = address.toLowerCase();
		if (a.startsWith('::ffff:')) return isPrivate(a.slice(7));
		return a === '::' || a === '::1' || a.startsWith('fc') || a.startsWith('fd') || a.startsWith('fe80');
	}
	const [a, b] = address.split('.').map(Number);
	return (
		a === 0 ||
		a === 10 ||
		a === 127 ||
		(a === 100 && b >= 64 && b <= 127) ||
		(a === 169 && b === 254) ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 168) ||
		a >= 224
	);
}
