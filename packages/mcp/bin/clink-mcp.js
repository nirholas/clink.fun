#!/usr/bin/env node
// Stdio bridge to the hosted clink.fun MCP server, for clients that start
// servers with `npx` (Claude Desktop config files, Cursor, Cline, Windsurf).
// Tools are discovered from the remote server at startup, so this package
// never drifts from the live tool set.
//
//   CLINK_MCP_URL   remote endpoint; defaults to the production server below

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const VERSION = '0.1.0';
const DEFAULT_URL = 'https://clink-fun-93741856042.us-central1.run.app/mcp';
const REMOTE = new URL(process.env.CLINK_MCP_URL || DEFAULT_URL);

let remote;
async function connectRemote() {
	if (remote) return remote;
	const client = new Client({ name: 'clink-mcp-bridge', version: VERSION });
	await client.connect(new StreamableHTTPClientTransport(REMOTE));
	remote = client;
	return client;
}

async function withRemote(fn) {
	try {
		return await fn(await connectRemote());
	} catch (error) {
		// One reconnect covers a dropped connection or a restarted instance; a second failure is real.
		remote = undefined;
		try {
			return await fn(await connectRemote());
		} catch {
			throw new Error(`Could not reach ${REMOTE.href}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}

const server = new Server(
	{ name: 'clink', version: VERSION },
	{
		capabilities: { tools: {} },
		instructions:
			'Launch coins on Robinhood Chain quoted in tokenized stocks. plan_launch validates a launch and returns a link; the user signs and pays from their own wallet there. Nothing is deployed or spent before they sign.',
	},
);

server.setRequestHandler(ListToolsRequestSchema, async () => withRemote((c) => c.listTools()));
server.setRequestHandler(CallToolRequestSchema, async (request) =>
	withRemote((c) => c.callTool({ name: request.params.name, arguments: request.params.arguments ?? {} })),
);

await server.connect(new StdioServerTransport());
