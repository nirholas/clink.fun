import { Link } from 'react-router-dom';

export default function NotFound() {
	return (
		<div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-32 text-center">
			<span className="font-mono text-5xl text-white/15">404</span>
			<h1 className="text-lg font-medium">Nothing here</h1>
			<p className="text-sm text-muted">
				That page does not exist. The coins are all on the explore page.
			</p>
			<Link to="/explore" className="btn-primary mt-2">
				Explore coins
			</Link>
		</div>
	);
}
