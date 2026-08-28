import { Link } from 'react-router-dom';
import { BRIDGES, EXPLORER } from '../lib/chain';
import { Logo } from './Header';

export default function Footer() {
	return (
		<footer className="mt-24 border-t border-white/8 bg-ink-950">
			<div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
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
						<li><Link className="hover:text-white" to="/explore">Explore</Link></li>
						<li><Link className="hover:text-white" to="/launch">Launch a coin</Link></li>
						<li><Link className="hover:text-white" to="/portfolio">Portfolio</Link></li>
						<li><Link className="hover:text-white" to="/docs">Docs</Link></li>
					</ul>
				</div>

				<div>
					<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/70">Chain</h3>
					<ul className="space-y-2 text-sm text-muted">
						<li>
							<a className="hover:text-white" href={EXPLORER} target="_blank" rel="noreferrer">
								Block explorer
							</a>
						</li>
						{BRIDGES.map((b) => (
							<li key={b.name}>
								<a className="hover:text-white" href={b.url} target="_blank" rel="noreferrer">
									Bridge via {b.name}
								</a>
							</li>
						))}
					</ul>
				</div>
			</div>

			<div className="border-t border-white/5">
				<div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:px-6">
					<span>clink.fun</span>
					<span className="sm:ml-auto">
						Tokens are speculative and permanent. Nothing here is financial advice.
					</span>
				</div>
			</div>
		</footer>
	);
}
