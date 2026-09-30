import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { TokenSummary } from '../lib/api';
import { pct, trim } from '../lib/format';
import OriginBadge from './OriginBadge';

/** The pairing badges. This is the one thing a card here shows that a card on
 * any other launchpad cannot, so it sits on the artwork rather than under it. */
function PairBadges({ token }: { token: TokenSummary }) {
	const shown = token.pairs.slice(0, 3);
	const extra = token.pairs.length - shown.length;
	return (
		<div className="flex flex-wrap gap-1">
			{shown.map((pair) => (
				<span
					key={pair.quoteToken}
					className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-ink-950/70 px-1.5 py-0.5
						font-mono text-[10px] text-white/90 backdrop-blur-sm"
				>
					<span className="text-accent-soft">/{pair.quoteSymbol}</span>
					<span className="text-white/50">{(pair.weightBps / 100).toFixed(0)}%</span>
				</span>
			))}
			{extra > 0 && (
				<span className="rounded-md border border-white/15 bg-ink-950/70 px-1.5 py-0.5 font-mono text-[10px] text-white/60">
					+{extra}
				</span>
			)}
		</div>
	);
}

/** Watches the lead pool's sold percentage and fires the bump animation when
 * it changes, so a card that just traded jolts in the grid. */
function useBump(value: number) {
	const previous = useRef(value);
	const [bumping, setBumping] = useState(false);
	useEffect(() => {
		if (previous.current === value) return;
		previous.current = value;
		setBumping(true);
		const timer = window.setTimeout(() => setBumping(false), 650);
		return () => window.clearTimeout(timer);
	}, [value]);
	return bumping;
}

export default function TokenCard({ token, rank }: { token: TokenSummary; rank?: number }) {
	const lead = [...token.pairs].sort((a, b) => b.soldPct - a.soldPct)[0];
	const sold = lead?.soldPct ?? 0;
	const bumping = useBump(sold);
	const graduated = sold >= 100;

	return (
		<Link
			to={`/token/${token.address}`}
			className={`glow-border group relative flex flex-col overflow-hidden rounded-2xl border border-white/8
				bg-white/[0.03] shadow-card backdrop-blur-md transition-all duration-300
				hover:-translate-y-1 hover:bg-white/[0.05] ${bumping ? 'animate-bump' : 'animate-rise'}`}
		>
			<div className="relative aspect-square w-full overflow-hidden bg-ink-850">
				{token.image ? (
					<img
						src={token.image}
						alt=""
						loading="lazy"
						className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
					/>
				) : (
					// Not a spinner and not a blank box: a deliberate placeholder
					// carrying the ticker, so a coin without art is still legible.
					<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-800 to-ink-950">
						<span className="display text-5xl text-white/10">{token.symbol.slice(0, 4)}</span>
					</div>
				)}

				{/* A glossy sweep across the art on hover. */}
				<span
					aria-hidden="true"
					className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-gradient-to-r
						from-transparent via-white/15 to-transparent opacity-0 group-hover:animate-shine group-hover:opacity-100"
				/>
				<div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950/90 to-transparent" />

				<div className="absolute left-2.5 top-2.5">
					<PairBadges token={token} />
				</div>
				{typeof rank === 'number' && (
					<span className="absolute right-2.5 top-2.5 rounded-md bg-ink-950/70 px-1.5 py-0.5 font-mono text-[10px] text-white/70 backdrop-blur-sm">
						#{rank}
					</span>
				)}
				<div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
					<div className="min-w-0">
						<div className="display truncate text-xl leading-none text-white">${token.symbol}</div>
						<div className="mt-0.5 truncate text-xs text-white/60">{token.name}</div>
					</div>
					<div className="flex shrink-0 flex-col items-end gap-1">
						<OriginBadge origin={token.origin} />
						{graduated && (
							<span className="rounded-md bg-up/20 px-1.5 py-0.5 font-mono text-[10px] text-up">graduated</span>
						)}
					</div>
				</div>
			</div>

			<div className="space-y-2.5 p-3.5">
				<div className="flex items-baseline justify-between gap-2 text-xs">
					<span className="text-muted">price</span>
					<span className="font-mono text-white/90">
						{lead ? `${trim(lead.priceQuote, 8)} ${lead.quoteSymbol}` : '-'}
					</span>
				</div>
				<div>
					<div className="mb-1 flex items-center justify-between text-[11px] text-muted">
						<span>curve</span>
						<span className="font-mono text-white/80">{pct(sold, 1)}</span>
					</div>
					<div className="h-1.5 overflow-hidden rounded-full bg-white/8">
						<div
							className="h-full rounded-full bg-gradient-to-r from-accent-deep via-accent to-sky transition-[width] duration-700"
							style={{ width: `${Math.min(100, Math.max(0, sold))}%` }}
						/>
					</div>
				</div>
			</div>
		</Link>
	);
}
