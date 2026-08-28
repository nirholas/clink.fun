import { Link, NavLink } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi';
import { ROBINHOOD_CHAIN_ID } from '../lib/chain';
import { shortAddress, trim } from '../lib/format';

const NAV = [
	{ to: '/explore', label: 'Explore' },
	{ to: '/launch', label: 'Launch' },
	{ to: '/portfolio', label: 'Portfolio' },
	{ to: '/docs', label: 'Docs' },
];

export function Logo({ className = '' }: { className?: string }) {
	return (
		<span className={`inline-flex items-center gap-2 ${className}`}>
			<svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
				<circle cx="13" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="2.6" opacity="0.9" />
				<circle cx="22.5" cy="16" r="4.2" fill="#a855f7" />
			</svg>
			<span className="text-[15px] font-semibold tracking-tight">clink.fun</span>
		</span>
	);
}

export default function Header() {
	const { address, isConnected, chainId } = useAccount();
	const { connect, connectors, isPending } = useConnect();
	const { disconnect } = useDisconnect();
	const { switchChain } = useSwitchChain();
	const { data: balance } = useBalance({ address, query: { enabled: isConnected } });

	const wrongChain = isConnected && chainId !== ROBINHOOD_CHAIN_ID;
	const injectedConnector = connectors[0];

	return (
		<header className="sticky top-0 z-40 border-b border-white/8 bg-ink-950/85 backdrop-blur-md">
			<div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
				<Link to="/" className="text-white transition-opacity hover:opacity-80" aria-label="clink.fun home">
					<Logo />
				</Link>

				<nav className="hidden items-center gap-1 md:flex">
					{NAV.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							className={({ isActive }) =>
								`rounded-lg px-3 py-1.5 text-sm transition-colors ${
									isActive ? 'bg-white/8 text-white' : 'text-white/60 hover:text-white'
								}`
							}
						>
							{item.label}
						</NavLink>
					))}
				</nav>

				<div className="ml-auto flex items-center gap-2">
					{/* A wrong network is the single most common reason a
					    transaction fails, so it is surfaced as an action rather
					    than left for the wallet to reject later. */}
					{wrongChain && (
						<button
							type="button"
							onClick={() => switchChain({ chainId: ROBINHOOD_CHAIN_ID })}
							className="btn rounded-lg border border-down/40 bg-down/10 text-xs text-down hover:bg-down/20"
						>
							Switch to Robinhood Chain
						</button>
					)}

					{isConnected && !wrongChain && balance && (
						<span className="hidden font-mono text-xs text-muted sm:inline">
							{trim(balance.formatted, 4)} {balance.symbol}
						</span>
					)}

					{isConnected ? (
						<button type="button" onClick={() => disconnect()} className="btn-ghost text-xs">
							{shortAddress(address)}
						</button>
					) : (
						<button
							type="button"
							disabled={!injectedConnector || isPending}
							onClick={() => injectedConnector && connect({ connector: injectedConnector })}
							className="btn-primary text-sm"
						>
							{isPending ? 'Connecting...' : 'Connect Wallet'}
						</button>
					)}
				</div>
			</div>

			<nav className="flex items-center gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
				{NAV.map((item) => (
					<NavLink
						key={item.to}
						to={item.to}
						className={({ isActive }) =>
							`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
								isActive ? 'bg-white/8 text-white' : 'text-white/60'
							}`
						}
					>
						{item.label}
					</NavLink>
				))}
			</nav>
		</header>
	);
}
