import type { LaunchOrigin } from '../lib/api';
import { assistantName } from '../lib/format';

/**
 * Marks a coin that was planned by an assistant over MCP. The origin is part
 * of the coin's hash-committed descriptor, so the badge states a fact about the
 * launch rather than a label anyone could apply.
 */
export default function OriginBadge({
	origin,
	href,
	size = 'sm',
}: {
	origin?: LaunchOrigin | null;
	/** Link to the descriptor, so the signed origin can be inspected. */
	href?: string;
	size?: 'sm' | 'md';
}) {
	if (origin?.channel !== 'prompt') return null;
	const who = assistantName(origin.client);
	const label = `via ${who === 'your assistant' ? 'assistant' : who}`;
	const title = origin.verified
		? `Planned in ${who} over MCP. The launch carries an origin record signed by the clink.fun attester.`
		: `Planned in ${who} over MCP.`;
	const className =
		size === 'md'
			? 'chip border-accent/40 bg-accent-dim text-accent-soft transition-colors hover:border-accent hover:text-white'
			: 'inline-flex items-center gap-1 rounded-md border border-accent/40 bg-ink-950/70 px-1.5 py-0.5 font-mono text-[10px] text-accent-soft backdrop-blur-sm';
	const content = (
		<>
			<svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
				<path d="M6 1l1.2 3.3L10.5 6 7.2 7.2 6 10.5 4.8 7.2 1.5 6l3.3-1.7z" fill="currentColor" />
			</svg>
			{label}
		</>
	);
	if (href) {
		return (
			<a href={href} target="_blank" rel="noreferrer" title={title} className={className}>
				{content}
			</a>
		);
	}
	return (
		<span title={title} className={className}>
			{content}
		</span>
	);
}
