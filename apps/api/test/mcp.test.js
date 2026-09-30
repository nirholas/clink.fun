// MCP server, launch planning and origin provenance. Runs offline: every case
// here is decided before the server needs to read the chain.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const dataDir = await mkdtemp(join(tmpdir(), 'clink-test-'));
process.env.CLINK_DATA_DIR = dataDir;
process.env.CLINK_PUBLIC_URL = 'https://clink.test';
process.env.CLINK_LAUNCHPAD = '0x6a546350f79DE0Fc83ADfCe99233183aA090fa15';
process.env.CLINK_ATTESTER_KEY = `0x${'11'.repeat(32)}`;

const { createApp } = await import('../src/app.js');
const { store } = await import('../src/context.js');
const { evenWeights, sanitizeName, sanitizeSymbol, storeDescriptor, planLaunch, publicDraft, DRAFT_TTL_MS } = await import('../src/launches.js');
const { attesterAddress, verifyOrigin, originMessage } = await import('../src/origin.js');
const { isPrivate } = await import('../src/net.js');
const { findStock } = await import('../src/stocks.js');

let server;
let client;

before(async () => {
	server = createApp();
	await new Promise((resolve) => server.listen(0, resolve));
	client = new Client({ name: 'test', version: '1' });
	await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${server.address().port}/mcp`)));
});

after(async () => {
	await client?.close();
	await new Promise((resolve) => server.close(resolve));
	await rm(dataDir, { recursive: true, force: true });
});

async function draftFixture(overrides = {}) {
	const now = Date.now();
	const draft = {
		id: `t${Math.random().toString(36).slice(2, 12)}`,
		channel: 'prompt',
		client: 'claude',
		status: 'planned',
		createdAt: new Date(now).toISOString(),
		expiresAt: new Date(now + DRAFT_TTL_MS).toISOString(),
		name: 'Chip Dip',
		symbol: 'CHIPS',
		links: {},
		markets: [{ symbol: 'NVDA', address: findStock('NVDA').address, weightBps: 10_000 }],
		fromBlock: '1',
		scannedTo: '0',
		...overrides,
	};
	return store.putDraft(draft);
}

test('lists every tool the roadmap specifies', async () => {
	const { tools } = await client.listTools();
	assert.deepEqual(
		tools.map((t) => t.name).sort(),
		['claimable_fees', 'fee_schedule', 'get_coin', 'launch_status', 'list_coins', 'list_markets', 'plan_launch', 'quote_trade'],
	);
	const plan = tools.find((t) => t.name === 'plan_launch');
	assert.equal(plan.annotations.destructiveHint, false);
	assert.match(plan.description, /never deploys or spends/);
});

test('list_markets returns the stock registry', async () => {
	const result = await client.callTool({ name: 'list_markets', arguments: {} });
	assert.ok(result.structuredContent.markets.some((m) => m.symbol === 'NVDA'));
});

test('plan_launch refuses bad input with a readable message', async () => {
	const cases = [
		[{ name: 'Chip', symbol: 'C', markets: ['NVDA'] }, /ticker needs at least two/],
		[{ name: 'Chip', symbol: 'CHIP', markets: ['ZZZZ'] }, /not a market here/],
		[{ name: 'Chip', symbol: 'CHIP', markets: ['NVDA', 'NVDAx'] }, /only once/],
		[{ name: 'Chip', symbol: 'CHIP', markets: ['NVDA', 'AMD'], weights: [60, 30] }, /add up to exactly 100/],
		[{ name: 'Chip', symbol: 'CHIP', markets: ['NVDA'], dev_buy: 'lots' }, /positive amount of NVDA/],
		[{ name: 'Chip', symbol: 'CHIP', markets: ['NVDA'], fee_wallet: 'me' }, /0x address/],
	];
	for (const [args, message] of cases) {
		const result = await client.callTool({ name: 'plan_launch', arguments: args });
		assert.equal(result.isError, true, JSON.stringify(args));
		assert.match(result.content[0].text, message);
	}
});

test('launch_status on an unknown draft is a tool error, not a crash', async () => {
	const result = await client.callTool({ name: 'launch_status', arguments: { draft_id: 'nosuchdraft1' } });
	assert.equal(result.isError, true);
});

test('validation helpers match the launch form', () => {
	assert.deepEqual(evenWeights(3), [3334, 3333, 3333]);
	assert.equal(evenWeights(7).reduce((a, b) => a + b, 0), 10_000);
	assert.equal(sanitizeSymbol('$chip-s!'), 'CHIPS');
	assert.equal(sanitizeName('  Chip​   Dip  '), 'Chip Dip');
	assert.equal(findStock('$nvdax').symbol, 'NVDA');
	assert.equal(findStock('SPCX').symbol, 'SPCX');
});

test('logo links to private addresses are refused', async () => {
	for (const address of ['127.0.0.1', '10.1.2.3', '169.254.169.254', '192.168.0.1', '::1', 'fd00::1', '::ffff:10.0.0.1']) {
		assert.equal(isPrivate(address), true, address);
	}
	assert.equal(isPrivate('140.82.112.3'), false);
	await assert.rejects(planLaunch({ name: 'Chip', symbol: 'CHIP', markets: ['NVDA'], imageUrl: 'http://example.com/a.png' }), /must use https/);
	await assert.rejects(planLaunch({ name: 'Chip', symbol: 'CHIP', markets: ['NVDA'], imageUrl: 'not a url' }), /not a valid URL/);
});

test('a draft-bound descriptor carries an origin the attester signed', async () => {
	const draft = await draftFixture();
	const stored = await storeDescriptor({ name: 'Chip Dip', symbol: 'chips', draft: draft.id });
	const descriptor = JSON.parse(stored.bytes);
	assert.equal(descriptor.symbol, 'CHIPS');
	assert.equal(descriptor.origin.channel, 'prompt');
	assert.equal(descriptor.origin.draft, draft.id);
	assert.equal(descriptor.origin.client, 'claude');
	assert.equal(descriptor.origin.attester, attesterAddress());
	assert.equal(await verifyOrigin(descriptor), true);

	// Changing any signed field breaks the signature.
	assert.equal(await verifyOrigin({ ...descriptor, symbol: 'OTHER' }), false);
	assert.match(originMessage({ channel: 'prompt', draft: 'x', name: 'n', symbol: 's' }), /^clink\.fun launch origin v1\n/);
});

test('callers cannot write an origin themselves', async () => {
	const stored = await storeDescriptor({ name: 'Fake', symbol: 'FAKE', origin: { channel: 'prompt', draft: 'forged' } });
	assert.equal(JSON.parse(stored.bytes).origin, undefined);
});

test('expired, launched and unknown drafts cannot mint a descriptor', async () => {
	const expired = await draftFixture({ expiresAt: new Date(Date.now() - 1000).toISOString() });
	await assert.rejects(storeDescriptor({ name: 'A', symbol: 'AA', draft: expired.id }), (e) => e.status === 410);
	const launched = await draftFixture({ status: 'launched' });
	await assert.rejects(storeDescriptor({ name: 'A', symbol: 'AA', draft: launched.id }), (e) => e.status === 409);
	await assert.rejects(storeDescriptor({ name: 'A', symbol: 'AA', draft: 'unknowndraft' }), (e) => e.status === 404);
});

test('the public draft shape exposes the launch link and status', async () => {
	const draft = await draftFixture();
	const shaped = publicDraft(draft);
	assert.equal(shaped.status, 'awaiting signature');
	assert.equal(shaped.launchUrl, `https://clink.test/launch?draft=${draft.id}`);
	assert.equal('scannedTo' in shaped, false);
	assert.equal(publicDraft({ ...draft, expiresAt: new Date(0).toISOString() }).status, 'expired');
});
