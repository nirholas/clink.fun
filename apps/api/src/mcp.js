// The MCP server.
//
// Exposes the launchpad as Model Context Protocol tools so an assistant can use
// it directly: browse markets and coins, price trades, check fees, and plan a
// launch. Planning is as far as a model gets. `plan_launch` returns a link; the
// person opens it, connects their own wallet, reviews, and signs. Nothing here
// holds a key that can spend.
//
// Stateless streamable HTTP: every request gets a fresh server and transport,
// so the endpoint scales to zero and any instance can answer any call.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { formatUnits, isAddress, parseUnits } from 'viem';
import { z } from 'zod';
import { EXPLORER, LAUNCHPAD, cached, launchpadAbi, publicClient } from './chain.js';
import { PUBLIC_URL, coinPage } from './context.js';
import { LaunchError, draftStatus, launchUrl, planLaunch, publicDraft, resolveDraft } from './launches.js';
import { PublicFetchError } from './net.js';
import { STOCKS, findStock } from './stocks.js';
import { feesCached, listTokensCached, tokenCached } from './tokens.js';

const INSTRUCTIONS = `clink.fun launches coins on Robinhood Chain that are quoted in tokenized stocks (NVDA, TSLA, AAPL and more) instead of ETH or a stablecoin. Each coin has a fixed 1B supply split across one to five stock markets, each its own bonding curve with liquidity locked forever. The creator earns 70% of every swap fee, paid in the paired stock.

To launch: call plan_launch with what the user asked for. It validates everything and returns a launch link valid for 24 hours. Show the user the summary and the link. They open it, connect their own wallet, review, and sign; nothing is deployed and nothing is spent until they do. Afterwards, launch_status returns the coin's address.

Never invent a name, ticker or logo: ask the user for anything missing. Use list_markets to see which stocks can be paired. Coins are speculative; the pairing is launch liquidity, not backing, and a coin is not a claim on the stock.`;

function reply(text, structured) {
	return { content: [{ type: 'text', text }], ...(structured ? { structuredContent: structured } : {}) };
}

function failure(message) {
	return { content: [{ type: 'text', text: message }], isError: true };
}

function explain(error) {
	if (error instanceof LaunchError || error instanceof PublicFetchError) return error.message;
	if (error instanceof z.ZodError) return error.issues[0]?.message ?? 'Invalid input.';
	console.error('[mcp]', error);
	return 'The launchpad hit an unexpected error reading the chain. Try again in a moment.';
}

/** Run a tool body, turning any failure into a readable tool error instead of a protocol error. */
const guarded = (fn) => async (args, extra) => {
	try {
		return await fn(args, extra);
	} catch (error) {
		return failure(explain(error));
	}
};

/** Which assistant is calling, from the User-Agent. Stored on the draft and shown on the coin. */
export function clientHint(headers) {
	const raw = headers?.['user-agent'];
	const ua = (Array.isArray(raw) ? raw[0] : raw)?.trim();
	if (!ua) return null;
	if (/claude|anthropic/i.test(ua)) return 'claude';
	if (/chatgpt|openai/i.test(ua)) return 'chatgpt';
	if (/cursor/i.test(ua)) return 'cursor';
	return ua.slice(0, 80);
}

const CLIENT_NAMES = { claude: 'Claude', chatgpt: 'ChatGPT', cursor: 'Cursor' };
const clientName = (client) => CLIENT_NAMES[client] ?? client ?? 'an assistant';

const pct = (bps) => `${Number((bps / 100).toFixed(2))}%`;
const amount = (value, digits = 6) => {
	const n = Number(value);
	if (!Number.isFinite(n)) return String(value);
	if (n === 0) return '0';
	return n >= 1
		? n.toLocaleString('en-US', { maximumFractionDigits: digits })
		: n.toLocaleString('en-US', { maximumSignificantDigits: 4, maximumFractionDigits: 20 });
};

function coinLine(token) {
	const pairs = token.pairs.map((p) => `${p.quoteSymbol} ${pct(p.weightBps)}`).join(' / ');
	const from = token.origin?.channel === 'prompt' ? `, launched from ${clientName(token.origin.client)}` : '';
	return `$${token.symbol} ${token.name} (${pairs})${from}: ${coinPage(token.address)}`;
}

function marketOf(token, market) {
	if (!market) {
		if (token.pairs.length === 1) return token.pairs[0];
		throw new LaunchError(`$${token.symbol} trades in ${token.pairs.map((p) => p.quoteSymbol).join(', ')}. Say which market.`);
	}
	const stock = findStock(market);
	const pair = stock && token.pairs.find((p) => p.quoteToken.toLowerCase() === stock.address.toLowerCase());
	if (!pair) throw new LaunchError(`$${token.symbol} has no ${market} market. It trades in ${token.pairs.map((p) => p.quoteSymbol).join(', ')}.`);
	return pair;
}

