import { Link } from 'react-router-dom';

/** Skeletons rather than spinners: the page keeps its shape while it loads, so
 * nothing jumps when the data lands. */
export function CardSkeleton() {
	return (
		<div className="overflow-hidden rounded-xl border border-white/10 bg-ink-900/60">
			<div className="aspect-square w-full animate-pulse bg-white/5" />
			<div className="space-y-3 p-3.5">
				<div className="h-5 w-24 animate-pulse rounded bg-white/5" />
				<div className="h-4 w-full animate-pulse rounded bg-white/5" />
				<div className="h-1 w-full animate-pulse rounded bg-white/5" />
			</div>
		</div>
	);
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{Array.from({ length: count }, (_, i) => (
				<CardSkeleton key={i} />
			))}
		</div>
	);
}

/** An empty state tells the reader what to do next. A blank panel does not. */
export function Empty({
	title,
	body,
	actionLabel,
	actionTo,
}: {
	title: string;
	body: string;
	actionLabel?: string;
	actionTo?: string;
}) {
	return (
		<div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
			<h3 className="text-base font-medium text-white/90">{title}</h3>
			<p className="max-w-sm text-sm leading-relaxed text-muted">{body}</p>
			{actionLabel && actionTo && (
				<Link to={actionTo} className="btn-primary mt-2">
					{actionLabel}
				</Link>
			)}
		</div>
	);
}

/** An error state says what broke and offers the way out. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
	const message = error instanceof Error ? error.message : String(error);
	return (
		<div className="panel flex flex-col items-center gap-3 border-down/25 px-6 py-14 text-center">
			<h3 className="text-base font-medium text-down">Could not load that</h3>
			<p className="max-w-md break-words font-mono text-xs text-muted">{message}</p>
			{onRetry && (
				<button type="button" onClick={onRetry} className="btn-ghost mt-2">
					Try again
				</button>
			)}
		</div>
	);
}

export function NotConfigured() {
	return (
		<div className="panel px-6 py-14 text-center">
			<h3 className="text-base font-medium">No launchpad configured</h3>
			<p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
				Deploy the contract and set <code className="font-mono text-accent-soft">CLINK_LAUNCHPAD</code> on the
				API and <code className="font-mono text-accent-soft">VITE_LAUNCHPAD</code> on the web app.
				See the deploy guide in the docs.
			</p>
		</div>
	);
}
