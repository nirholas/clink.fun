// Content-addressed storage for images and token descriptors.
//
// Everything is keyed by the SHA-256 of its own bytes, which makes writes
// idempotent, makes cache headers trivially correct (content at a hash can
// never change, so it is immutable forever), and means the same upload from two
// people costs one copy.
//
// Files on disk rather than a database. This holds two kinds of blob that are
// written once and read forever; a database would add an operational dependency
// and buy nothing.

import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const MIME_EXT = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/svg+xml': 'svg',
};

export const ALLOWED_IMAGE_TYPES = Object.keys(MIME_EXT);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

export function createStore(rootDir) {
	const imagesDir = join(rootDir, 'images');
	const metaDir = join(rootDir, 'metadata');
	const draftsDir = join(rootDir, 'drafts');

	const ready = Promise.all([
		mkdir(imagesDir, { recursive: true }),
		mkdir(metaDir, { recursive: true }),
		mkdir(draftsDir, { recursive: true }),
	]);

	// Two levels of fan-out. A single directory with a hundred thousand entries
	// is slow to list and unpleasant to back up.
	const shard = (dir, hash, ext) =>
		join(dir, hash.slice(0, 2), hash.slice(2, 4), ext ? `${hash}.${ext}` : hash);

	return {
		async putImage(bytes, contentType) {
			await ready;
			if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
				throw Object.assign(new Error(`unsupported image type: ${contentType}`), { status: 415 });
			}
			if (bytes.length === 0) throw Object.assign(new Error('empty image'), { status: 400 });
			if (bytes.length > MAX_IMAGE_BYTES) {
				throw Object.assign(new Error(`image over ${MAX_IMAGE_BYTES} bytes`), { status: 413 });
			}
			const hash = sha256(bytes);
			const path = shard(imagesDir, hash, MIME_EXT[contentType]);
			await mkdir(dirname(path), { recursive: true });
			await writeFile(path, bytes);
			await writeFile(`${path}.type`, contentType, 'utf8');
			return { hash, contentType };
		},

		async getImage(hash) {
			await ready;
			for (const ext of Object.values(MIME_EXT)) {
				const path = shard(imagesDir, hash, ext);
				try {
					await stat(path);
					const [bytes, contentType] = await Promise.all([
						readFile(path),
						readFile(`${path}.type`, 'utf8').catch(() => 'application/octet-stream'),
					]);
					return { bytes, contentType };
				} catch { /* try the next extension */ }
			}
			return null;
		},

		/**
		 * Store a descriptor and return the hash of the exact bytes stored.
		 *
		 * The caller commits that hash on chain, so the bytes are serialized
		 * once here and reused for both the file and the digest. Serializing
		 * twice risks a key order that differs between passes, and then the
		 * on-chain commitment points at a document that no longer matches.
		 */
		async putMetadata(descriptor) {
			await ready;
			const body = JSON.stringify(descriptor);
			const hash = sha256(Buffer.from(body, 'utf8'));
			const path = shard(metaDir, hash, 'json');
			await mkdir(dirname(path), { recursive: true });
			await writeFile(path, body, 'utf8');
			return { hash, body };
		},

		async getMetadata(hash) {
			await ready;
			try {
				return await readFile(shard(metaDir, hash, 'json'), 'utf8');
			} catch {
				return null;
			}
		},

		/**
		 * Launch drafts are the one mutable record here: a draft is written when
		 * an assistant plans a launch and updated once, when the launch is found
		 * on chain. The write goes to a temp file and is renamed into place so a
		 * reader never sees half a document.
		 */
		async putDraft(draft) {
			await ready;
			const path = join(draftsDir, `${draft.id}.json`);
			const temp = `${path}.${process.pid}.${Date.now()}.tmp`;
			await writeFile(temp, JSON.stringify(draft), 'utf8');
			await rename(temp, path);
			return draft;
		},

		async getDraft(id) {
			await ready;
			if (!/^[A-Za-z0-9_-]{8,32}$/.test(id)) return null;
			try {
				return JSON.parse(await readFile(join(draftsDir, `${id}.json`), 'utf8'));
			} catch {
				return null;
			}
		},
	};
}
