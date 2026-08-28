import { Link, NavLink } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi';
import { ROBINHOOD_CHAIN_ID } from '../lib/chain';
import { shortAddress, trim } from '../lib/format';

const NAV = [
	{ to: '/explore', label: 'explore' },
	{ to: '/launch', label: 'launch' },
	{ to: '/portfolio', label: 'portfolio' },
	{ to: '/docs', label: 'docs' },
];

export function Logo({ className = '' }: { className?: string }) {
	return (
		<span className={`inline-flex items-center gap-2 ${className}`}>
			<svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
				<defs>
					<linearGradient id="clink-g" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#c084fc" />
						<stop offset="1" stopColor="#38bdf8" />
					</linearGradient>
				</defs>
				<circle cx="13" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="2.6" opacity="0.9" />
				<circle cx="22.5" cy="16" r="4.4" fill="url(#clink-g)" />
			</svg>
			<span className="display text-[17px] font-bold">clink.fun</span>
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

	const navClass = ({ isActive }: { isActive: boolean }) =>
		`rounded-full px-3.5 py-1.5 text-sm transition-all ${
			isActive
				? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
				: 'text-white/60 hover:bg-white/5 hover:text-white'
		}`;

	return (
		<header className="sticky top-0 z-40 border-b border-white/6 bg-ink-950/70 backdrop-blur-xl">
			<div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
				<Link to="/" className="text-white transition-opacity hover:opacity-80" aria-label="clink.fun home">
					<Logo />
				</Link>

				<nav className="hidden items-center gap-0.5 rounded-full border border-white/8 bg-white/[0.03] p-1 md:flex">
					{NAV.map((item) => (
						<NavLink key={item.to} to={item.to} className={navClass}>
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
							className="btn rounded-full border border-down/40 bg-down/10 text-xs text-down hover:bg-down/20"
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
						<button type="button" onClick={() => disconnect()} className="btn-ghost rounded-full text-xs">
							<span className="h-1.5 w-1.5 rounded-full bg-up" />
							{shortAddress(address)}
						</button>
					) : (
						<button
							type="button"
							disabled={!injectedConnector || isPending}
							onClick={() => injectedConnector && connect({ connector: injectedConnector })}
							className="btn-primary rounded-full text-sm"
						>
							{isPending ? 'Connecting...' : 'Connect wallet'}
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
							`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
								isActive ? 'bg-white/10 text-white' : 'text-white/60'
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
