import { Link } from 'react-router-dom';
import { useConfig, useStocks, useTokens } from '../lib/hooks';
import TokenCard from '../components/TokenCard';
import Ticker from '../components/Ticker';
import { CardGridSkeleton, Empty, ErrorState } from '../components/States';
import { pct, trim } from '../lib/format';
import type { TokenSummary } from '../lib/api';

/** The bonding curve, drawn once as an SVG so the hero has the product in it
 * rather than a stock illustration. */
function CurveArt() {
	const points = Array.from({ length: 60 }, (_, i) => {
		const x = i / 59;
		const y = 1 - Math.pow(x, 2.6);
		return `${(x * 300).toFixed(1)},${(y * 150 + 10).toFixed(1)}`;
	});
	const path = `M ${points.join(' L ')}`;
	const area = `${path} L 300,170 L 0,170 Z`;
	const markerY = (1 - Math.pow(0.71, 2.6)) * 150 + 10;
	return (
		<svg viewBox="0 0 300 170" className="h-full w-full" aria-hidden="true">
			<defs>
				<linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#a855f7" stopOpacity="0.45" />
					<stop offset="1" stopColor="#a855f7" stopOpacity="0" />
				</linearGradient>
				<linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#c084fc" />
					<stop offset="1" stopColor="#38bdf8" />
				</linearGradient>
			</defs>
			{[0.25, 0.5, 0.75].map((g) => (
				<line key={g} x1={g * 300} y1="10" x2={g * 300} y2="170" stroke="rgba(255,255,255,0.05)" />
			))}
			<path d={area} fill="url(#hero-fill)" />
			<path d={path} fill="none" stroke="url(#hero-line)" strokeWidth="2.5" strokeLinecap="round" />
			<circle cx="213" cy={markerY} r="10" fill="#c084fc" opacity="0.35" className="animate-glow-pulse" />
			<circle cx="213" cy={markerY} r="5" fill="#fff" />
		</svg>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<div className="display whitespace-nowrap text-xl sm:text-2xl">{value}</div>
			<div className="text-xs text-muted">{label}</div>
		</div>
	);
}

function Hero() {
	const { data: config } = useConfig();
	const { data: stocks } = useStocks();
	const { data: tokens } = useTokens(100);
	const fee = config?.launchFeeEth ? trim(config.launchFeeEth, 6) : null;
	const floaters = (stocks ?? []).slice(0, 6);

	return (
		<section className="relative overflow-hidden">
			<div className="orb -left-32 top-10 h-96 w-96 animate-glow-pulse bg-accent/25" />
			<div className="orb -right-24 top-40 h-80 w-80 animate-glow-pulse bg-sky/15 [animation-delay:1.2s]" />

			<div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:grid-cols-[1.1fr_0.9fr]">
				<div className="animate-rise">
					<span className="chip mb-6 rounded-full border-accent/30 bg-accent-dim px-3 py-1.5 text-accent-soft">
						<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-soft" />
						live on robinhood chain
					</span>
					<h1 className="display text-5xl leading-[0.95] sm:text-7xl lg:text-[5.5rem]">
						memes,
						<br />
						<span className="gradient-text">backed by stocks.</span>
					</h1>
					<p className="mt-7 max-w-lg text-lg leading-relaxed text-white/70">
						Launch a coin quoted in NVDA, TSLA or any of {stocks?.length ?? 'two dozen'} tokenized
						equities. Pick up to five. One transaction. Liquidity that never leaves.
					</p>
					<div className="mt-9 flex flex-wrap items-center gap-3">
						<Link to="/launch" className="btn-primary rounded-full px-7 py-3.5 text-base">
							launch a coin
						</Link>
						<Link to="/explore" className="btn-ghost rounded-full px-7 py-3.5 text-base">
							explore
						</Link>
					</div>
					<Link
						to="/docs#mcp"
						className="group mt-4 inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white focus-visible:text-white"
					>
						or ask Claude to launch it for you
						<span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
							&rarr;
						</span>
					</Link>
					<div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-white/8 pt-6">
						<Stat label="coins launched" value={tokens ? String(tokens.length) : '…'} />
						<Stat label="markets" value={stocks ? String(stocks.length) : '…'} />
						<Stat label="launch fee" value={fee ? `${fee} ETH` : '…'} />
					</div>
				</div>

				<div className="relative animate-rise [animation-delay:120ms]">
					<div className="panel-strong glow-border is-on relative p-5">
						<div className="mb-4 flex items-center justify-between">
							<div>
								<div className="text-[11px] uppercase tracking-wider text-muted">the curve</div>
								<div className="display text-2xl">
									$yourcoin <span className="text-muted">/ NVDAx</span>
								</div>
							</div>
							<span className="chip rounded-full text-up">no migration</span>
						</div>
						<div className="aspect-[300/170] w-full">
							<CurveArt />
						</div>
						<div className="mt-4 grid grid-cols-3 gap-3 text-xs">
							<div>
								<div className="text-muted">supply</div>
								<div className="font-mono">1,000,000,000</div>
							</div>
							<div>
								<div className="text-muted">creator fee</div>
								<div className="font-mono text-up">70%</div>
							</div>
							<div>
								<div className="text-muted">lp</div>
								<div className="font-mono">locked forever</div>
							</div>
						</div>
					</div>

					{floaters.map((stock, i) => (
						<span
							key={stock.address}
							className={`absolute hidden items-center rounded-full border border-white/12 bg-ink-900/80 px-3 py-1.5 font-mono text-xs text-white/90 shadow-glow-sm backdrop-blur-md lg:inline-flex ${
								i % 2 ? 'animate-float-slow' : 'animate-float'
							}`}
							style={{
								top: `${4 + ((i * 37) % 84)}%`,
								left: i % 2 ? `${-22 + (i % 3) * 4}%` : undefined,
								right: i % 2 ? undefined : `${-20 + (i % 3) * 4}%`,
								animationDelay: `${i * 0.7}s`,
							}}
						>
							<span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-sky" />
							{stock.symbol}
						</span>
					))}
				</div>
			</div>
		</section>
	);
}

