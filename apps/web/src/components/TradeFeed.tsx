import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { api, type Pair } from '../lib/api';
import { shortAddress, timeAgo, trim } from '../lib/format';
import { txUrl } from '../lib/chain';

/** Every swap through this pool, newest first, straight from the chain's logs. */
export default function TradeFeed({ token, market }: { token: string; market: Pair }) {
	const { data, isLoading } = useQuery({
		queryKey: ['trades', token, market.quoteToken],
		queryFn: () => api.trades(token, market.quoteToken, 50),
		refetchInterval: 20_000,
		staleTime: 10_000,
	});

	const trades = data?.items ?? [];

	return (
		<div className="panel overflow-hidden">
			<div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
				<h2 className="text-sm font-medium">Trades</h2>
				<span className="text-xs text-muted">/{market.quoteSymbol}</span>
			</div>

			{isLoading && <div className="h-24 animate-pulse bg-white/[0.02]" />}

			{!isLoading && trades.length === 0 && (
				<p className="px-4 py-8 text-center text-sm text-muted">
					No trades yet. The first buy shows up here within a block.
				</p>
			)}

			{trades.length > 0 && (
				<div className="max-h-72 overflow-y-auto">
					<table className="w-full text-xs">
						<thead className="sticky top-0 bg-ink-900/95 text-muted backdrop-blur">
							<tr>
								<th className="px-4 py-2 text-left font-medium">Side</th>
								<th className="px-4 py-2 text-right font-medium">{market.quoteSymbol}</th>
								<th className="px-4 py-2 text-right font-medium">Tokens</th>
								<th className="px-4 py-2 text-right font-medium">Trader</th>
								<th className="px-4 py-2 text-right font-medium">Age</th>
							</tr>
						</thead>
						<tbody>
							{trades.map((trade) => (
								<tr key={trade.txHash} className="border-t border-white/5">
									<td className={`px-4 py-2 font-medium ${trade.isBuy ? 'text-up' : 'text-down'}`}>
										{trade.isBuy ? 'buy' : 'sell'}
									</td>
									<td className="px-4 py-2 text-right font-mono">
										{trim(formatUnits(BigInt(trade.quoteAmount), 18), 6)}
									</td>
									<td className="px-4 py-2 text-right font-mono text-muted">
										{trim(formatUnits(BigInt(trade.tokenAmount), 18), 2)}
									</td>
									<td className="px-4 py-2 text-right font-mono text-muted">
										{shortAddress(trade.trader)}
									</td>
									<td className="px-4 py-2 text-right">
										<a
											href={txUrl(trade.txHash)}
											target="_blank"
											rel="noreferrer"
											className="text-muted hover:text-white"
										>
											{timeAgo(trade.time * 1000)}
										</a>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
