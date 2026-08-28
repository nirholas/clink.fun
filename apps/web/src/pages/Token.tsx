import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { useToken } from '../lib/hooks';
import { LAUNCHPAD_ADDRESS, erc20Abi, launchpadAbi } from '../lib/contracts';
import { addressUrl, txUrl } from '../lib/chain';
import { pct, shortAddress, trim } from '../lib/format';
import { ErrorState } from '../components/States';
import ChartPanel from '../components/ChartPanel';
import TradeFeed from '../components/TradeFeed';

type Side = 'buy' | 'sell';

export default function Token() {
	const { address: tokenAddress } = useParams<{ address: string }>();
	const { data: token, isLoading, error, refetch } = useToken(tokenAddress);
	const [marketIndex, setMarketIndex] = useState(0);
	const market = token?.pairs[marketIndex];

	if (isLoading) {
		return (
			<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
				<div className="h-64 animate-pulse rounded-xl bg-white/5" />
			</div>
		);
	}
	if (error || !token) {
		return (
			<div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
				<ErrorState error={error ?? new Error('Token not found')} onRetry={() => refetch()} />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
			<div className="flex flex-col gap-5 sm:flex-row sm:items-start">
				<div className="glow-border is-on h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-ink-850 shadow-glow-sm">
					{token.image ? (
						<img src={token.image} alt="" className="h-full w-full object-cover" />
					) : (
						<div className="flex h-full items-center justify-center font-mono text-2xl text-white/12">
							{token.symbol.slice(0, 3)}
						</div>
					)}
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
						<h1 className="display text-4xl sm:text-5xl">${token.symbol}</h1>
						<span className="text-muted">{token.name}</span>
					</div>
					{token.description && (
						<p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{token.description}</p>
					)}
					<div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
						{token.pairs.map((pair, index) => (
							<button
								key={pair.quoteToken}
								type="button"
								onClick={() => setMarketIndex(index)}
								className={`chip transition-colors ${
									index === marketIndex ? 'border-accent bg-accent-dim text-accent-soft' : ''
								}`}
							>
								/{pair.quoteSymbol} {(pair.weightBps / 100).toFixed(0)}%
							</button>
						))}
						<a
							href={addressUrl(token.address)}
							target="_blank"
							rel="noreferrer"
							className="chip text-muted hover:text-white"
						>
							{shortAddress(token.address)}
						</a>
					</div>
				</div>
			</div>

			<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
				<div className="space-y-4">
					{market && (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							<Stat label={`Price / ${market.quoteSymbol}`} value={trim(market.priceQuote, 10)} />
							<Stat label="Raised" value={`${trim(market.raisedQuote, 4)} ${market.quoteSymbol}`} />
							<Stat label="Sold" value={pct(market.soldPct, 2)} />
							<Stat label="Supply" value="1,000,000,000" />
						</div>
					)}

					{market && <ChartPanel token={token} market={market} />}

					{market && (
						<div className="panel p-5">
							<div className="mb-2 flex items-center justify-between text-xs text-muted">
								<span>Progress through the {market.quoteSymbol} pool</span>
								<span className="font-mono">{pct(market.soldPct, 2)}</span>
							</div>
							<div className="h-2 overflow-hidden rounded-full bg-white/8">
								<div
									className="h-full rounded-full bg-gradient-to-r from-accent to-accent-soft transition-[width] duration-700"
									style={{ width: `${Math.min(100, Math.max(0, market.soldPct))}%` }}
								/>
							</div>
							<p className="mt-3 text-xs leading-relaxed text-muted">
								Price rises as the pool sells and falls as it is sold back. There is no migration
								and no ceiling: this curve behaves the same way forever.
							</p>
						</div>
					)}

					{market && <TradeFeed token={token.address} market={market} />}

					<div className="panel space-y-3 p-5 text-sm">
						<h2 className="text-sm font-medium">About this coin</h2>
						<Row label="Creator" value={shortAddress(token.creator)} href={addressUrl(token.creator)} />
						<Row label="Contract" value={shortAddress(token.address)} href={addressUrl(token.address)} />
						{token.metadataURI && <Row label="Metadata" value="descriptor" href={token.metadataURI} />}
						{token.links?.website && <Row label="Website" value={token.links.website} href={token.links.website} />}
						{token.links?.twitter && <Row label="X" value={token.links.twitter} href={token.links.twitter} />}
						{token.links?.telegram && <Row label="Telegram" value={token.links.telegram} href={token.links.telegram} />}
					</div>
				</div>

				{market && <TradePanel token={token.address} market={market} onDone={() => refetch()} />}
			</div>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="panel p-4">
			<div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
			<div className="mt-1 truncate font-mono text-base text-white">{value}</div>
		</div>
	);
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
	return (
		<div className="flex items-center justify-between gap-4 border-t border-white/6 pt-3 first:border-0 first:pt-0">
			<span className="text-xs text-muted">{label}</span>
			{href ? (
				<a href={href} target="_blank" rel="noreferrer" className="truncate font-mono text-xs text-accent-soft hover:text-accent">
					{value}
				</a>
			) : (
				<span className="truncate font-mono text-xs">{value}</span>
			)}
		</div>
	);
}

function TradePanel({
	token,
	market,
	onDone,
}: {
	token: `0x${string}`;
	market: { quoteToken: `0x${string}`; quoteSymbol: string };
	onDone: () => void;
}) {
	const { address, isConnected } = useAccount();
	const { data: walletClient } = useWalletClient();
	const publicClient = usePublicClient();

	const [side, setSide] = useState<Side>('buy');
	const [amount, setAmount] = useState('');
	const [slippagePct, setSlippagePct] = useState(3);
	const [quote, setQuote] = useState<{ out: bigint; fee: bigint } | null>(null);
	const [busy, setBusy] = useState(false);
	const [status, setStatus] = useState<{ kind: 'error' | 'ok'; text: string; hash?: string } | null>(null);

	const parsed = useMemo(() => {
		try {
			return amount ? parseUnits(amount, 18) : 0n;
		} catch {
			return 0n;
		}
	}, [amount]);

	// Quote on every change, debounced. A trade panel that only prices on
	// submit makes the user find out what they are getting after they commit.
	useEffect(() => {
		if (!publicClient || parsed === 0n) {
			setQuote(null);
			return;
		}
		let cancelled = false;
		const timer = setTimeout(async () => {
			try {
				const result = (await publicClient.readContract({
					address: LAUNCHPAD_ADDRESS,
					abi: launchpadAbi,
					functionName: side === 'buy' ? 'quoteBuy' : 'quoteSell',
					args: [token, market.quoteToken, parsed],
				})) as readonly [bigint, bigint];
				if (!cancelled) setQuote({ out: result[0], fee: result[1] });
			} catch {
				if (!cancelled) setQuote(null);
			}
		}, 220);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [publicClient, parsed, side, token, market.quoteToken]);

	const minOut = quote ? (quote.out * BigInt(Math.round((100 - slippagePct) * 100))) / 10_000n : 0n;

	async function trade() {
		if (!walletClient || !publicClient || parsed === 0n) return;
		setBusy(true);
		setStatus(null);
		try {
			const spendToken = side === 'buy' ? market.quoteToken : token;
			const allowance = await publicClient.readContract({
				address: spendToken,
				abi: erc20Abi,
				functionName: 'allowance',
				args: [address!, LAUNCHPAD_ADDRESS],
			});
			if (allowance < parsed) {
				const approveHash = await walletClient.writeContract({
					address: spendToken,
					abi: erc20Abi,
					functionName: 'approve',
					args: [LAUNCHPAD_ADDRESS, parsed],
				});
				await publicClient.waitForTransactionReceipt({ hash: approveHash });
			}

			const { request } = await publicClient.simulateContract({
				address: LAUNCHPAD_ADDRESS,
				abi: launchpadAbi,
				functionName: side,
				args: [token, market.quoteToken, parsed, minOut],
				account: address!,
			});
			const hash = await walletClient.writeContract(request);
			await publicClient.waitForTransactionReceipt({ hash });
			setStatus({ kind: 'ok', text: side === 'buy' ? 'Bought' : 'Sold', hash });
			setAmount('');
			onDone();
		} catch (error) {
			const detail = error instanceof Error ? error.message : String(error);
			setStatus({ kind: 'error', text: detail.split('\n')[0] ?? 'Trade failed' });
		} finally {
			setBusy(false);
		}
	}

	return (
		<aside className="panel space-y-4 p-5 lg:sticky lg:top-20 lg:self-start">
			<div className="grid grid-cols-2 gap-1 rounded-lg bg-ink-850 p-1">
				{(['buy', 'sell'] as const).map((option) => (
					<button
						key={option}
						type="button"
						onClick={() => {
							setSide(option);
							setAmount('');
						}}
						className={`rounded-md py-2 text-sm font-medium capitalize transition-colors ${
							side === option
								? option === 'buy'
									? 'bg-up/15 text-up'
									: 'bg-down/15 text-down'
								: 'text-muted hover:text-white'
						}`}
					>
						{option}
					</button>
				))}
			</div>

			<div>
				<label className="label" htmlFor="trade-amount">
					{side === 'buy' ? `Spend ${market.quoteSymbol}` : 'Sell tokens'}
				</label>
				<input
					id="trade-amount"
					className="input font-mono"
					inputMode="decimal"
					value={amount}
					onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
					placeholder="0.0"
				/>
			</div>

			<div className="space-y-1.5 text-xs">
				<div className="flex justify-between">
					<span className="text-muted">You receive</span>
					<span className="font-mono">
						{quote ? trim(formatUnits(quote.out, 18), 6) : '-'}{' '}
						{side === 'buy' ? '' : market.quoteSymbol}
					</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted">Fee</span>
					<span className="font-mono text-muted">
						{quote ? `${trim(formatUnits(quote.fee, 18), 6)} ${market.quoteSymbol}` : '-'}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-muted">Max slippage</span>
					<div className="flex gap-1">
						{[1, 3, 5, 10].map((value) => (
							<button
								key={value}
								type="button"
								onClick={() => setSlippagePct(value)}
								className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${
									slippagePct === value ? 'bg-white/12 text-white' : 'text-muted hover:text-white'
								}`}
							>
								{value}%
							</button>
						))}
					</div>
				</div>
			</div>

			<button
				type="button"
				disabled={!isConnected || busy || parsed === 0n}
				onClick={trade}
				className={`w-full py-3 text-base ${side === 'buy' ? 'btn-primary' : 'btn bg-down text-white hover:bg-down/85'}`}
			>
				{!isConnected ? 'Connect wallet' : busy ? 'Working...' : side === 'buy' ? 'Buy' : 'Sell'}
			</button>

			{status && (
				<div
					className={`rounded-lg border p-3 text-xs ${
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
		</aside>
	);
}
