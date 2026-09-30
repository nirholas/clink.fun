import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';
import { decodeEventLog, formatEther, keccak256, parseUnits, toBytes } from 'viem';
import { api } from '../lib/api';
import { useConfig, useDraft, useStocks } from '../lib/hooks';
import { LAUNCHPAD_ADDRESS, NO_DEV_BUY, erc20Abi, launchpadAbi } from '../lib/contracts';
import { BRIDGES, ROBINHOOD_CHAIN_ID, txUrl } from '../lib/chain';
import { assistantName, sanitizeName, sanitizeSymbol, shortAddress, trim } from '../lib/format';
import type { LaunchDraft } from '../lib/api';
import MarketPicker, { evenWeights, type Selection } from '../components/MarketPicker';
import { NotConfigured } from '../components/States';

type Phase = 'idle' | 'uploading' | 'approving' | 'signing' | 'confirming' | 'done' | 'error';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Headroom for gas on top of the launch fee. Robinhood Chain is an L2 and a
 * launch creates one pool per market, so this covers the five-market case with
 * room to spare. It gates the button so nobody signs a transaction their
 * balance cannot pay for and gets a raw RPC string back. */
const GAS_HEADROOM_WEI = 300_000_000_000_000n; // 0.0003 ETH

/** A wallet or node error is never shown raw. Every branch here says what
 * happened and what to do about it. */
function explainError(error: unknown): string {
	const raw = error instanceof Error ? error.message : String(error);
	const text = raw.toLowerCase();

	if (text.includes('exceeds the balance') || text.includes('insufficient funds')) {
		return 'Your wallet does not have enough ETH on Robinhood Chain to cover the launch fee plus gas. Bridge a little ETH and try again.';
	}
	if (text.includes('user rejected') || text.includes('user denied') || text.includes('rejected the request')) {
		return 'You cancelled the transaction in your wallet. Nothing was spent and nothing was created.';
	}
	if (text.includes('transfer amount exceeds balance') || text.includes('erc20: insufficient')) {
		return 'You do not hold enough of that stock token for the launch buy. Lower the amount or clear it to skip the buy.';
	}
	if (text.includes('insufficient allowance')) {
		return 'The approval for your launch buy did not go through. Try again and confirm both prompts in your wallet.';
	}
	if (text.includes('deadline') || text.includes('expired')) {
		return 'The transaction sat unsigned for too long and the deadline passed. Press launch again to get a fresh one.';
	}
	if (text.includes('reverted') || text.includes('execution reverted')) {
		return 'The contract rejected the launch. Check that your allocation totals exactly 100% and that the ticker is not already taken.';
	}
	if (text.includes('chain') && text.includes('mismatch')) {
		return 'Your wallet is on the wrong network. Switch to Robinhood Chain and try again.';
	}
	if (text.includes('failed to fetch') || text.includes('network')) {
		return 'The network request failed. Check your connection and try again; nothing was submitted.';
	}
	return raw.split('\n')[0] ?? 'Something went wrong.';
}

function Step({ n, title, hint }: { n: number; title: string; hint?: string }) {
	return (
		<div className="mb-4 flex items-start gap-3">
			<span
				className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40
					bg-accent-dim font-mono text-[11px] text-accent-soft"
			>
				{n}
			</span>
			<div>
				<h2 className="display text-lg leading-none">{title}</h2>
				{hint && <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>}
			</div>
		</div>
	);
}

