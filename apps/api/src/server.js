// Entry point: the routes live in app.js so tests can mount them on a free port.

import { LAUNCHPAD } from './chain.js';
import { createApp } from './app.js';
import { DATA_DIR, PORT, PUBLIC_URL, WEB_DIR } from './context.js';
import { attesterAddress } from './origin.js';
import { MAX_IMAGE_BYTES } from './store.js';

createApp().listen(PORT, () => {
	console.log(`[api] listening on ${PORT}`);
	console.log(`[api] data dir ${DATA_DIR}`);
	console.log(`[api] launchpad ${LAUNCHPAD || 'NOT SET (set CLINK_LAUNCHPAD)'}`);
	console.log(`[api] mcp ${PUBLIC_URL}/mcp`);
	console.log(`[api] origin attester ${attesterAddress() || 'not set (MCP launches carry an unsigned origin)'}`);
	console.log(`[api] max image ${(MAX_IMAGE_BYTES / 1024 / 1024).toFixed(0)}MB`);
	console.log(`[api] web dir ${WEB_DIR || 'not serving static files'}`);
});
