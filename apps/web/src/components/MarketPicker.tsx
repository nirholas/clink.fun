import type { StockToken } from '../lib/api';
import { BPS, MAX_MARKETS } from '../lib/contracts';

export interface Selection {
	symbol: string;
	address: `0x${string}`;
	weightBps: number;
}

/**
 * Split 10000 basis points as evenly as integers allow, remainder to the front.
 * The contract rejects anything that does not total exactly 10000, so this is
 * correctness rather than presentation.
 */
export function evenWeights(count: number): number[] {
	const base = Math.floor(BPS / count);
	const weights = Array.from({ length: count }, () => base);
	let remainder = BPS - base * count;
	for (let i = 0; remainder > 0; i = (i + 1) % count, remainder--) weights[i] = (weights[i] ?? 0) + 1;
	return weights;
}

export default function MarketPicker({
	stocks,
	selected,
	onChange,
}: {
	stocks: StockToken[];
	selected: Selection[];
	onChange: (next: Selection[]) => void;
}) {
	const isSelected = (symbol: string) => selected.some((s) => s.symbol === symbol);
	const total = selected.reduce((sum, s) => sum + s.weightBps, 0);

	function toggle(stock: StockToken) {
		const next = isSelected(stock.symbol)
			? selected.filter((s) => s.symbol !== stock.symbol)
			: [...selected, { symbol: stock.symbol, address: stock.address, weightBps: 0 }];
		if (next.length > MAX_MARKETS) return;
		// Re-split evenly whenever the set changes. Someone who wants custom
		// weights sets them after choosing markets, not during.
		const weights = next.length ? evenWeights(next.length) : [];
		onChange(next.map((s, i) => ({ ...s, weightBps: weights[i] ?? 0 })));
	}

	function setWeight(symbol: string, percent: number) {
		onChange(
			selected.map((s) =>
				s.symbol === symbol ? { ...s, weightBps: Math.round(Math.max(0, Math.min(100, percent)) * 100) } : s,
			),
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-2">
				{stocks.map((stock) => {
					const active = isSelected(stock.symbol);
					const full = selected.length >= MAX_MARKETS && !active;
					return (
						<button
							key={stock.address}
							type="button"
							disabled={full}
							onClick={() => toggle(stock)}
							aria-pressed={active}
							className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
								active
									? 'border-accent bg-accent-dim text-accent-soft'
									: full
										? 'cursor-not-allowed border-white/8 text-white/25'
										: 'border-white/12 text-white/70 hover:border-white/30 hover:text-white'
							}`}
						>
							{stock.symbol}
						</button>
					);
				})}
			</div>

			{selected.length === 0 && (
				<p className="text-xs text-muted">
					Pick between one and {MAX_MARKETS} markets. Each one becomes its own independent pool.
				</p>
			)}

			{selected.length > 0 && (
				<div className="space-y-2">
					{selected.map((market) => (
						<div key={market.symbol} className="flex items-center gap-3">
							<span className="w-16 shrink-0 font-mono text-xs text-accent-soft">/{market.symbol}</span>
							<input
								type="range"
								min={0}
								max={100}
								step={1}
								value={market.weightBps / 100}
								onChange={(event) => setWeight(market.symbol, Number(event.target.value))}
								className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-accent"
								aria-label={`${market.symbol} allocation`}
							/>
							<span className="w-14 shrink-0 text-right font-mono text-xs text-white/80">
								{(market.weightBps / 100).toFixed(0)}%
							</span>
						</div>
					))}

					{/* Reads as confirmation when it is right and as an instruction
					    only when it is wrong. A permanent "must total 100%" next to
					    a correct 100% looks like a failure the user cannot clear. */}
					<div
						className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
							total === BPS
								? 'border-up/25 bg-up/8 text-up'
								: 'border-down/30 bg-down/8 text-down'
						}`}
					>
						<span>
							{total === BPS
								? `Allocation set across ${selected.length} market${selected.length === 1 ? '' : 's'}`
								: total > BPS
									? `Over by ${((total - BPS) / 100).toFixed(2)}%`
									: `Short by ${((BPS - total) / 100).toFixed(2)}%`}
						</span>
						<span className="font-mono">{(total / 100).toFixed(2)}%</span>
					</div>

					{total !== BPS && (
						<button
							type="button"
							onClick={() => {
								const weights = evenWeights(selected.length);
								onChange(selected.map((s, i) => ({ ...s, weightBps: weights[i] ?? 0 })));
							}}
							className="btn-ghost w-full text-xs"
						>
							Split evenly
						</button>
					)}
				</div>
			)}
		</div>
	);
}
