import { Link } from 'react-router-dom';
import type { TokenSummary } from '../lib/api';
import { pct, trim } from '../lib/format';

/** The pairing badges. This is the one thing a card here shows that a card on
 * any other launchpad cannot, so it sits above the name rather than below it. */
function PairBadges({ token }: { token: TokenSummary }) {
	const shown = token.pairs.slice(0, 3);
	const extra = token.pairs.length - shown.length;
	return (
		<div className="flex flex-wrap gap-1.5">
			{shown.map((pair) => (
				<span key={pair.quoteToken} className="chip">
					<span className="text-accent-soft">/{pair.quoteSymbol}</span>
					<span className="text-muted">{(pair.weightBps / 100).toFixed(0)}%</span>
				</span>
			))}
			{extra > 0 && <span className="chip text-muted">+{extra}</span>}
		</div>
	);
}

export default function TokenCard({ token }: { token: TokenSummary }) {
	const lead = token.pairs[0];
	const sold = lead?.soldPct ?? 0;

	return (
		<Link
			to={`/token/${token.address}`}
			className="group animate-rise overflow-hidden rounded-xl border border-white/10 bg-ink-900/60
				transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-ink-900"
		>
			<div className="aspect-square w-full overflow-hidden bg-ink-850">
				{token.image ? (
					<img
						src={token.image}
						alt=""
						loading="lazy"
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
					/>
				) : (
					// Not a spinner and not a blank box: a deliberate placeholder
					// carrying the ticker, so a coin without art is still legible.
					<div className="flex h-full w-full items-center justify-center">
						<span className="font-mono text-4xl text-white/12">{token.symbol.slice(0, 4)}</span>
					</div>
				)}
			</div>

			<div className="space-y-3 p-3.5">
				<PairBadges token={token} />

				<div className="flex items-baseline justify-between gap-2">
					<span className="truncate font-semibold tracking-tight">{token.symbol}</span>
					<span className="shrink-0 font-mono text-xs text-muted">
						{lead ? `${trim(lead.priceQuote, 8)} ${lead.quoteSymbol}` : '-'}
					</span>
				</div>
				<div className="truncate text-xs text-muted">{token.name}</div>

				<div>
					<div className="mb-1 flex items-center justify-between text-[11px] text-muted">
						<span>sold</span>
						<span className="font-mono">{pct(sold, 1)}</span>
					</div>
					<div className="h-1 overflow-hidden rounded-full bg-white/8">
						<div
							className="h-full rounded-full bg-gradient-to-r from-accent to-accent-soft transition-[width] duration-500"
							style={{ width: `${Math.min(100, Math.max(0, sold))}%` }}
						/>
					</div>
				</div>
			</div>
		</Link>
	);
}
