import { Link } from 'react-router-dom';
import { useStocks, useTokens } from '../lib/hooks';
import { pct } from '../lib/format';

/** A live strip under the header: every stock you can pair against and the
 * latest coins, scrolling. Duplicated once so the marquee loops seamlessly. */
export default function Ticker() {
	const { data: stocks } = useStocks();
	const { data: tokens } = useTokens(12);
	if (!stocks?.length && !tokens?.length) return null;

	const items = [
		...(stocks ?? []).map((s) => ({ key: `s-${s.address}`, to: `/explore?market=${s.symbol}`, label: s.symbol, sub: 'market', tone: 'sky' as const })),
		...(tokens ?? []).map((t) => {
			const lead = [...t.pairs].sort((a, b) => b.soldPct - a.soldPct)[0];
			return {
				key: `t-${t.address}`,
				to: `/token/${t.address}`,
				label: `$${t.symbol}`,
				sub: lead ? `${pct(lead.soldPct, 0)} /${lead.quoteSymbol}` : '',
				tone: 'accent' as const,
			};
		}),
	];
	const loop = [...items, ...items];

	return (
		<div className="marquee-mask overflow-hidden border-b border-white/6 bg-ink-950/40">
			<div className="flex w-max animate-marquee gap-2 py-2 hover:[animation-play-state:paused]">
				{loop.map((item, i) => (
					<Link
						key={`${item.key}-${i}`}
						to={item.to}
						className="flex shrink-0 items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1
							text-xs transition-colors hover:border-white/20 hover:bg-white/[0.06]"
					>
						<span className={`h-1.5 w-1.5 rounded-full ${item.tone === 'sky' ? 'bg-sky' : 'bg-accent'}`} />
						<span className="font-mono text-white/90">{item.label}</span>
						{item.sub && <span className="text-muted">{item.sub}</span>}
					</Link>
				))}
			</div>
		</div>
	);
}
