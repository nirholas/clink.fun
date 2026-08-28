// Trade history from chain events.
//
// The launchpad emits `Swap` on every trade, which carries everything a candle
// needs: direction, quote amount, token amount and fee. There is no separate
// database and no ingestion pipeline. The chain is the log; this reads it,
// buckets it, and caches the result.
//
// Two things the RPC does not hand over for free. Logs carry no timestamp, so
// block times are fetched once per distinct block and cached forever (a mined
// block's timestamp cannot change). And the node prunes historical state, so
// this only ever reads logs, never `eth_call` at an old block.

import { parseAbiItem } from 'viem';
import { publicClient, LAUNCHPAD, cached } from './chain.js';

export const START_BLOCK = BigInt(process.env.CLINK_START_BLOCK || '48325951');

export const swapEvent = parseAbiItem(
	'event Swap(address indexed token, address indexed quoteToken, address indexed trader, bool isBuy, uint256 quoteAmount, uint256 tokenAmount, uint256 feeAmount)',
);

// Public RPCs cap how many blocks one getLogs may span. Chunking keeps the
// reader working when that cap tightens rather than failing the whole range.
const CHUNK = 45_000n;

const blockTimes = new Map();

async function timestampOf(blockNumber) {
	const key = blockNumber.toString();
	const hit = blockTimes.get(key);
	if (hit) return hit;
	const block = await publicClient.getBlock({ blockNumber });
	const seconds = Number(block.timestamp);
	blockTimes.set(key, seconds);
	return seconds;
}

/**
 * Every swap for one token, oldest first.
 *
 * @param {`0x${string}`} token
 * @param {`0x${string}`} [quoteToken] Restrict to one pool.
 */
export async function fetchTrades(token, quoteToken) {
	if (!LAUNCHPAD) return [];
	const head = await publicClient.getBlockNumber();

	const logs = [];
	for (let from = START_BLOCK; from <= head; from += CHUNK) {
		const to = from + CHUNK - 1n > head ? head : from + CHUNK - 1n;
		const batch = await publicClient.getLogs({
			address: LAUNCHPAD,
			event: swapEvent,
			args: quoteToken ? { token, quoteToken } : { token },
			fromBlock: from,
			toBlock: to,
		});
		logs.push(...batch);
	}

	const uniqueBlocks = [...new Set(logs.map((log) => log.blockNumber))];
	await Promise.all(uniqueBlocks.map(timestampOf));

	return logs
		.map((log) => {
			const { isBuy, quoteAmount, tokenAmount, feeAmount, trader, quoteToken: q } = log.args;
			// Price in quote units per whole token. Guarding the divide by zero
			// matters: a trade that rounds to zero tokens would otherwise poison
			// every candle it touches with Infinity.
			const price = tokenAmount === 0n ? 0 : Number(quoteAmount) / Number(tokenAmount);
			return {
				txHash: log.transactionHash,
				block: Number(log.blockNumber),
				time: blockTimes.get(log.blockNumber.toString()) ?? 0,
				trader,
				quoteToken: q,
				isBuy,
				quoteAmount: quoteAmount.toString(),
				tokenAmount: tokenAmount.toString(),
				feeAmount: feeAmount.toString(),
				price,
			};
		})
		.sort((a, b) => a.time - b.time || a.block - b.block);
}

export const INTERVALS = {
	'1m': 60,
	'5m': 300,
	'15m': 900,
	'1h': 3_600,
	'4h': 14_400,
	'1d': 86_400,
};

/**
 * OHLCV candles from a trade list.
 *
 * Gaps are filled forward with flat candles rather than left empty. A chart
 * that skips the hours nobody traded compresses time and makes a quiet coin
 * look busy, which is the opposite of what a reader needs.
 */
export function toCandles(trades, intervalSeconds) {
	if (!trades.length) return [];
	const buckets = new Map();

	for (const trade of trades) {
		if (!trade.price) continue;
		const bucket = Math.floor(trade.time / intervalSeconds) * intervalSeconds;
		const existing = buckets.get(bucket);
		const volume = Number(trade.quoteAmount) / 1e18;
		if (!existing) {
			buckets.set(bucket, {
				time: bucket,
				open: trade.price,
				high: trade.price,
				low: trade.price,
				close: trade.price,
				volume,
				trades: 1,
			});
		} else {
			existing.high = Math.max(existing.high, trade.price);
			existing.low = Math.min(existing.low, trade.price);
			existing.close = trade.price;
			existing.volume += volume;
			existing.trades += 1;
		}
	}

	const ordered = [...buckets.values()].sort((a, b) => a.time - b.time);
	const filled = [];
	for (let i = 0; i < ordered.length; i++) {
		const candle = ordered[i];
		const previous = filled[filled.length - 1];
		if (previous) {
			for (let t = previous.time + intervalSeconds; t < candle.time; t += intervalSeconds) {
				filled.push({
					time: t,
					open: previous.close,
					high: previous.close,
					low: previous.close,
					close: previous.close,
					volume: 0,
					trades: 0,
				});
			}
		}
		filled.push(candle);
	}
	return filled;
}

export const tradesCached = (token, quoteToken) =>
	cached(`trades:${token}:${quoteToken ?? 'all'}`, 15_000, () => fetchTrades(token, quoteToken));
