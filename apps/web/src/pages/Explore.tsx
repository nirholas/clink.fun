import { useMemo, useState } from 'react';
import { useStocks, useTokens } from '../lib/hooks';
import TokenCard from '../components/TokenCard';
import { CardGridSkeleton, Empty, ErrorState } from '../components/States';

type SortKey = 'newest' | 'sold' | 'raised';

const SORTS: { key: SortKey; label: string }[] = [
	{ key: 'newest', label: 'Newest' },
	{ key: 'sold', label: 'Most sold' },
	{ key: 'raised', label: 'Most raised' },
];

export default function Explore() {
	const { data: tokens, isLoading, error, refetch } = useTokens(100);
	const { data: stocks } = useStocks();
	const [query, setQuery] = useState('');
	const [market, setMarket] = useState('all');
	const [sort, setSort] = useState<SortKey>('newest');

	const filtered = useMemo(() => {
		if (!tokens) return [];
		const needle = query.trim().toLowerCase();
		const list = tokens.filter((token) => {
			if (market !== 'all' && !token.pairs.some((p) => p.quoteSymbol === market)) return false;
			if (!needle) return true;
			return (
				token.symbol.toLowerCase().includes(needle) ||
				token.name.toLowerCase().includes(needle) ||
				token.address.toLowerCase() === needle
			);
		});

		const total = (t: typeof list[number], field: 'soldPct' | 'raisedQuote') =>
			t.pairs.reduce((sum, p) => sum + Number(p[field] ?? 0), 0);

		if (sort === 'sold') return [...list].sort((a, b) => total(b, 'soldPct') - total(a, 'soldPct'));
		if (sort === 'raised') return [...list].sort((a, b) => total(b, 'raisedQuote') - total(a, 'raisedQuote'));
		return list;
	}, [tokens, query, market, sort]);

	return (
		<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
			<h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
			<p className="mt-1 text-sm text-muted">Every coin on the launchpad, read from the contract.</p>

			<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
				<input
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search ticker, name, or contract address"
					className="input sm:max-w-md"
					aria-label="Search coins"
				/>

				<select
					value={market}
					onChange={(event) => setMarket(event.target.value)}
					className="input sm:w-44"
					aria-label="Filter by paired market"
				>
					<option value="all">All markets</option>
					{stocks?.map((stock) => (
						<option key={stock.address} value={stock.symbol}>
							{stock.symbol}
						</option>
					))}
				</select>

				<div className="flex gap-1 sm:ml-auto" role="group" aria-label="Sort">
					{SORTS.map((option) => (
						<button
							key={option.key}
							type="button"
							onClick={() => setSort(option.key)}
							className={`rounded-lg px-3 py-2 text-xs transition-colors ${
								sort === option.key ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
							}`}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			<div className="mt-6">
				{isLoading && <CardGridSkeleton count={12} />}
				{error && <ErrorState error={error} onRetry={() => refetch()} />}
				{tokens && filtered.length === 0 && (
					<Empty
						title={query || market !== 'all' ? 'Nothing matches that' : 'Nothing launched yet'}
						body={
							query || market !== 'all'
								? 'Try a different ticker, or clear the market filter.'
								: 'Be the first to launch a coin paired with a stock.'
						}
						actionLabel={query || market !== 'all' ? undefined : 'Launch a coin'}
						actionTo={query || market !== 'all' ? undefined : '/launch'}
					/>
				)}
				{filtered.length > 0 && (
					<>
						<p className="mb-3 text-xs text-muted">
							{filtered.length} coin{filtered.length === 1 ? '' : 's'}
						</p>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{filtered.map((token) => (
								<TokenCard key={token.address} token={token} />
							))}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
