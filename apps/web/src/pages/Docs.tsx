import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { BRIDGES, EXPLORER, ROBINHOOD_CHAIN_ID } from '../lib/chain';
import { LAUNCHPAD_ADDRESS } from '../lib/contracts';
import { useConfig } from '../lib/hooks';

const SECTIONS = [
	{ id: 'what', label: 'What this is' },
	{ id: 'launch', label: 'Launching' },
	{ id: 'mcp', label: 'Launch from Claude' },
	{ id: 'curve', label: 'How pricing works' },
	{ id: 'fees', label: 'Fees' },
	{ id: 'chain', label: 'Chain and bridging' },
	{ id: 'contracts', label: 'Contracts' },
	{ id: 'api', label: 'API' },
	{ id: 'risks', label: 'Risks' },
] as const;

export default function Docs() {
	const { section } = useParams();
	const { hash } = useLocation();
	const target = section ?? hash.replace(/^#/, '');
	const [active, setActive] = useState<string>(SECTIONS.some((s) => s.id === target) ? target : 'what');
	const { data: config } = useConfig();
	const mcpUrl = config?.mcpUrl ?? `${window.location.origin}/mcp`;

	// Deep links from other pages (/docs#mcp, /docs/mcp) land on their section.
	useEffect(() => {
		if (!target) return;
		document.getElementById(target)?.scrollIntoView({ block: 'start' });
	}, [target]);

	return (
		<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
			<h1 className="text-2xl font-semibold tracking-tight">Docs</h1>

			<div className="mt-8 grid gap-10 lg:grid-cols-[200px_1fr]">
				<nav className="lg:sticky lg:top-20 lg:self-start">
					<ul className="space-y-1">
						{SECTIONS.map((section) => (
							<li key={section.id}>
								<a
									href={`#${section.id}`}
									onClick={() => setActive(section.id)}
									className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
										active === section.id ? 'bg-white/8 text-white' : 'text-muted hover:text-white'
									}`}
								>
									{section.label}
								</a>
							</li>
						))}
					</ul>
				</nav>

				<div className="max-w-2xl space-y-12 text-sm leading-relaxed text-white/75">
					<Section id="what" title="What this is">
						<p>
							clink.fun is a permissionless launchpad on Robinhood Chain. Anyone can deploy a
							fixed-supply ERC-20 that is priced against one to five tokenized stocks. There is no
							listing process, no allowlist and no approval step.
						</p>
						<p>
							The thing that makes it different from every other launchpad is the quote asset. A
							coin here is not quoted in a stablecoin or in the chain's gas token. It is quoted in
							NVDA, or TSLA, or a split across several of them. Its price, its depth and the fees
							it pays its creator are all denominated in equity.
						</p>
						<Callout>
							The pairing is launch liquidity, not backing. A coin paired with AAPL is not a claim
							on AAPL, is not redeemable for AAPL, and is not an index or a fund.
						</Callout>
					</Section>

					<Section id="launch" title="Launching">
						<p>One transaction. You need gas and the flat launch fee, and nothing else.</p>
						<ol className="ml-5 list-decimal space-y-2">
							<li>Name, ticker, description and a picture. All permanent once deployed.</li>
							<li>
								Pick one to five markets and set the allocation. Weights must total exactly 100%,
								which the form enforces before it will let you sign.
							</li>
							<li>
								Optionally buy some of your own coin in the same transaction. Skipping this is the
								default and requires no stock balance and no approval.
							</li>
						</ol>
						<p>
							The artwork and descriptor are stored content-addressed, and the keccak of the exact
							descriptor bytes is written on chain alongside the URI. That commitment means a
							rehosted document cannot silently differ from what was launched.
						</p>
					</Section>

					<Section id="mcp" title="Launch from Claude">
						<p>
							clink.fun is a remote MCP server, so Claude (or any assistant that speaks the Model Context
							Protocol) can browse markets, read coins, price trades and plan a launch for you. Planning is as
							far as the assistant gets: it hands you a launch link, you open it, connect your own wallet,
							review, and sign. Nothing is deployed and nothing is spent until you do.
						</p>
						<CopyField label="Connector URL" value={mcpUrl} />
						<ol className="ml-5 list-decimal space-y-2">
							<li>
								<span className="text-white/90">Claude on the web or desktop:</span> Settings, Connectors, Add custom
								connector, then paste the URL above.
							</li>
							<li>
								<span className="text-white/90">Claude Code:</span>
								<CopyField value={`claude mcp add --transport http clink ${mcpUrl}`} />
							</li>
							<li>
								<span className="text-white/90">Clients that launch servers over stdio</span> (Cursor, Cline, Windsurf,
								Claude Desktop config files) run the bridge package:
								<CopyField value="npx -y clink-mcp" />
							</li>
						</ol>
						<p>Then ask for what you want, for example: "launch a coin called Chip Dip, ticker CHIPS, 70% NVDA and 30% AMD".</p>
						<Table
							rows={[
								['plan_launch', 'Validate a coin and return a launch link you sign with your wallet', ''],
								['launch_status', 'Whether a planned launch has been signed, and the coin once it has', ''],
								['list_markets', 'The stocks a coin can pair against', ''],
								['list_coins', 'Launched coins, filterable by market or by launched-from-an-assistant', ''],
								['get_coin', 'Price, curve and raise for every market a coin trades in', ''],
								['quote_trade', 'Price a buy or sell before committing', ''],
								['claimable_fees', 'Creator fees a wallet can claim right now', ''],
								['fee_schedule', 'Launch fee, swap fee and creator share, live from the contract', ''],
							]}
						/>
						<p>
							Every coin planned this way records where it came from. Its descriptor, whose hash is written on
							chain at launch, carries an origin block naming the channel, the assistant and the plan, signed by
							the platform attester
							{config?.attester ? (
								<>
									{' '}
									<span className="break-all font-mono text-white/85">{config.attester}</span>
								</>
							) : null}
							. Anyone can recover the signer of the origin message and check it, without trusting this site.
							Coins launched this way carry a "via Claude" badge and have their own filter on the explore page.
						</p>
					</Section>

					<Section id="curve" title="How pricing works">
						<p>
							Each pairing gets its own constant-product bonding curve with a virtual quote
							reserve. The virtual reserve is what gives the curve a starting price without anyone
							depositing the stock, which is why a launch costs only the flat fee.
						</p>
						<p>
							Buying moves price up along the curve, selling moves it back down. The two sides are
							symmetric, minus fees. Rounding always favours the pool, so a buy followed
							immediately by a sell returns slightly less than it cost, never more.
						</p>
						<p>
							There is no graduation and no migration. Tokens are sold from the curve
							asymptotically, so price rises without bound and there is never a moment where
							liquidity moves somewhere else. A curve behaves the same on day one and day one
							thousand.
						</p>
						<p>
							Multiple markets do not arbitrage each other automatically. A large buy through one
							pool can leave that market priced differently from the others until someone trades
							the gap.
						</p>
					</Section>

					<Section id="fees" title="Fees">
						<Table
							rows={[
								['Launch fee', 'Flat, in ETH', 'Protocol treasury, once at launch'],
								['Swap fee', 'Taken from the quote side of every trade', 'Split below'],
								['Creator share', '70% of swap fees', 'The coin creator'],
								['Protocol share', '30% of swap fees', 'Protocol treasury'],
							]}
						/>
						<p>
							Fees accrue in the asset each pool quotes. A coin paired with NVDA earns its creator
							NVDA. Claiming is one transaction for every asset at once, not one per asset.
						</p>
						<p>
							The fee recipient can be moved by whoever currently holds it, so rotating wallets or
							handing a project to a DAO does not cost you the revenue. Fees already accrued stay
							with whoever earned them.
						</p>
					</Section>

					<Section id="chain" title="Chain and bridging">
						<Table
							rows={[
								['Network', 'Robinhood Chain', ''],
								['Chain ID', String(ROBINHOOD_CHAIN_ID), ''],
								['Gas token', 'ETH', ''],
								['Explorer', EXPLORER, EXPLORER],
							]}
						/>
						<p>
							Getting gas onto the chain is the only fiddly step. It is an Arbitrum Orbit chain, so
							the canonical bridge runs from Ethereum L1 and costs more in L1 gas than most people
							want to spend. These are cheaper:
						</p>
						<ul className="ml-5 list-disc space-y-1">
							{BRIDGES.map((bridge) => (
								<li key={bridge.name}>
									<a className="text-accent-soft hover:text-accent" href={bridge.url} target="_blank" rel="noreferrer">
										{bridge.name}
									</a>{' '}
									<span className="text-muted">{bridge.note}</span>
								</li>
							))}
						</ul>
					</Section>

					<Section id="contracts" title="Contracts">
						<Table
							rows={[
								['Launchpad', LAUNCHPAD_ADDRESS || 'not yet deployed', LAUNCHPAD_ADDRESS ? `${EXPLORER}/address/${LAUNCHPAD_ADDRESS}` : ''],
							]}
						/>
						<p>
							Two contracts, no external dependencies, no proxy. The launchpad holds the curves and
							the fee accounting. Each coin is a plain fixed-supply ERC-20 with no mint function, no
							owner, no pause and no upgrade path: the supply at construction is the supply forever,
							and the launchpad holds no privilege over a token it created.
						</p>
						<p>
							The owner key can change the launch fee, the swap fee and the quote registry. The swap
							fee is capped in code at 5%, so the key cannot be used to expropriate traders.
						</p>
					</Section>

					<Section id="api" title="API">
						<p>Public, unauthenticated, CORS-open.</p>
						<Table
							rows={[
								['GET /api/config', 'Chain id, launchpad address, current fees', ''],
								['GET /api/tokens', 'Every coin, newest first, read from the contract', ''],
								['GET /api/tokens/:address', 'One coin with its pairings and curves', ''],
								['GET /api/stocks', 'The stock tokens available to pair against', ''],
								['POST /api/images', 'Store artwork, returns a permanent URL', ''],
								['POST /api/metadata', 'Store a descriptor, returns the URL and exact bytes', ''],
								['GET /api/tokens?origin=prompt', 'Only coins planned by an assistant over MCP', ''],
								['GET /api/drafts/:id', 'A planned launch, and its coin once signed', ''],
								['POST /mcp', 'The MCP server, streamable HTTP', ''],
							]}
						/>
						<p>
							The token endpoints read the chain, so the API owns no state that matters and can be
							redeployed freely. Only images and descriptors are stored, both content-addressed by
							the SHA-256 of their own bytes.
						</p>
					</Section>

					<Section id="risks" title="Risks">
						<p>
							Launching a coin is a public, permanent, irreversible act. Tokens launched here are
							speculative and can go to zero. You are responsible for what you launch and for
							anyone who buys it.
						</p>
						<p>
							Liquidity is permanently locked, which cuts both ways: nobody can rug the pool, and
							nobody can withdraw it either, including you. The only thing a creator can extract is
							the fee stream.
						</p>
						<Callout tone="warn">
							The contracts have not been audited. Read them before you put money behind them.
						</Callout>
					</Section>
				</div>
			</div>
		</div>
	);
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
	return (
		<section id={id} className="scroll-mt-24 space-y-4">
			<h2 className="text-lg font-medium tracking-tight text-white">{title}</h2>
			{children}
		</section>
	);
}

function Callout({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'warn' }) {
	return (
		<div
			className={`rounded-lg border p-4 text-sm ${
				tone === 'warn' ? 'border-down/30 bg-down/8 text-down' : 'border-accent/25 bg-accent-dim text-white/80'
			}`}
		>
			{children}
		</div>
	);
}

function Table({ rows }: { rows: (readonly [string, string, string])[] | string[][] }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full border-collapse text-sm">
				<tbody>
					{rows.map((row) => (
						<tr key={row[0]} className="border-b border-white/8">
							<td className="whitespace-nowrap py-2.5 pr-4 align-top font-medium text-white/85">{row[0]}</td>
							<td className="py-2.5 align-top text-muted">
								{row[2] ? (
									<a className="break-all font-mono text-accent-soft hover:text-accent" href={row[2]} target="_blank" rel="noreferrer">
										{row[1]}
									</a>
								) : (
									<span className="break-all">{row[1]}</span>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

/** A value people will paste somewhere, with a copy button that says when it worked. */
function CopyField({ label, value }: { label?: string; value: string }) {
	const [copied, setCopied] = useState(false);
	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} catch {
			setCopied(false);
		}
	}
	return (
		<div className="mt-2">
			{label && <div className="label">{label}</div>}
			<div className="flex items-center gap-2 rounded-lg border border-white/10 bg-ink-850/60 py-1.5 pl-3 pr-1.5">
				<code className="min-w-0 flex-1 truncate font-mono text-xs text-white/85" title={value}>
					{value}
				</code>
				<button
					type="button"
					onClick={copy}
					aria-label={`Copy ${label ?? value}`}
					className="btn-ghost shrink-0 rounded-md px-2.5 py-1 text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
				>
					{copied ? 'copied' : 'copy'}
				</button>
			</div>
		</div>
	);
}