/** The highest-progress coin that has not graduated: where the volume is
 * right now. Every Solana launchpad pins this above the feed. */
function KingOfTheHill({ tokens }: { tokens: TokenSummary[] }) {
	const live = tokens.filter((t) => t.pairs.some((p) => p.soldPct < 100));
	const progress = (t: TokenSummary) => Math.max(...t.pairs.map((p) => p.soldPct));
	const king = [...live].sort((a, b) => progress(b) - progress(a))[0];
	if (!king) return null;
	const lead = [...king.pairs].sort((a, b) => b.soldPct - a.soldPct)[0];
	if (!lead) return null;

	return (
		<section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
			<Link
				to={`/token/${king.address}`}
				className="glow-border is-on group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-white/10
					bg-gradient-to-r from-accent/15 via-ink-900/60 to-sky/10 p-5 shadow-card backdrop-blur-md transition-all hover:-translate-y-0.5"
				aria-label={`King of the hill: ${king.name}`}
			>
				<div className="orb -left-10 -top-10 h-40 w-40 bg-accent/30" />
				<div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-850 ring-1 ring-white/10">
					{king.image ? (
						<img src={king.image} alt="" className="h-full w-full object-cover" />
					) : (
						<div className="display flex h-full items-center justify-center text-2xl text-white/15">
							{king.symbol.slice(0, 3)}
						</div>
					)}
				</div>
				<div className="relative min-w-0 flex-1">
					<div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wider text-accent-soft">
						<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-soft" />
						king of the hill
					</div>
					<div className="display truncate text-2xl">
						${king.symbol} <span className="text-base font-normal normal-case text-muted">{king.name}</span>
					</div>
					<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
						<div
							className="h-full rounded-full bg-gradient-to-r from-accent-deep via-accent to-sky transition-[width] duration-700"
							style={{ width: `${Math.min(100, lead.soldPct)}%` }}
						/>
					</div>
				</div>
				<div className="relative shrink-0 text-right">
					<div className="display text-3xl">{pct(lead.soldPct, 1)}</div>
					<div className="text-xs text-muted">sold on /{lead.quoteSymbol}</div>
				</div>
			</Link>
		</section>
	);
}