export default function Launch() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const { address, isConnected, chainId } = useAccount();
	const { data: walletClient } = useWalletClient();
	const publicClient = usePublicClient();
	const { data: config } = useConfig();
	const { data: stocks } = useStocks();
	const { data: balance } = useBalance({ address, query: { enabled: isConnected } });
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
	// Artwork an assistant already hosted for a planned launch. A file picked
	// here replaces it.
	const [draftImage, setDraftImage] = useState<string | null>(null);
	const [feeWallet, setFeeWallet] = useState<`0x${string}` | null>(null);
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

	/** A launch planned in an assistant over MCP: /launch?draft=<id>. Every
	 * field arrives filled in and stays editable; signing is still the user's. */
	const draftId = params.get('draft');
	const { data: draft, error: draftError, isLoading: draftLoading } = useDraft(draftId);
	const appliedDraft = useRef<string | null>(null);
	useEffect(() => {
		if (!draft || appliedDraft.current === draft.id) return;
		appliedDraft.current = draft.id;
		setName(draft.name);
		setSymbol(draft.symbol);
		setDescription(draft.description ?? '');
		const website = draft.links.website ?? '';
		const twitter = draft.links.twitter ?? '';
		const telegram = draft.links.telegram ?? '';
		setLinks({ website, twitter, telegram });
		setShowLinks(Boolean(website || twitter || telegram));
		setMarkets(draft.markets.map((m) => ({ symbol: m.symbol, address: m.address, weightBps: m.weightBps })));
		setDevBuy(draft.devBuy ?? '');
		setDraftImage(draft.image);
		setImagePreview(draft.image);
		setFeeWallet(draft.feeWallet);
	}, [draft]);
	// Only a live draft stamps its origin into the descriptor. An expired one
	// still prefills the form, and launches as an ordinary site launch.
	const liveDraft = draft?.status === 'awaiting signature' ? draft : null;

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
		setMarkets(
			picked.map((stock, i) => ({
				symbol: stock.symbol,
				address: stock.address as `0x${string}`,
				weightBps: weights[i] ?? 0,
			})),
		);
	}, [params, stocks]);

	const cleanSymbol = sanitizeSymbol(symbol);
	const cleanName = sanitizeName(name);
	const weightTotal = markets.reduce((sum, m) => sum + m.weightBps, 0);

	const launchFeeWei = BigInt(config?.launchFeeWei ?? '0');
	const requiredWei = launchFeeWei + GAS_HEADROOM_WEI;
	// The wallet knows the balance before anything is signed, so a wallet that
	// cannot pay is caught here rather than after the user commits.
	const shortOnEth = isConnected && balance !== undefined && balance.value < requiredWei;

	const problems = useMemo(() => {
		const list: string[] = [];
		if (!cleanName) list.push('Name is required');
		if (cleanSymbol.length < 2) list.push('Ticker needs at least two letters or digits');
		if (markets.length === 0) list.push('Pick at least one market to pair against');
		if (markets.length > 0 && weightTotal !== 10_000) list.push('Allocation must total exactly 100%');
		if (!isConnected) list.push('Connect a wallet');
		if (isConnected && chainId !== ROBINHOOD_CHAIN_ID) list.push('Switch to Robinhood Chain');
		if (shortOnEth) list.push('Not enough ETH for the launch fee plus gas');
		return list;
	}, [cleanName, cleanSymbol, markets, weightTotal, isConnected, chainId, shortOnEth]);

	function pickImage(file: File | undefined) {
		if (!file) return;
		if (file.size > MAX_IMAGE_BYTES) {
			setMessage(`That image is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 5MB.`);
			setPhase('error');
			return;
		}
		setImageFile(file);
		setDraftImage(null);
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
			let imageUrl = draftImage ?? undefined;
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
				// Binds the descriptor to the planned launch, which is what marks
				// the coin as launched from an assistant, provably and forever.
				draft: liveDraft?.id,
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
			const launchParams = {
				name: cleanName,
				symbol: cleanSymbol,
				metadataURI: meta.url,
				metadataHash,
				allocations: markets.map((m) => ({ quoteToken: m.address, weightBps: m.weightBps })),
				creatorFeeRecipient: feeWallet ?? address!,
				devBuyMarket,
				devBuyQuoteIn,
				devBuyMinTokensOut: 0n,
				deadline: BigInt(Math.floor(Date.now() / 1000) + 900),
			};

			const { request } = await publicClient.simulateContract({
				address: LAUNCHPAD_ADDRESS,
				abi: launchpadAbi,
				functionName: 'launch',
				args: [launchParams],
				value: launchFeeWei,
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
				} catch {
					/* not our event */
				}
			}

			setResult({ token, hash });
			setPhase('done');
			if (token) setTimeout(() => navigate(`/token/${token}`), 1600);
		} catch (error) {
			setPhase('error');
			setMessage(explainError(error));
		}
	}

	if (!LAUNCHPAD_ADDRESS) {
		return (
			<div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
				<NotConfigured />
			</div>
		);
	}

	if (draft?.status === 'launched' && draft.token) {
		return (
			<div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
				<DraftLaunched draft={draft} />
			</div>
		);
	}

	const busy = phase === 'uploading' || phase === 'approving' || phase === 'signing' || phase === 'confirming';

	return (
		<div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
			<div className="orb -left-24 top-0 h-72 w-72 bg-accent/15" />

			<div className="relative">
				{draftId && <DraftBanner draft={draft} loading={draftLoading} failed={Boolean(draftError)} />}
				<h1 className="display text-4xl sm:text-5xl">launch a coin</h1>
				<p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
					Name, ticker, artwork and pairing are permanent once the transaction lands. Everything
					below is one transaction.
				</p>
			</div>

			<div className="relative mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
				<div className="space-y-5">
					<section className="panel p-6">
						<Step n={1} title="coin details" />

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
									className="input font-mono uppercase"
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

						<div className="mt-4">
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

						<div className="mt-4">
							<button
								type="button"
								onClick={() => setShowLinks((open) => !open)}
								className="text-xs text-muted transition-colors hover:text-white"
							>
								{showLinks ? 'Hide' : 'Add'} social links (optional)
							</button>
							{showLinks && (
								<div className="mt-3 grid animate-rise gap-3 sm:grid-cols-3">
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

					<section className="panel p-6">
						<Step
							n={2}
							title="paired markets"
							hint="Each market becomes its own independent pool with its own price. The allocation splits the fixed supply between them. It is launch liquidity, not backing."
						/>
						{stocks ? (
							<MarketPicker stocks={stocks} selected={markets} onChange={setMarkets} />
						) : (
							<div className="h-8 animate-pulse rounded bg-white/5" />
						)}
					</section>

					<section className="panel p-6">
						<Step n={3} title="artwork" />
						<div
							onClick={() => fileInput.current?.click()}
							onDragOver={(event) => event.preventDefault()}
							onDrop={(event) => {
								event.preventDefault();
								pickImage(event.dataTransfer.files[0]);
							}}
							className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl
								border border-dashed border-white/15 bg-ink-850/50 px-6 py-12 transition-all
								hover:border-accent/50 hover:bg-accent-dim/30"
						>
							{imagePreview ? (
								<img src={imagePreview} alt="" className="max-h-56 rounded-xl object-contain" />
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
						{(imageFile || draftImage) && (
							<button
								type="button"
								onClick={() => {
									setImageFile(null);
									setDraftImage(null);
									setImagePreview(null);
								}}
								className="mt-3 text-xs text-muted hover:text-white"
							>
								Remove image
							</button>
						)}
					</section>

					<section className="panel p-6">
						<Step
							n={4}
							title="buy your own coin (optional)"
							hint="Spends the paired stock from your wallet in the first market, in the same transaction. Leave it empty to skip. Skipping needs no stock and no approval."
						/>
						<div className="flex items-center gap-2">
							<input
								className="input font-mono"
								inputMode="decimal"
								value={devBuy}
								onChange={(event) => setDevBuy(event.target.value.replace(/[^0-9.]/g, ''))}
								placeholder="0.0"
								aria-label="Launch buy amount"
							/>
							<span className="shrink-0 font-mono text-sm text-muted">
								{markets[0]?.symbol ?? 'stock'}
							</span>
						</div>
					</section>
				</div>

				<aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
					{/* The preview is the card the coin will actually appear as in
					    the feed, so what you see here is what everyone else sees. */}
					<div className="glow-border is-on overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-card backdrop-blur-md">
						<div className="relative aspect-square w-full bg-ink-850">
							{imagePreview ? (
								<img src={imagePreview} alt="" className="h-full w-full object-cover" />
							) : (
								<div className="flex h-full items-center justify-center bg-gradient-to-br from-ink-800 to-ink-950">
									<span className="display text-5xl text-white/10">{cleanSymbol.slice(0, 4) || '?'}</span>
								</div>
							)}
							<div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950/90 to-transparent" />
							<div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
								{markets.length ? (
									markets.map((m) => (
										<span
											key={m.symbol}
											className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-ink-950/70
												px-1.5 py-0.5 font-mono text-[10px] backdrop-blur-sm"
										>
											<span className="text-accent-soft">/{m.symbol}</span>
											<span className="text-white/50">{(m.weightBps / 100).toFixed(0)}%</span>
										</span>
									))
								) : (
									<span className="rounded-md border border-white/15 bg-ink-950/70 px-1.5 py-0.5 font-mono text-[10px] text-white/50">
										no market picked
									</span>
								)}
							</div>
							<div className="absolute bottom-2.5 left-3 right-3">
								<div className="display truncate text-xl leading-none">${cleanSymbol || 'TICKER'}</div>
								<div className="mt-0.5 truncate text-xs text-white/60">{cleanName || 'Your coin name'}</div>
							</div>
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
						{feeWallet && (
							<div className="flex items-center justify-between gap-2">
								<span className="text-muted">Fees paid to</span>
								<span className="flex items-center gap-2">
									<span className="font-mono" title={feeWallet}>{shortAddress(feeWallet)}</span>
									<button
										type="button"
										onClick={() => setFeeWallet(null)}
										className="text-[11px] text-muted underline-offset-2 transition-colors hover:text-white hover:underline focus-visible:text-white"
									>
										use my wallet
									</button>
								</span>
							</div>
						)}
						{isConnected && balance && (
							<div className="flex justify-between border-t border-white/8 pt-2">
								<span className="text-muted">Your balance</span>
								<span className={`font-mono ${shortOnEth ? 'text-down' : 'text-white/80'}`}>
									{trim(balance.formatted, 5)} ETH
								</span>
							</div>
						)}
					</div>

					{/* Not enough ETH is the one failure a creator cannot fix on
					    this page, so it gets the bridge links rather than a line
					    in a list. */}
					{shortOnEth && (
						<div className="animate-rise space-y-2 rounded-xl border border-down/30 bg-down/8 p-4 text-xs">
							<p className="font-medium text-down">You need a little ETH on Robinhood Chain</p>
							<p className="leading-relaxed text-white/70">
								Launching costs {config ? trim(config.launchFeeEth, 6) : '0.0005'} ETH plus gas, so
								keep about <span className="font-mono">{trim(formatEther(requiredWei), 5)} ETH</span>{' '}
								on hand. You have <span className="font-mono">{trim(balance?.formatted ?? '0', 5)}</span>.
							</p>
							<div className="flex flex-wrap gap-2 pt-1">
								{BRIDGES.map((bridge) => (
									<a
										key={bridge.name}
										href={bridge.url}
										target="_blank"
										rel="noreferrer"
										className="btn-ghost rounded-full px-3 py-1.5 text-[11px]"
									>
										Bridge via {bridge.name}
									</a>
								))}
							</div>
						</div>
					)}

					{problems.length > 0 && !shortOnEth && (
						<ul className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-xs text-muted">
							{problems.map((problem) => (
								<li key={problem} className="flex items-start gap-2">
									<span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/30" />
									{problem}
								</li>
							))}
						</ul>
					)}

					<button
						type="button"
						disabled={problems.length > 0 || busy}
						onClick={submit}
						className="btn-primary w-full rounded-xl py-3.5 text-base"
					>
						{busy ? message || 'Working...' : 'launch coin'}
					</button>

					{phase === 'error' && (
						<p className="animate-rise break-words rounded-xl border border-down/30 bg-down/8 p-3.5 text-xs leading-relaxed text-down">
							{message}
						</p>
					)}

					{phase === 'done' && result && (
						<div className="animate-rise space-y-2 rounded-xl border border-up/30 bg-up/8 p-3.5 text-xs text-up">
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

/** Where a planned launch came from, and what state it is in. */
function DraftBanner({ draft, loading, failed }: { draft?: LaunchDraft; loading: boolean; failed: boolean }) {
	if (loading) return <div className="mb-6 h-[62px] max-w-xl animate-pulse rounded-xl bg-white/5" />;
	if (failed || !draft) {
		return (
			<div className="mb-6 max-w-xl animate-rise rounded-xl border border-down/30 bg-down/8 p-4 text-xs leading-relaxed text-down">
				That launch plan could not be found. Ask your assistant to plan it again, or fill in the form below yourself.
			</div>
		);
	}
	const who = assistantName(draft.client);
	if (draft.status === 'expired') {
		return (
			<div className="mb-6 max-w-xl animate-rise rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-white/70">
				This plan from {who} expired unsigned. The details are filled in below; launching now works, but the coin
				will not be marked as launched from {who}. Ask {who} to plan it again for a fresh link.
			</div>
		);
	}
	return (
		<div className="mb-6 flex max-w-xl animate-rise items-start gap-3 rounded-xl border border-accent/30 bg-accent-dim p-4 text-xs leading-relaxed">
			<span className="mt-1 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent-soft" />
			<p className="text-white/80">
				<span className="font-medium text-accent-soft">Planned in {who}.</span> Everything below is filled in and still
				editable. Nothing is deployed until you sign with your own wallet, and the coin will carry a signed record that
				it was launched from {who}.
			</p>
		</div>
	);
}

function DraftLaunched({ draft }: { draft: LaunchDraft }) {
	return (
		<div className="panel animate-rise space-y-4 p-6 text-sm">
			<h1 className="display text-3xl">${draft.symbol} is live</h1>
			<p className="leading-relaxed text-white/70">
				This plan has already been signed and launched on Robinhood Chain. A plan can only be launched once.
			</p>
			<div className="flex flex-wrap gap-2">
				<Link to={`/token/${draft.token}`} className="btn-primary rounded-full px-5 py-2.5">
					open ${draft.symbol}
				</Link>
				{draft.txHash && (
					<a href={txUrl(draft.txHash)} target="_blank" rel="noreferrer" className="btn-ghost rounded-full px-5 py-2.5">
						view transaction
					</a>
				)}
				<Link to="/launch" className="btn-ghost rounded-full px-5 py-2.5">
					launch another
				</Link>
			</div>
		</div>
	);
}
