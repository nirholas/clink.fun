import { Link } from 'react-router-dom';
import { BRIDGES, EXPLORER } from '../lib/chain';
import { Logo } from './Header';

export default function Footer() {
	return (
		<footer className="relative mt-28 overflow-hidden border-t border-white/6">
			{/* Concentric rings, the fomo.family footer motif, drawn once in SVG
			    and left to sit behind the columns. */}
			<svg
				aria-hidden="true"
				viewBox="0 0 800 800"
				className="pointer-events-none absolute -bottom-[520px] left-1/2 h-[900px] w-[900px] -translate-x-1/2 opacity-[0.18]"
			>
				<defs>
					<linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#c084fc" />
						<stop offset="1" stopColor="#38bdf8" />
					</linearGradient>
				</defs>
				{[120, 200, 280, 360, 440].map((r) => (
					<circle key={r} cx="400" cy="400" r={r} fill="none" stroke="url(#ring)" strokeWidth="1" />
				))}
			</svg>
			<div className="orb -bottom-40 left-1/2 h-80 w-[640px] -translate-x-1/2 bg-accent/20" />

			<div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6">
				<div className="mb-14 max-w-xl">
					<h2 className="display text-4xl leading-[1.05] sm:text-5xl">
						your coin. <span className="gradient-text">their stock.</span>
					</h2>
					<p className="mt-4 text-base text-muted">
						One transaction, up to five markets, liquidity that never leaves.
					</p>
					<Link to="/launch" className="btn-primary mt-6 rounded-full px-6 py-3 text-base">
						launch a coin
					</Link>
				</div>

				<div className="grid gap-10 border-t border-white/6 pt-10 md:grid-cols-4">
					<div className="md:col-span-2">
						<Logo className="text-white" />
						<p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
							Launch a coin paired with real stocks. Permissionless, fixed supply, liquidity
							that nobody can pull. On Robinhood Chain.
						</p>
					</div>

					<div>
						<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/70">Product</h3>
						<ul className="space-y-2 text-sm text-muted">
							<li><Link className="transition-colors hover:text-white" to="/explore">Explore</Link></li>
							<li><Link className="transition-colors hover:text-white" to="/launch">Launch a coin</Link></li>
							<li><Link className="transition-colors hover:text-white" to="/portfolio">Portfolio</Link></li>
							<li><Link className="transition-colors hover:text-white" to="/docs">Docs</Link></li>
						</ul>
					</div>

					<div>
						<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/70">Chain</h3>
						<ul className="space-y-2 text-sm text-muted">
							<li>
								<a className="transition-colors hover:text-white" href={EXPLORER} target="_blank" rel="noreferrer">
									Block explorer
								</a>
							</li>
							{BRIDGES.map((b) => (
								<li key={b.name}>
									<a className="transition-colors hover:text-white" href={b.url} target="_blank" rel="noreferrer">
										Bridge via {b.name}
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="mt-10 flex flex-col gap-2 border-t border-white/5 pt-5 text-xs text-muted sm:flex-row sm:items-center">
					<span>clink.fun</span>
					<span className="sm:ml-auto">
						Tokens are speculative and permanent. Nothing here is financial advice.
					</span>
				</div>
			</div>
		</footer>
	);
}
