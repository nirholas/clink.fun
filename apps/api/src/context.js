// Process-wide configuration and the one content store, shared by the HTTP
// routes and the MCP tools so both read and write exactly the same state.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore } from './store.js';

export const PORT = Number(process.env.PORT || 8787);
export const PUBLIC_URL = (process.env.CLINK_PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
export const DATA_DIR = process.env.CLINK_DATA_DIR || join(dirname(fileURLToPath(import.meta.url)), '../../../data');
// In production one container serves the built app and the API from the same
// origin, which is what the frontend already assumes: it only ever calls
// /api/* relative paths, so there is no CORS difference between dev and prod.
export const WEB_DIR = process.env.CLINK_WEB_DIR || '';

export const store = createStore(DATA_DIR);

export const coinPage = (address) => `${PUBLIC_URL}/token/${address}`;