const FEATURES = [
	{
		kicker: 'quoted in equities',
		title: 'a coin paired with NVDA trades against NVDA.',
		body: 'Its price, its liquidity and the fees it pays are all denominated in the stock. Up to five stocks per coin, weighted however you like.',
		art: 'pairs',
	},
	{
		kicker: 'liquidity nobody can pull',
		title: 'there is no LP position to withdraw.',
		body: 'The curve holds what it raised and keeps quoting, permanently. No migration event, no rug window, no 48-hour cliff.',
		art: 'lock',
	},
	{
		kicker: 'creators earn the spread',
		title: '70% of every swap fee goes to the creator.',
		body: 'Claim across every pairing in a single transaction. Route it to a wallet, a team, or back to your holders.',
		art: 'fees',
	},
] as const;

function FeatureArt({ kind }: { kind: (typeof FEATURES)[number]['art'] }) {
	if (kind === 'pairs') {
		const pairs: [string, number][] = [['NVDAx', 40], ['TSLAx', 30], ['SPCX', 20], ['AAPLx', 10]];
		return (
			<div className="flex flex-wrap gap-2">
				{pairs.map(([symbol, weight]) => (
					<span key={symbol} className="chip rounded-full px-3 py-1.5 text-xs">
						<span className="text-accent-soft">/{symbol}</span>
						<span className="text-muted">{weight}%</span>
					</span>
				))}
			</div>
		);
	}
	if (kind === 'lock') {
		return (
			<div className="flex items-center gap-3">
				<div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
					<div className="h-full w-full rounded-full bg-gradient-to-r from-accent-deep via-accent to-sky" />
				</div>
				<span className="chip rounded-full text-up">locked</span>
			</div>
		);
	}
	return (
		<div className="grid grid-cols-[3fr_1fr] gap-2">
			<div className="rounded-lg bg-accent/20 px-3 py-2 text-xs">
				<span className="font-mono text-accent-soft">70%</span> <span className="text-muted">creator</span>
			</div>
			<div className="rounded-lg bg-white/5 px-3 py-2 text-xs">
				<span className="font-mono">30%</span> <span className="text-muted">protocol</span>
			</div>
		</div>
	);
}

export default function Home() {
	const { data: tokens, isLoading, error, refetch } = useTokens(12);

	return (
		<>
			<Ticker />
			<Hero />
			{tokens && tokens.length > 0 && <KingOfTheHill tokens={tokens} />}

			<section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
				<div className="mb-6 flex items-end justify-between gap-4">
					<div>
						<h2 className="display text-3xl">latest launches</h2>
						<p className="mt-1 text-sm text-muted">Newest first, straight from the contract.</p>
					</div>
					<Link to="/explore" className="btn-ghost rounded-full text-sm">
						view all
					</Link>
				</div>

				{isLoading && <CardGridSkeleton count={8} />}
				{error && <ErrorState error={error} onRetry={() => refetch()} />}
				{tokens && tokens.length === 0 && (
					<Empty
						title="Nothing launched yet"
						body="Be the first. Pick a stock to pair against, upload a picture, and it is live in one transaction."
						actionLabel="Launch the first coin"
						actionTo="/launch"
					/>
				)}
				{tokens && tokens.length > 0 && (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
						{tokens.map((token, i) => (
							<TokenCard key={token.address} token={token} rank={i + 1} />
						))}
					</div>
				)}
			</section>

			<section className="mx-auto max-w-7xl space-y-6 px-4 pb-8 sm:px-6">
				{FEATURES.map((item, i) => (
					<div
						key={item.kicker}
						className={`panel grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-2 ${
							i % 2 ? 'lg:[&>*:first-child]:order-2' : ''
						}`}
					>
						<div>
							<div className="mb-3 text-[11px] uppercase tracking-wider text-accent-soft">{item.kicker}</div>
							<h3 className="display text-3xl leading-tight sm:text-4xl">{item.title}</h3>
							<p className="mt-4 max-w-md text-base leading-relaxed text-muted">{item.body}</p>
						</div>
						<div className="panel-strong relative overflow-hidden p-6">
							<div className="orb -right-10 -top-10 h-40 w-40 bg-sky/15" />
							<div className="relative">
								<FeatureArt kind={item.art} />
							</div>
						</div>
					</div>
				))}
			</section>
		</>
	);
}
