import { Link } from 'react-router-dom';
import { useConfig, useStocks, useTokens } from '../lib/hooks';
import TokenCard from '../components/TokenCard';
import { CardGridSkeleton, Empty, ErrorState } from '../components/States';
import { trim } from '../lib/format';

function Hero() {
	const { data: config } = useConfig();
	const fee = config?.launchFeeEth ? trim(config.launchFeeEth, 6) : null;

	return (
		<section className="relative overflow-hidden border-b border-white/8">
			<div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
				<div className="max-w-2xl animate-rise">
					<span className="chip mb-5 border-accent/30 bg-accent-dim text-accent-soft">
						Robinhood Chain
					</span>
					<h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
						Launch a coin paired with
						<span className="text-accent"> real stocks</span>.
					</h1>
					<p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
						Every coin here is quoted in a tokenized equity, not a stablecoin. Pick up to five
						markets, pay one flat fee, and the liquidity locks forever. Fixed supply, no
						mint function, no way for anyone to pull the floor.
					</p>
					<div className="mt-8 flex flex-wrap items-center gap-3">
						<Link to="/launch" className="btn-primary px-5 py-2.5 text-base">
							Launch a coin
						</Link>
						<Link to="/explore" className="btn-ghost px-5 py-2.5 text-base">
							Explore
						</Link>
						{fee && (
							<span className="text-sm text-muted">
								costs <span className="font-mono text-white/80">{fee} ETH</span> plus gas
							</span>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}

function MarketStrip() {
	const { data: stocks } = useStocks();
	if (!stocks?.length) return null;
	return (
		<div className="border-b border-white/8 bg-ink-900/40">
			<div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
				<span className="shrink-0 self-center text-[11px] uppercase tracking-wider text-muted">
					Pair against
				</span>
				{stocks.map((stock) => (
					<span key={stock.address} className="chip shrink-0">
						{stock.symbol}
					</span>
				))}
			</div>
		</div>
	);
}

export default function Home() {
	const { data: tokens, isLoading, error, refetch } = useTokens(12);

	return (
		<>
			<Hero />
			<MarketStrip />

			<section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
				<div className="mb-5 flex items-end justify-between gap-4">
					<div>
						<h2 className="text-lg font-medium tracking-tight">Latest launches</h2>
						<p className="text-sm text-muted">Newest first, straight from the contract.</p>
					</div>
					<Link to="/explore" className="text-sm text-accent-soft hover:text-accent">
						View all
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
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{tokens.map((token) => (
							<TokenCard key={token.address} token={token} />
						))}
					</div>
				)}
			</section>

			<section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
				<div className="grid gap-4 md:grid-cols-3">
					{[
						{
							title: 'Quoted in equities',
							body: 'A coin paired with NVDA trades against NVDA. Its price, its liquidity and the fees it pays you are all denominated in the stock.',
						},
						{
							title: 'Liquidity nobody can pull',
							body: 'There is no LP position to withdraw. The curve holds what it has raised and keeps quoting, permanently.',
						},
						{
							title: 'Creators earn the spread',
							body: 'Seventy percent of every swap fee goes to the creator, claimable across all pairings in a single transaction.',
						},
					].map((item) => (
						<div key={item.title} className="panel p-5">
							<h3 className="mb-2 text-sm font-medium">{item.title}</h3>
							<p className="text-sm leading-relaxed text-muted">{item.body}</p>
						</div>
					))}
				</div>
			</section>
		</>
	);
}
