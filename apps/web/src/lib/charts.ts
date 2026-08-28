// Chart data shaping.
//
// The maths lives here rather than in the components so each view is a thin
// renderer over a plain array, and so the two views that need no trade history
// (the curve and the market comparison) can be derived from contract state
// alone. A coin minutes old still has something honest to show.

import type { Pair } from './api';

export interface Candle {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	trades: number;
}

export interface Trade {
	txHash: string;
	block: number;
	time: number;
	trader: string;
	quoteToken: string;
	isBuy: boolean;
	quoteAmount: string;
	tokenAmount: string;
	feeAmount: string;
	price: number;
}

export const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;
export type Interval = (typeof INTERVALS)[number];

export const CHART_VIEWS = [
	{ key: 'candles', label: 'Candles', needsHistory: true },
	{ key: 'area', label: 'Price', needsHistory: true },
	{ key: 'curve', label: 'Curve', needsHistory: false },
	{ key: 'volume', label: 'Volume', needsHistory: true },
	{ key: 'markets', label: 'Markets', needsHistory: false },
] as const;

export type ChartView = (typeof CHART_VIEWS)[number]['key'];

/**
 * The whole bonding curve for a pool, as price against percentage of the pool
 * sold.
 *
 * Derived from the constant product of the current reserves rather than sampled
 * from history, so it is exact and it exists the moment a coin launches. This
 * is the view no candle chart can give you: it shows where price goes next, not
 * only where it has been.
 *
 * price(r) = k / r^2, where k is the constant product and r the token reserve.
 */
export function curvePoints(pair: Pair, steps = 160): { sold: number; price: number }[] {
	const virtualQuote = Number(pair.virtualQuote ?? 0);
	const virtualToken = Number(pair.virtualToken ?? 0);
	if (!virtualQuote || !virtualToken) return [];

	const k = virtualQuote * virtualToken;
	// The reserve shrinks as tokens are sold, so the original allocation is
	// recoverable from where the pool sits now.
	const allocation = virtualToken / Math.max(1e-9, 1 - pair.soldPct / 100);

	const points: { sold: number; price: number }[] = [];
	// Past roughly 90% sold the asymptote dominates and the line stops being
	// readable, so it stops there rather than drawing a vertical wall.
	for (let i = 0; i <= steps; i++) {
		const fraction = (i / steps) * 0.9;
		const remaining = allocation * (1 - fraction);
		if (remaining <= 0) break;
		points.push({ sold: fraction * 100, price: k / (remaining * remaining) });
	}
	return points;
}

/** Where the pool sits on its own curve right now. */
export function curvePosition(pair: Pair): { sold: number; price: number } {
	return { sold: pair.soldPct, price: Number(pair.priceQuote) };
}

/**
 * How far each of a coin's pools has moved from where it opened.
 *
 * Comparing raw prices across pools is meaningless because each is denominated
 * in a different stock. Comparing how far each has travelled is not, and it is
 * the one comparison only a multi-market launchpad can show.
 */
export function marketComparison(pairs: Pair[]): { symbol: string; changePct: number; price: number }[] {
	return pairs.map((pair) => {
		const virtualQuote = Number(pair.virtualQuote ?? 0);
		const virtualToken = Number(pair.virtualToken ?? 0);
		const raisedWei = Number(pair.raisedQuote ?? 0) * 1e18;
		const price = Number(pair.priceQuote);

		const allocation = virtualToken / Math.max(1e-9, 1 - pair.soldPct / 100);
		const openingQuote = virtualQuote - raisedWei;
		const openingPrice = allocation > 0 ? openingQuote / allocation : price;

		const changePct = openingPrice > 0 ? ((price - openingPrice) / openingPrice) * 100 : 0;
		return { symbol: pair.quoteSymbol, price, changePct: Number.isFinite(changePct) ? changePct : 0 };
	});
}

/** Chart theme, kept next to the data so every view looks like one system. */
export const CHART_THEME = {
	background: 'transparent',
	text: '#8b8b96',
	grid: 'rgba(255,255,255,0.04)',
	border: 'rgba(255,255,255,0.08)',
	up: '#3ddc84',
	down: '#ff5c5c',
	accent: '#a855f7',
	accentSoft: 'rgba(168,85,247,0.22)',
} as const;
