// The API client.
//
// Everything the site needs about a token comes from the chain via the API, so
// there is exactly one shape here and every page reads it.

export interface Pair {
	quoteToken: `0x${string}`;
	quoteSymbol: string;
	weightBps: number;
	virtualQuote: string;
	virtualToken: string;
	priceQuote: string;
	raisedQuote: string;
	tokensLeft: string;
	soldPct: number;
}

export interface TokenSummary {
	address: `0x${string}`;
	name: string;
	symbol: string;
	totalSupply: string;
	metadataURI: string;
	creator: `0x${string}`;
	/** Set when the coin was planned by an assistant over MCP. */
	origin?: LaunchOrigin | null;
	pairs: Pair[];
	/** Filled in by the client after resolving metadataURI. */
	image?: string | null;
	description?: string | null;
	links?: { website?: string; twitter?: string; telegram?: string; discord?: string };
}

export interface LaunchOrigin {
	channel: 'prompt' | 'site';
	/** Which assistant planned it, e.g. "claude". */
	client: string | null;
	draft: string | null;
	/** The origin signature recovers to the platform attester. */
	verified: boolean;
}

/** A launch an assistant planned over MCP, waiting for a person to sign it here. */
export interface LaunchDraft {
	id: string;
	channel: 'prompt' | 'site';
	client: string | null;
	status: 'awaiting signature' | 'launched' | 'expired';
	createdAt: string;
	expiresAt: string;
	name: string;
	symbol: string;
	description: string | null;
	image: string | null;
	links: { website?: string; twitter?: string; telegram?: string };
	markets: { symbol: string; address: `0x${string}`; weightBps: number }[];
	devBuy: string | null;
	feeWallet: `0x${string}` | null;
	launchUrl: string;
	token: `0x${string}` | null;
	txHash: `0x${string}` | null;
}

export interface StockToken {
	symbol: string;
	address: `0x${string}`;
	decimals: number;
	logoUrl?: string;
}

export interface ClinkConfig {
	chainId: number;
	launchpad: `0x${string}` | null;
	launchFeeWei: string;
	launchFeeEth: string;
	swapFeeBps: number;
	publicUrl: string;
	mcpUrl: string;
	attester: `0x${string}` | null;
}

async function get<T>(path: string): Promise<T> {
	const res = await fetch(path, { headers: { accept: 'application/json' } });
	if (!res.ok) throw new Error(`${path} returned ${res.status}`);
	return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(path, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		throw new Error(detail || `${path} returned ${res.status}`);
	}
	return res.json() as Promise<T>;
}

export const api = {
	trades: (address: string, market?: string, limit = 200) =>
		get<{ items: import('./charts').Trade[]; total: number }>(
			`/api/tokens/${address}/trades?limit=${limit}${market ? `&market=${market}` : ''}`,
		),
	candles: (address: string, interval: string, market?: string) =>
		get<{ interval: string; candles: import('./charts').Candle[] }>(
			`/api/tokens/${address}/candles?interval=${interval}${market ? `&market=${market}` : ''}`,
		),

	config: () => get<ClinkConfig>('/api/config'),
	stocks: () => get<StockToken[]>('/api/stocks'),
	tokens: (limit = 50, offset = 0) =>
		get<{ items: TokenSummary[]; total: number }>(`/api/tokens?limit=${limit}&offset=${offset}`),
	token: (address: string) => get<TokenSummary>(`/api/tokens/${address}`),
	draft: (id: string) => get<LaunchDraft>(`/api/drafts/${encodeURIComponent(id)}`),

	uploadImage: (dataBase64: string, contentType: string) =>
		post<{ hash: string; url: string }>('/api/images', { data: dataBase64, contentType }),

	/**
	 * Store the descriptor and get back the exact bytes it stored. The caller
	 * hashes those bytes for the on-chain commitment rather than re-serializing
	 * its own object, so the commitment can never point at a different document.
	 */
	uploadMetadata: (descriptor: Record<string, unknown>) =>
		post<{ hash: string; url: string; bytes: string }>('/api/metadata', descriptor),
};

/** Resolve a token's off-chain descriptor. Failure is not fatal: a coin with a
 * broken descriptor still trades, it just renders without a picture. */
export async function resolveMetadata(token: TokenSummary): Promise<TokenSummary> {
	if (!token.metadataURI) return token;
	try {
		const res = await fetch(token.metadataURI);
		if (!res.ok) return token;
		const meta = (await res.json()) as {
			image?: string;
			description?: string;
			links?: TokenSummary['links'];
		};
		return { ...token, image: meta.image ?? null, description: meta.description ?? null, links: meta.links };
	} catch {
		return token;
	}
}
