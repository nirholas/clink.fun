import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	createChart,
	type IChartApi,
	type ISeriesApi,
	type UTCTimestamp,
} from 'lightweight-charts';
import { api, type Pair, type TokenSummary } from '../lib/api';
import {
	CHART_THEME,
	CHART_VIEWS,
	INTERVALS,
	curvePoints,
	curvePosition,
	marketComparison,
	type Candle,
	type ChartView,
	type Interval,
} from '../lib/charts';
import { pct, trim } from '../lib/format';

export default function ChartPanel({ token, market }: { token: TokenSummary; market: Pair }) {
	const [view, setView] = useState<ChartView>('curve');
	const [interval, setInterval] = useState<Interval>('5m');

	const { data: candleData, isLoading } = useQuery({
		queryKey: ['candles', token.address, market.quoteToken, interval],
		queryFn: () => api.candles(token.address, interval, market.quoteToken),
		refetchInterval: 20_000,
		staleTime: 10_000,
	});

	const candles = candleData?.candles ?? [];
	const hasHistory = candles.length > 0;
	const needsHistory = CHART_VIEWS.find((v) => v.key === view)?.needsHistory ?? false;

	return (
		<div className="panel overflow-hidden">
			<div className="flex flex-wrap items-center gap-2 border-b border-white/8 px-4 py-3">
				<div className="flex flex-wrap gap-1" role="tablist" aria-label="Chart view">
					{CHART_VIEWS.map((option) => (
						<button
							key={option.key}
							type="button"
							role="tab"
							aria-selected={view === option.key}
							onClick={() => setView(option.key)}
							className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
								view === option.key ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
							}`}
						>
							{option.label}
						</button>
					))}
				</div>

				{needsHistory && (
					<div className="ml-auto flex gap-1" role="group" aria-label="Interval">
						{INTERVALS.map((option) => (
							<button
								key={option}
								type="button"
								onClick={() => setInterval(option)}
								className={`rounded px-1.5 py-1 font-mono text-[11px] transition-colors ${
									interval === option ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
								}`}
							>
								{option}
							</button>
						))}
					</div>
				)}
			</div>

			<div className="relative h-[340px] w-full">
				{needsHistory && isLoading && (
					<div className="absolute inset-0 animate-pulse bg-white/[0.02]" />
				)}

				{needsHistory && !isLoading && !hasHistory ? (
					// Not a blank panel. A coin with no trades has nothing to plot
					// on a candle chart, and the useful thing to say is which view
					// does work without history.
					<div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
						<p className="text-sm text-white/70">No trades yet</p>
						<p className="max-w-sm text-xs leading-relaxed text-muted">
							Candles need history. The curve view is derived from the pool itself, so it works
							from the moment a coin launches.
						</p>
						<button type="button" onClick={() => setView('curve')} className="btn-ghost text-xs">
							Show the curve
						</button>
					</div>
				) : (
					<>
						{view === 'candles' && <SeriesChart kind="candles" candles={candles} />}
						{view === 'area' && <SeriesChart kind="area" candles={candles} />}
						{view === 'volume' && <SeriesChart kind="volume" candles={candles} />}
						{view === 'curve' && <CurveChart market={market} />}
						{view === 'markets' && <MarketsChart token={token} />}
					</>
				)}
			</div>
		</div>
	);
}

/**
 * Candles, area and volume all come from the same OHLCV array, so they share
 * one chart instance and differ only in the series they attach.
 */
function SeriesChart({ kind, candles }: { kind: 'candles' | 'area' | 'volume'; candles: Candle[] }) {
	const container = useRef<HTMLDivElement>(null);
	const chartRef = useRef<IChartApi | null>(null);
	const seriesRef = useRef<ISeriesApi<'Candlestick' | 'Area' | 'Histogram'> | null>(null);

	useEffect(() => {
		if (!container.current) return;
		const chart = createChart(container.current, {
			layout: { background: { color: 'transparent' }, textColor: CHART_THEME.text, fontSize: 11 },
			grid: {
				vertLines: { color: CHART_THEME.grid },
				horzLines: { color: CHART_THEME.grid },
			},
			rightPriceScale: { borderColor: CHART_THEME.border },
			timeScale: { borderColor: CHART_THEME.border, timeVisible: true, secondsVisible: false },
			crosshair: { mode: 1 },
			handleScale: { axisPressedMouseMove: false },
			autoSize: true,
		});
		chartRef.current = chart;

		if (kind === 'candles') {
			seriesRef.current = chart.addCandlestickSeries({
				upColor: CHART_THEME.up,
				downColor: CHART_THEME.down,
				borderVisible: false,
				wickUpColor: CHART_THEME.up,
				wickDownColor: CHART_THEME.down,
			});
		} else if (kind === 'area') {
			seriesRef.current = chart.addAreaSeries({
				lineColor: CHART_THEME.accent,
				topColor: CHART_THEME.accentSoft,
				bottomColor: 'rgba(168,85,247,0)',
				lineWidth: 2,
			});
		} else {
			seriesRef.current = chart.addHistogramSeries({ color: CHART_THEME.accent });
		}

		return () => {
			chart.remove();
			chartRef.current = null;
			seriesRef.current = null;
		};
	}, [kind]);

	useEffect(() => {
		const series = seriesRef.current;
		if (!series || !candles.length) return;
		if (kind === 'candles') {
			series.setData(
				candles.map((c) => ({
					time: c.time as UTCTimestamp,
					open: c.open,
					high: c.high,
					low: c.low,
					close: c.close,
				})),
			);
		} else if (kind === 'area') {
			series.setData(candles.map((c) => ({ time: c.time as UTCTimestamp, value: c.close })));
		} else {
			series.setData(
				candles.map((c) => ({
					time: c.time as UTCTimestamp,
					value: c.volume,
					color: c.close >= c.open ? CHART_THEME.up : CHART_THEME.down,
				})),
			);
		}
		chartRef.current?.timeScale().fitContent();
	}, [candles, kind]);

	return <div ref={container} className="h-full w-full" />;
}

/**
 * The bonding curve, plotted as an SVG rather than through the chart library.
 *
 * Its x axis is percentage sold, not time, which no time-series chart will draw.
 * The marker is where the pool sits now, so the reader sees both what a buy
 * costs today and what it costs after the next ten percent.
 */
function CurveChart({ market }: { market: Pair }) {
	const points = useMemo(() => curvePoints(market), [market]);
	const here = curvePosition(market);

	if (!points.length) {
		return <div className="flex h-full items-center justify-center text-sm text-muted">No curve data</div>;
	}

	const width = 800;
	const height = 300;
	const padLeft = 8;
	const padBottom = 26;

	const maxPrice = Math.max(...points.map((p) => p.price));
	const minPrice = Math.min(...points.map((p) => p.price));
	// Log scale: a constant-product curve spans orders of magnitude, and a
	// linear axis renders it as a flat line then a wall.
	const toY = (price: number) => {
		const lo = Math.log10(Math.max(minPrice, 1e-30));
		const hi = Math.log10(Math.max(maxPrice, 1e-29));
		const t = (Math.log10(Math.max(price, 1e-30)) - lo) / Math.max(1e-9, hi - lo);
		return height - padBottom - t * (height - padBottom - 10);
	};
	const toX = (sold: number) => padLeft + (sold / 90) * (width - padLeft - 10);

	const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.sold).toFixed(1)},${toY(p.price).toFixed(1)}`).join(' ');
	const area = `${path} L${toX(90).toFixed(1)},${height - padBottom} L${padLeft},${height - padBottom} Z`;
	const markerX = toX(Math.min(90, here.sold));
	const markerY = toY(Math.max(minPrice, here.price));

	return (
		<div className="h-full w-full p-3">
			<svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="Bonding curve">
				<defs>
					<linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={CHART_THEME.accent} stopOpacity="0.25" />
						<stop offset="100%" stopColor={CHART_THEME.accent} stopOpacity="0" />
					</linearGradient>
				</defs>

				{[0, 25, 50, 75, 90].map((tick) => (
					<g key={tick}>
						<line
							x1={toX(tick)}
							y1={10}
							x2={toX(tick)}
							y2={height - padBottom}
							stroke={CHART_THEME.grid}
						/>
						<text x={toX(tick)} y={height - 8} fill={CHART_THEME.text} fontSize="11" textAnchor="middle">
							{tick}%
						</text>
					</g>
				))}

				<path d={area} fill="url(#curveFill)" />
				<path d={path} fill="none" stroke={CHART_THEME.accent} strokeWidth="2" />

				<line x1={markerX} y1={10} x2={markerX} y2={height - padBottom} stroke={CHART_THEME.up} strokeDasharray="4 4" />
				<circle cx={markerX} cy={markerY} r="5" fill={CHART_THEME.up} />
				<text
					x={Math.min(markerX + 10, width - 130)}
					y={Math.max(markerY - 10, 22)}
					fill={CHART_THEME.up}
					fontSize="12"
					fontFamily="monospace"
				>
					{trim(String(here.price), 10)} {market.quoteSymbol}
				</text>
			</svg>
			<p className="-mt-1 text-center text-[11px] text-muted">
				Price against percentage of the {market.quoteSymbol} pool sold. Log scale.
			</p>
		</div>
	);
}

/**
 * Every pool of this coin side by side.
 *
 * The comparison is percentage moved from each pool's opening price, because
 * the raw prices are denominated in different stocks and comparing them
 * directly would be meaningless.
 */
function MarketsChart({ token }: { token: TokenSummary }) {
	const rows = useMemo(() => marketComparison(token.pairs), [token.pairs]);
	const max = Math.max(1, ...rows.map((r) => Math.abs(r.changePct)));

	return (
		<div className="flex h-full flex-col justify-center gap-3 px-6">
			{rows.map((row) => (
				<div key={row.symbol} className="flex items-center gap-3">
					<span className="w-16 shrink-0 font-mono text-xs text-accent-soft">/{row.symbol}</span>
					<div className="relative h-6 flex-1 overflow-hidden rounded bg-white/5">
						<div
							className={`absolute inset-y-0 left-0 rounded transition-[width] duration-500 ${
								row.changePct >= 0 ? 'bg-up/35' : 'bg-down/35'
							}`}
							style={{ width: `${Math.max(2, (Math.abs(row.changePct) / max) * 100)}%` }}
						/>
					</div>
					<span
						className={`w-20 shrink-0 text-right font-mono text-xs ${
							row.changePct >= 0 ? 'text-up' : 'text-down'
						}`}
					>
						{row.changePct >= 0 ? '+' : ''}
						{pct(row.changePct, 2)}
					</span>
				</div>
			))}
			<p className="mt-2 text-center text-[11px] leading-relaxed text-muted">
				Each pool priced against a different stock, so this compares how far each has moved from
				its opening price rather than the prices themselves. Pools do not arbitrage each other
				automatically.
			</p>
		</div>
	);
}
