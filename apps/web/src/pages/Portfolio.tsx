import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { useStocks, useTokens } from '../lib/hooks';
import { LAUNCHPAD_ADDRESS, erc20Abi, launchpadAbi } from '../lib/contracts';
import { txUrl } from '../lib/chain';
import { trim } from '../lib/format';
import { Empty } from '../components/States';

export default function Portfolio() {
	const { address, isConnected } = useAccount();
	const { data: tokens } = useTokens(100);
	const { data: stocks } = useStocks();
	const publicClient = usePublicClient();
	const { data: walletClient } = useWalletClient();
	const [claiming, setClaiming] = useState(false);
	const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string; hash?: string } | null>(null);

	const launched = useMemo(
		() => (tokens ?? []).filter((t) => address && t.creator.toLowerCase() === address.toLowerCase()),
		[tokens, address],
	);

	// Holdings are read per token rather than from an indexer, so the page is
	// always correct even seconds after a trade.
	const { data: holdings } = useQuery({
		queryKey: ['holdings', address, tokens?.length],
		enabled: Boolean(address && publicClient && tokens?.length),
		staleTime: 10_000,
		queryFn: async () => {
			const rows = await Promise.all(
				(tokens ?? []).map(async (token) => {
					const balance = (await publicClient!.readContract({
						address: token.address,
						abi: erc20Abi,
						functionName: 'balanceOf',
						args: [address!],
					})) as bigint;
					return { token, balance };
				}),
			);
			return rows.filter((row) => row.balance > 0n);
		},
	});

	const { data: claimable, refetch: refetchClaimable } = useQuery({
		queryKey: ['claimable', address, stocks?.length],
		enabled: Boolean(address && publicClient && stocks?.length && LAUNCHPAD_ADDRESS),
		staleTime: 15_000,
		queryFn: async () => {
			const rows = await Promise.all(
				(stocks ?? []).map(async (stock) => {
					const amount = (await publicClient!.readContract({
						address: LAUNCHPAD_ADDRESS,
						abi: launchpadAbi,
						functionName: 'claimable',
						args: [address!, stock.address],
					})) as bigint;
					return { stock, amount };
				}),
			);
			return rows.filter((row) => row.amount > 0n);
		},
	});

	async function claimAll() {
		if (!walletClient || !publicClient || !claimable?.length) return;
		setClaiming(true);
		setStatus(null);
		try {
			// One transaction for every asset. A creator paired against three
			// stocks should not need three signatures to collect one day of fees.
			const { request } = await publicClient.simulateContract({
				address: LAUNCHPAD_ADDRESS,
				abi: launchpadAbi,
				functionName: 'claimFees',
				args: [claimable.map((row) => row.stock.address)],
				account: address!,
			});
			const hash = await walletClient.writeContract(request);
			await publicClient.waitForTransactionReceipt({ hash });
			setStatus({ kind: 'ok', text: 'Fees claimed', hash });
			refetchClaimable();
		} catch (error) {
			const detail = error instanceof Error ? error.message : String(error);
			setStatus({ kind: 'error', text: detail.split('\n')[0] ?? 'Claim failed' });
		} finally {
			setClaiming(false);
		}
	}

	if (!isConnected) {
		return (
			<div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
				<Empty
					title="Connect a wallet"
					body="Your holdings, the coins you launched, and the fees they have earned all live here."
				/>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
			<h1 className="display text-4xl">portfolio</h1>

			<section className="panel p-5">
				<div className="mb-4 flex items-center justify-between gap-4">
					<div>
						<h2 className="text-sm font-medium">Creator fees</h2>
						<p className="mt-0.5 text-xs text-muted">
							Seventy percent of every swap through your coins, paid in the asset each pool quotes.
						</p>
					</div>
					{claimable && claimable.length > 0 && (
						<button type="button" onClick={claimAll} disabled={claiming} className="btn-primary shrink-0">
							{claiming ? 'Claiming...' : `Claim ${claimable.length} asset${claimable.length === 1 ? '' : 's'}`}
						</button>
					)}
				</div>

				{!claimable || claimable.length === 0 ? (
					<p className="text-sm text-muted">
						Nothing claimable yet. Fees accrue as people trade the coins you launched.
					</p>
				) : (
					<ul className="space-y-2">
						{claimable.map((row) => (
							<li key={row.stock.address} className="flex items-center justify-between text-sm">
								<span className="font-mono text-accent-soft">{row.stock.symbol}</span>
								<span className="font-mono">{trim(formatUnits(row.amount, row.stock.decimals), 8)}</span>
							</li>
						))}
					</ul>
				)}

				{status && (
					<div
						className={`mt-4 rounded-lg border p-3 text-xs ${
							status.kind === 'ok' ? 'border-up/30 bg-up/8 text-up' : 'border-down/30 bg-down/8 text-down'
						}`}
					>
						<p className="break-words">{status.text}</p>
						{status.hash && (
							<a className="underline" href={txUrl(status.hash)} target="_blank" rel="noreferrer">
								View transaction
							</a>
						)}
					</div>
				)}
			</section>

			<section>
				<h2 className="mb-3 text-sm font-medium">Holdings</h2>
				{!holdings || holdings.length === 0 ? (
					<Empty title="No coins yet" body="Buy something on the explore page and it shows up here." actionLabel="Explore" actionTo="/explore" />
				) : (
					<div className="panel divide-y divide-white/6">
						{holdings.map(({ token, balance }) => (
							<Link
								key={token.address}
								to={`/token/${token.address}`}
								className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/4"
							>
								<div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-ink-850">
									{token.image && <img src={token.image} alt="" className="h-full w-full object-cover" />}
								</div>
								<div className="min-w-0 flex-1">
									<div className="truncate text-sm font-medium">{token.symbol}</div>
									<div className="truncate text-xs text-muted">{token.name}</div>
								</div>
								<div className="shrink-0 font-mono text-sm">{trim(formatUnits(balance, 18), 4)}</div>
							</Link>
						))}
					</div>
				)}
			</section>

			<section>
				<h2 className="mb-3 text-sm font-medium">Coins you launched</h2>
				{launched.length === 0 ? (
					<Empty
						title="Nothing launched yet"
						body="Pick a stock to pair against, upload a picture, and it is live in one transaction."
						actionLabel="Launch a coin"
						actionTo="/launch"
					/>
				) : (
					<div className="panel divide-y divide-white/6">
						{launched.map((token) => (
							<Link
								key={token.address}
								to={`/token/${token.address}`}
								className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/4"
							>
								<div className="min-w-0 flex-1">
									<div className="truncate text-sm font-medium">{token.symbol}</div>
									<div className="truncate text-xs text-muted">
										{token.pairs.map((p) => `/${p.quoteSymbol}`).join(' ')}
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