async function readCoin(address) {
	if (!isAddress(address)) throw new LaunchError('That is not a 0x token address.');
	try {
		return await tokenCached(address);
	} catch {
		throw new LaunchError('No coin launched here at that address.', 404);
	}
}

function draftSummary(draft, fees) {
	const status = draftStatus(draft);
	if (status === 'launched') {
		return [
			`$${draft.symbol} is live on Robinhood Chain.`,
			`Coin: ${draft.token}`,
			`Page: ${coinPage(draft.token)}`,
			`Transaction: ${EXPLORER}/tx/${draft.txHash}`,
		].join('\n');
	}
	const lines = [
		`${draft.name} ($${draft.symbol}) on Robinhood Chain`,
		`Markets: ${draft.markets.map((m) => `${m.symbol} ${pct(m.weightBps)}`).join(' / ')}`,
		draft.description ? `Description: ${draft.description}` : null,
		draft.image ? `Logo: ${draft.image}` : 'Logo: none (the user can add one on the launch page)',
		draft.devBuy ? `Launch buy: ${draft.devBuy} ${draft.markets[0].symbol}` : null,
		draft.feeWallet ? `Fee wallet: ${draft.feeWallet}` : 'Fee wallet: the wallet that signs',
		fees
			? `Cost: ${amount(fees.launchFeeEth)} ETH launch fee plus gas. Swap fee ${pct(fees.swapFeeBps)}, creator keeps ${pct(fees.creatorShareBps)} of it.`
			: null,
		'',
		status === 'expired'
			? 'This draft expired unsigned. Call plan_launch again for a fresh link.'
			: `Open to review and sign with your wallet (valid until ${draft.expiresAt}): ${launchUrl(draft.id)}`,
	];
	return lines.filter((line) => line !== null).join('\n');
}

