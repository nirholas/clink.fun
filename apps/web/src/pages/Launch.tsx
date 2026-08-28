import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { decodeEventLog, keccak256, parseUnits, toBytes } from 'viem';
import { api } from '../lib/api';
import { useConfig, useStocks } from '../lib/hooks';
import { LAUNCHPAD_ADDRESS, NO_DEV_BUY, erc20Abi, launchpadAbi } from '../lib/contracts';
import { ROBINHOOD_CHAIN_ID, txUrl } from '../lib/chain';
import { sanitizeName, sanitizeSymbol, trim } from '../lib/format';
import MarketPicker, { evenWeights, type Selection } from '../components/MarketPicker';
import { NotConfigured } from '../components/States';

type Phase = 'idle' | 'uploading' | 'approving' | 'signing' | 'confirming' | 'done' | 'error';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function Launch() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const { address, isConnected, chainId } = useAccount();
	const { data: walletClient } = useWalletClient();
	const publicClient = usePublicClient();
	const { data: config } = useConfig();
	const { data: stocks } = useStocks();
	const fileInput = useRef<HTMLInputElement>(null);

	const [name, setName] = useState('');
	const [symbol, setSymbol] = useState('');
	const [description, setDescription] = useState('');
	const [links, setLinks] = useState({ website: '', twitter: '', telegram: '' });
	const [showLinks, setShowLinks] = useState(false);
	const [markets, setMarkets] = useState<Selection[]>([]);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [devBuy, setDevBuy] = useState('');
	const [phase, setPhase] = useState<Phase>('idle');
	const [message, setMessage] = useState('');
	const [result, setResult] = useState<{ token: string; hash: string } | null>(null);


	/** Launch intent: any partner can deep-link a prepared launch with query
	 * parameters, e.g. /launch?name=Chips&symbol=CHIPS&markets=NVDAx,SPCX.
	 * Markets get even weights; the user can still change everything. */
	useEffect(() => {
		if (params.get('name')) setName(params.get('name') ?? '');
		if (params.get('symbol')) setSymbol(params.get('symbol') ?? '');
		if (params.get('description')) setDescription(params.get('description') ?? '');
		const website = params.get('website') ?? '';
		const twitter = params.get('twitter') ?? '';
		const telegram = params.get('telegram') ?? '';
		if (website || twitter || telegram) {
			setLinks({ website, twitter, telegram });
			setShowLinks(true);
		}
		if (params.get('devBuy')) setDevBuy(params.get('devBuy') ?? '');
	}, [params]);

	useEffect(() => {
		const wanted = (params.get('markets') ?? '')
			.split(',')
			.map((s) => s.trim().toLowerCase())
			.filter(Boolean)
			.slice(0, 5);
		if (!wanted.length || !stocks?.length) return;
		const picked = stocks.filter((stock) => wanted.includes(stock.symbol.toLowerCase()));
		if (!picked.length) return;
		const weights = evenWeights(picked.length);
		setMarkets(picked.map((stock, i) => ({ symbol: stock.symbol, address: stock.address as `0x${string}`, weightBps: weights[i] ?? 0 })));
	}, [params, stocks]);

	const cleanSymbol = sanitizeSymbol(symbol);
	const cleanName = sanitizeName(name);
	const weightTotal = markets.reduce((sum, m) => sum + m.weightBps, 0);

	const problems = useMemo(() => {
		const list: string[] = [];
		if (!cleanName) list.push('Name is required');
		if (cleanSymbol.length < 2) list.push('Ticker needs at least two letters or digits');
		if (markets.length === 0) list.push('Pick at least one market to pair against');
		if (markets.length > 0 && weightTotal !== 10_000) list.push('Allocation must total exactly 100%');
		if (!isConnected) list.push('Connect a wallet');
		if (isConnected && chainId !== ROBINHOOD_CHAIN_ID) list.push('Switch to Robinhood Chain');
		return list;
	}, [cleanName, cleanSymbol, markets, weightTotal, isConnected, chainId]);

	function pickImage(file: File | undefined) {
		if (!file) return;
		if (file.size > MAX_IMAGE_BYTES) {
			setMessage(`That image is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 5MB.`);
			setPhase('error');
			return;
		}
		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
		if (phase === 'error') setPhase('idle');
	}

	async function submit() {
		if (problems.length || !walletClient || !publicClient) return;
		setPhase('uploading');
		setMessage('Storing artwork and descriptor');

		try {
			// 1. Artwork, then the descriptor that points at it. The descriptor
			//    is hashed from the exact bytes the server stored, never from a
			//    second serialization on this side, so the on-chain commitment
			//    always matches what is served.
			let imageUrl: string | undefined;
			if (imageFile) {
				const base64 = await fileToBase64(imageFile);
				const stored = await api.uploadImage(base64, imageFile.type);
				imageUrl = stored.url;
			}

			const meta = await api.uploadMetadata({
				name: cleanName,
				symbol: cleanSymbol,
				description: description.trim() || undefined,
				image: imageUrl,
				website: links.website.trim() || undefined,
				twitter: links.twitter.trim() || undefined,
				telegram: links.telegram.trim() || undefined,
			});
			const metadataHash = keccak256(toBytes(meta.bytes));

			// 2. An optional dev buy needs an allowance first. Skipping it needs
			//    nothing at all, which is the default path.
			let devBuyMarket = NO_DEV_BUY;
			let devBuyQuoteIn = 0n;
			const devBuyAmount = Number(devBuy);
			if (devBuyAmount > 0 && markets[0]) {
				devBuyMarket = 0;
				devBuyQuoteIn = parseUnits(devBuy, 18);
				setPhase('approving');
				setMessage(`Approving ${markets[0].symbol}`);
				const allowance = await publicClient.readContract({
					address: markets[0].address,
					abi: erc20Abi,
					functionName: 'allowance',
					args: [address!, LAUNCHPAD_ADDRESS],
				});
				if (allowance < devBuyQuoteIn) {
					const approveHash = await walletClient.writeContract({
						address: markets[0].address,
						abi: erc20Abi,
						functionName: 'approve',
						args: [LAUNCHPAD_ADDRESS, devBuyQuoteIn],
					});
					await publicClient.waitForTransactionReceipt({ hash: approveHash });
				}
			}

			// 3. The launch itself.
			setPhase('signing');
			setMessage('Confirm the launch in your wallet');
			const params = {
				name: cleanName,
				symbol: cleanSymbol,
				metadataURI: meta.url,
				metadataHash,
				allocations: markets.map((m) => ({ quoteToken: m.address, weightBps: m.weightBps })),
				creatorFeeRecipient: address!,
				devBuyMarket,
				devBuyQuoteIn,
				devBuyMinTokensOut: 0n,
				deadline: BigInt(Math.floor(Date.now() / 1000) + 900),
			};

			const { request } = await publicClient.simulateContract({
				address: LAUNCHPAD_ADDRESS,
				abi: launchpadAbi,
				functionName: 'launch',
				args: [params],
				value: BigInt(config?.launchFeeWei ?? '0'),
				account: address!,
			});
			const hash = await walletClient.writeContract(request);

			setPhase('confirming');
			setMessage('Waiting for the transaction');
			const receipt = await publicClient.waitForTransactionReceipt({ hash });
			if (receipt.status !== 'success') throw new Error('The launch transaction reverted');

			// The token address comes from the Launched event rather than the
			// simulated return value, so it is what actually happened.
			let token = '';
			for (const log of receipt.logs) {
				try {
					const parsed = decodeEventLog({ abi: launchpadAbi, data: log.data, topics: log.topics });
					if (parsed.eventName === 'Launched') {
						token = (parsed.args as unknown as { token: string }).token;
						break;
					}
				} catch { /* not our event */ }
			}

			setResult({ token, hash });
			setPhase('done');
			if (token) setTimeout(() => navigate(`/token/${token}`), 1600);
		} catch (error) {
			setPhase('error');
			const detail = error instanceof Error ? error.message : String(error);
			setMessage(detail.split('\n')[0] ?? 'Something went wrong');
		}
	}

	if (!LAUNCHPAD_ADDRESS) {
		return (
			<div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
				<NotConfigured />
			</div>
		);
	}

	const busy = phase === 'uploading' || phase === 'approving' || phase === 'signing' || phase === 'confirming';

	return (
		<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
			<h1 className="display text-4xl">launch a coin</h1>
			<p className="mt-1 text-sm text-muted">
				Choose carefully. Name, ticker, artwork and pairing are permanent once the transaction lands.
			</p>

			<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
				<div className="space-y-6">
					<section className="panel space-y-4 p-5">
						<h2 className="text-sm font-medium">Coin details</h2>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label className="label" htmlFor="coin-name">Name</label>
								<input
									id="coin-name"
									className="input"
									value={name}
									maxLength={40}
									onChange={(event) => setName(event.target.value)}
									placeholder="Name your coin"
								/>
							</div>
							<div>
								<label className="label" htmlFor="coin-ticker">Ticker</label>
								<input
									id="coin-ticker"
									className="input font-mono"
									value={symbol}
									maxLength={12}
									onChange={(event) => setSymbol(event.target.value)}
									placeholder="e.g. DOGE"
								/>
								{symbol && cleanSymbol !== symbol.toUpperCase() && (
									<p className="mt-1 text-[11px] text-muted">
										Will deploy as <span className="font-mono text-accent-soft">{cleanSymbol}</span>
									</p>
								)}
							</div>
						</div>

						<div>
							<label className="label" htmlFor="coin-description">Description</label>
							<textarea
								id="coin-description"
								className="input min-h-[92px] resize-y"
								value={description}
								maxLength={480}
								onChange={(event) => setDescription(event.target.value)}
								placeholder="What is it?"
							/>
						</div>

						<div>
							<button
								type="button"
								onClick={() => setShowLinks((open) => !open)}
								className="text-xs text-muted transition-colors hover:text-white"
							>
								{showLinks ? 'Hide' : 'Add'} social links (optional)
							</button>
							{showLinks && (
								<div className="mt-3 grid gap-3 sm:grid-cols-3">
									{(['website', 'twitter', 'telegram'] as const).map((key) => (
										<input
											key={key}
											className="input"
											value={links[key]}
											onChange={(event) => setLinks({ ...links, [key]: event.target.value })}
											placeholder={key}
											aria-label={key}
										/>
									))}
								</div>
							)}
						</div>
					</section>

					<section className="panel space-y-4 p-5">
						<div>
							<h2 className="text-sm font-medium">Paired markets</h2>
							<p className="mt-1 text-xs leading-relaxed text-muted">
								Each market becomes its own independent pool with its own price. The allocation
								splits the fixed supply between them. It is launch liquidity, not backing.
							</p>
						</div>
						{stocks ? (
							<MarketPicker stocks={stocks} selected={markets} onChange={setMarkets} />
						) : (
							<div className="h-8 animate-pulse rounded bg-white/5" />
						)}
					</section>

					<section className="panel space-y-3 p-5">
						<h2 className="text-sm font-medium">Artwork</h2>
						<div
							onClick={() => fileInput.current?.click()}
							onDragOver={(event) => event.preventDefault()}
							onDrop={(event) => {
								event.preventDefault();
								pickImage(event.dataTransfer.files[0]);
							}}
							className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg
								border border-dashed border-white/15 bg-ink-850/50 px-6 py-12 transition-colors
								hover:border-accent/40"
						>
							{imagePreview ? (
								<img src={imagePreview} alt="" className="max-h-56 rounded-lg object-contain" />
							) : (
								<>
									<span className="text-sm text-white/70">Drop an image, or click to choose</span>
									<span className="text-xs text-muted">PNG, JPG, GIF or WebP. Square, up to 5MB.</span>
								</>
							)}
						</div>
						<input
							ref={fileInput}
							type="file"
							accept="image/png,image/jpeg,image/gif,image/webp"
							className="hidden"
							onChange={(event) => pickImage(event.target.files?.[0])}
						/>
						{imageFile && (
							<button
								type="button"
								onClick={() => {
									setImageFile(null);
									setImagePreview(null);
								}}
								className="text-xs text-muted hover:text-white"
							>
								Remove image
							</button>
						)}
					</section>

					<section className="panel space-y-3 p-5">
						<div>
							<h2 className="text-sm font-medium">Buy your own coin at launch (optional)</h2>
							<p className="mt-1 text-xs leading-relaxed text-muted">
								Spends the paired stock from your wallet in the first market, in the same
								transaction. Leave it empty to skip. Skipping needs no stock and no approval.
							</p>
						</div>
						<div className="flex items-center gap-2">
							<input
								className="input font-mono"
								inputMode="decimal"
								value={devBuy}
								onChange={(event) => setDevBuy(event.target.value.replace(/[^0-9.]/g, ''))}
								placeholder="0.0"
							/>
							<span className="shrink-0 font-mono text-sm text-muted">
								{markets[0]?.symbol ?? 'stock'}
							</span>
						</div>
					</section>
				</div>

				<aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
					<div className="panel overflow-hidden">
						<div className="border-b border-white/8 px-4 py-3 text-xs uppercase tracking-wider text-muted">
							Preview
						</div>
						<div className="aspect-square w-full bg-ink-850">
							{imagePreview ? (
								<img src={imagePreview} alt="" className="h-full w-full object-cover" />
							) : (
								<div className="flex h-full items-center justify-center font-mono text-4xl text-white/12">
									{cleanSymbol.slice(0, 4) || '?'}
								</div>
							)}
						</div>
						<div className="space-y-3 p-4">
							<div className="flex flex-wrap gap-1.5">
								{markets.length ? (
									markets.map((m) => (
										<span key={m.symbol} className="chip">
											<span className="text-accent-soft">/{m.symbol}</span>
											<span className="text-muted">{(m.weightBps / 100).toFixed(0)}%</span>
										</span>
									))
								) : (
									<span className="chip text-muted">no market picked</span>
								)}
							</div>
							<div className="font-semibold">{cleanSymbol || 'TICKER'}</div>
							<div className="text-xs text-muted">{cleanName || 'Your coin name'}</div>
						</div>
					</div>

					<div className="panel space-y-2 p-4 text-xs">
						<div className="flex justify-between">
							<span className="text-muted">Supply</span>
							<span className="font-mono">1,000,000,000</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted">Launch fee</span>
							<span className="font-mono">{config ? `${trim(config.launchFeeEth, 6)} ETH` : '-'}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted">Swap fee</span>
							<span className="font-mono">
								{config ? `${(config.swapFeeBps / 100).toFixed(2)}%` : '-'}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted">Your share of fees</span>
							<span className="font-mono text-up">70%</span>
						</div>
					</div>

					{problems.length > 0 && (
						<ul className="space-y-1 rounded-lg border border-white/10 bg-ink-900/60 p-3 text-xs text-muted">
							{problems.map((problem) => (
								<li key={problem}>{problem}</li>
							))}
						</ul>
					)}

					<button
						type="button"
						disabled={problems.length > 0 || busy}
						onClick={submit}
						className="btn-primary w-full py-3 text-base"
					>
						{busy ? message || 'Working...' : 'Launch coin'}
					</button>

					{phase === 'error' && (
						<p className="break-words rounded-lg border border-down/30 bg-down/8 p-3 text-xs text-down">
							{message}
						</p>
					)}

					{phase === 'done' && result && (
						<div className="space-y-2 rounded-lg border border-up/30 bg-up/8 p-3 text-xs text-up">
							<p>Launched. Taking you to the coin page.</p>
							<a className="underline" href={txUrl(result.hash)} target="_blank" rel="noreferrer">
								View transaction
							</a>
						</div>
					)}
				</aside>
			</div>
		</div>
	);
}

function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = String(reader.result);
			const comma = result.indexOf(',');
			resolve(comma === -1 ? result : result.slice(comma + 1));
		};
		reader.onerror = () => reject(new Error('Could not read that file'));
		reader.readAsDataURL(file);
	});
}