export function buildServer({ client, allowPlan }) {
	const server = new McpServer({ name: 'clink.fun', version: '1.0.0' }, { instructions: INSTRUCTIONS });

	server.registerTool(
		'list_markets',
		{
			title: 'Stock markets',
			description: 'The tokenized stocks a coin can be paired against, with their token addresses on Robinhood Chain.',
			inputSchema: {},
			annotations: { readOnlyHint: true, openWorldHint: false },
		},
		guarded(async () => {
			const markets = STOCKS.map((s) => ({ symbol: s.symbol, address: s.address }));
			return reply(
				`${markets.length} markets. Pair a coin with one to five of them:\n${markets.map((m) => m.symbol).join(', ')}`,
				{ markets },
			);
		}),
	);

	server.registerTool(
		'fee_schedule',
		{
			title: 'Fees',
			description: 'The launch fee, the swap fee, and the creator share of swap fees, read live from the contract.',
			inputSchema: {},
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		guarded(async () => {
			const fees = await feesCached();
			if (!fees) return failure('The launchpad is not configured on this deployment.');
			return reply(
				[
					`Launch fee: ${amount(fees.launchFeeEth)} ETH, once, plus gas.`,
					`Swap fee: ${pct(fees.swapFeeBps)} of every trade, taken in the paired stock.`,
					`Creator share: ${pct(fees.creatorShareBps)} of swap fees, claimable in one transaction across every market.`,
					'Liquidity is locked forever. There is no graduation and no migration.',
				].join('\n'),
				{ launchFeeEth: fees.launchFeeEth, swapFeeBps: fees.swapFeeBps, creatorShareBps: fees.creatorShareBps, launchpad: LAUNCHPAD },
			);
		}),
	);

	server.registerTool(
		'list_coins',
		{
			title: 'Coins',
			description: 'Launched coins, newest first, with their stock pairings. Optionally only coins launched from an assistant, or only coins in one market.',
			inputSchema: {
				limit: z.number().int().min(1).max(25).optional().describe('How many coins, up to 25. Default 10.'),
				offset: z.number().int().min(0).optional(),
				from_assistant: z.boolean().optional().describe('Only coins planned through this MCP server.'),
				market: z.string().optional().describe('Only coins paired with this stock, e.g. "NVDA".'),
			},
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		guarded(async ({ limit = 10, offset = 0, from_assistant, market }) => {
			const stock = market ? findStock(market) : null;
			if (market && !stock) return failure(`${market} is not a market here. list_markets shows them all.`);
			// A market filter is applied after the read, so read a full page to fill it.
			const page = await listTokensCached({ limit: stock ? 100 : limit, offset: stock ? 0 : offset, origin: from_assistant ? 'prompt' : undefined });
			let items = page.items;
			if (stock) {
				items = items.filter((t) => t.pairs.some((p) => p.quoteToken.toLowerCase() === stock.address.toLowerCase())).slice(offset, offset + limit);
			}
			if (!items.length) return reply('No coins match yet.', { total: 0, coins: [] });
			const coins = items.map((t) => ({
				address: t.address,
				name: t.name,
				symbol: t.symbol,
				page: coinPage(t.address),
				origin: t.origin,
				pairs: t.pairs.map((p) => ({ market: p.quoteSymbol, weightBps: p.weightBps, price: p.priceQuote, soldPct: p.soldPct })),
			}));
			return reply(items.map(coinLine).join('\n'), { total: page.total, coins });
		}),
	);

	server.registerTool(
		'get_coin',
		{
			title: 'Coin details',
			description: 'One coin: its price and curve in every paired market, how much each curve has raised, its creator and where it was launched from.',
			inputSchema: { address: z.string().describe('The coin contract address (0x...).') },
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		guarded(async ({ address }) => {
			const token = await readCoin(address);
			const lines = [
				`${token.name} ($${token.symbol})`,
				...token.pairs.map(
					(p) =>
						`${p.quoteSymbol} market (${pct(p.weightBps)} of supply): price ${amount(p.priceQuote, 10)} ${p.quoteSymbol}, raised ${amount(p.raisedQuote)} ${p.quoteSymbol}, ${p.soldPct}% of its allocation sold`,
				),
				`Creator: ${token.creator}`,
				token.origin?.channel === 'prompt'
					? `Launched from ${clientName(token.origin.client)} via MCP${token.origin.verified ? ' (signed origin)' : ''}.`
					: null,
				`Page: ${coinPage(token.address)}`,
			];
			return reply(lines.filter(Boolean).join('\n'), { ...token, page: coinPage(token.address) });
		}),
	);

	server.registerTool(
		'quote_trade',
		{
			title: 'Price a trade',
			description: 'Price a buy or sell against one of a coin\'s stock markets before committing. A buy spends the stock; a sell spends the coin.',
			inputSchema: {
				address: z.string().describe('The coin contract address.'),
				side: z.enum(['buy', 'sell']),
				amount: z.string().describe('For a buy, how much of the stock to spend. For a sell, how many coins to sell. A decimal like "2.5".'),
				market: z.string().optional().describe('Which stock market to trade in, e.g. "NVDA". Required when the coin has more than one.'),
			},
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		guarded(async ({ address, side, amount: size, market }) => {
			const token = await readCoin(address);
			const pair = marketOf(token, market);
			if (!/^\d+(\.\d{1,18})?$/.test(size.trim())) return failure('The amount must be a positive decimal, like "2.5".');
			const units = parseUnits(size.trim(), 18);
			if (units === 0n) return failure('The amount must be above zero.');
			const fn = side === 'buy' ? 'quoteBuy' : 'quoteSell';
			const [out, fee] = await publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: fn, args: [token.address, pair.quoteToken, units] });
			const outText = formatUnits(out, 18);
			const feeText = formatUnits(fee, 18);
			const text =
				side === 'buy'
					? `Spending ${size} ${pair.quoteSymbol} buys about ${amount(outText)} $${token.symbol} (fee ${amount(feeText)} ${pair.quoteSymbol}).`
					: `Selling ${size} $${token.symbol} returns about ${amount(outText)} ${pair.quoteSymbol} after a ${amount(feeText)} ${pair.quoteSymbol} fee.`;
			return reply(`${text}\nTrade on the coin page: ${coinPage(token.address)}`, {
				side,
				market: pair.quoteSymbol,
				amountIn: size,
				amountOut: outText,
				fee: feeText,
				page: coinPage(token.address),
			});
		}),
	);

	server.registerTool(
		'claimable_fees',
		{
			title: 'Claimable fees',
			description: 'Creator fees a wallet can claim right now, per stock. Claiming is one transaction on the portfolio page.',
			inputSchema: { wallet: z.string().describe('The fee recipient wallet (0x...).') },
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		guarded(async ({ wallet }) => {
			if (!isAddress(wallet)) return failure('That is not a 0x wallet address.');
			const balances = await cached(`claimable:${wallet.toLowerCase()}`, 15_000, () =>
				Promise.all(
					STOCKS.map((s) =>
						publicClient.readContract({ address: LAUNCHPAD, abi: launchpadAbi, functionName: 'claimable', args: [wallet, s.address] }),
					),
				),
			);
			const owed = STOCKS.map((s, i) => ({ symbol: s.symbol, address: s.address, amount: formatUnits(balances[i], 18) })).filter(
				(_s, i) => balances[i] > 0n,
			);
			if (!owed.length) return reply(`Nothing to claim for ${wallet} yet.`, { wallet, claimable: [] });
			return reply(
				`${wallet} can claim:\n${owed.map((o) => `${amount(o.amount)} ${o.symbol}`).join('\n')}\nClaim everything in one transaction at ${PUBLIC_URL}/portfolio`,
				{ wallet, claimable: owed },
			);
		}),
	);

	server.registerTool(
		'plan_launch',
		{
			title: 'Plan a coin launch',
			description:
				'Validate a new coin and return a launch link. The user signs and pays the launch fee from their own wallet at that link; this tool never deploys or spends anything.',
			inputSchema: {
				name: z.string().describe('Coin name, up to 32 characters.'),
				symbol: z.string().describe('Ticker, 2 to 10 letters or digits, without the $.'),
				markets: z.array(z.string()).min(1).max(5).describe('One to five stock symbols to pair with, e.g. ["NVDA", "TSLA"].'),
				weights: z
					.array(z.number())
					.optional()
					.describe('Optional share of supply per market in percent, same order as markets, adding up to 100. Defaults to an even split.'),
				description: z.string().optional().describe('Optional description, up to 480 characters.'),
				image_url: z.string().optional().describe('Optional public https link to the logo (PNG, JPG, GIF, WebP or SVG, up to 5 MB). It is copied and stored permanently.'),
				website: z.string().optional(),
				twitter: z.string().optional(),
				telegram: z.string().optional(),
				dev_buy: z
					.string()
					.optional()
					.describe('Optional amount of the first market\'s stock the creator spends buying their own coin at launch, e.g. "1.5". Needs that stock in the wallet.'),
				fee_wallet: z.string().optional().describe('Optional 0x address to receive creator fees. Defaults to the wallet that signs.'),
			},
			annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
		},
		guarded(async (args) => {
			if (!allowPlan()) return failure('Too many launches planned from this address. Wait a few minutes and try again.');
			const draft = await planLaunch(
				{
					name: args.name,
					symbol: args.symbol,
					markets: args.markets,
					weights: args.weights,
					description: args.description,
					imageUrl: args.image_url,
					website: args.website,
					twitter: args.twitter,
					telegram: args.telegram,
					devBuy: args.dev_buy,
					feeWallet: args.fee_wallet,
				},
				{ client },
			);
			const fees = await feesCached().catch(() => null);
			return reply(draftSummary(draft, fees), {
				...publicDraft(draft),
				launchFeeEth: fees?.launchFeeEth ?? null,
			});
		}),
	);

	server.registerTool(
		'launch_status',
		{
			title: 'Check a planned launch',
			description: 'Whether a planned launch has been signed yet, and the coin address and links once it has.',
			inputSchema: { draft_id: z.string().describe('The id returned by plan_launch.') },
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		guarded(async ({ draft_id }) => {
			const draft = await resolveDraft(draft_id.trim());
			if (!draft) return failure('No planned launch with that id.');
			const fees = await feesCached().catch(() => null);
			return reply(draftSummary(draft, fees), publicDraft(draft));
		}),
	);

	return server;
}

// A small per-address budget on planning, which writes drafts and fetches
// images. Reads are cached and cheap, so they are not limited.
const PLAN_LIMIT = 20;
const PLAN_WINDOW_MS = 10 * 60 * 1000;
const planHits = new Map();

function planBudget(ip) {
	return () => {
		const now = Date.now();
		const recent = (planHits.get(ip) ?? []).filter((t) => now - t < PLAN_WINDOW_MS);
		if (recent.length >= PLAN_LIMIT) return false;
		recent.push(now);
		planHits.set(ip, recent);
		if (planHits.size > 10_000) planHits.delete(planHits.keys().next().value);
		return true;
	};
}

export function clientIp(req) {
	const forwarded = req.headers['x-forwarded-for'];
	const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
	return first || req.socket.remoteAddress || 'unknown';
}

/** Answer one MCP request on a Node request/response pair. */
export async function handleMcp(req, res, body) {
	const server = buildServer({ client: clientHint(req.headers), allowPlan: planBudget(clientIp(req)) });
	const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
	res.on('close', () => {
		transport.close();
		server.close();
	});
	await server.connect(transport);
	await transport.handleRequest(req, res, body);
}

