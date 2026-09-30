// Formatting.
//
// One rule throughout: never round away the difference between "zero" and
// "unknown". A dash means the value could not be read; 0 means it was read and
// it was zero. Conflating them is how a UI tells a confident lie.

export function usd(value: number | null | undefined): string {
	if (value == null || !Number.isFinite(value)) return '-';
	if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
	if (Math.abs(value) >= 1_000) return `$${Math.round(value).toLocaleString('en-US')}`;
	if (Math.abs(value) >= 1) return `$${value.toFixed(2)}`;
	if (value === 0) return '$0';
	return `$${value.toPrecision(2)}`;
}

/** Trim trailing zeros without turning 1.10 into 1.1000000000000001. */
export function trim(value: string, maxDecimals = 6): string {
	if (!value.includes('.')) return value;
	const [whole, frac = ''] = value.split('.');
	const cut = frac.slice(0, maxDecimals).replace(/0+$/, '');
	return cut ? `${whole}.${cut}` : (whole ?? '0');
}

export function pct(value: number | null | undefined, digits = 2): string {
	if (value == null || !Number.isFinite(value)) return '-';
	return `${value.toFixed(digits)}%`;
}

export const shortAddress = (address?: string): string =>
	address && address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address ?? '';

export function timeAgo(timestampMs: number): string {
	const seconds = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
	if (seconds < 60) return `${seconds}s`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
	if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
	return `${Math.floor(seconds / 86_400)}d`;
}

/**
 * Sanitize a ticker to what the contract and every chart legend can render.
 * A symbol is immutable once deployed, so this runs before the transaction is
 * built rather than as a display-time nicety.
 */
export function sanitizeSymbol(raw: string, max = 10): string {
	return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, max);
}

export function sanitizeName(raw: string, max = 32): string {
	return raw.replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Display name for the assistant that planned a launch, from the MCP client hint. */
export function assistantName(client: string | null | undefined): string {
	if (client === 'claude') return 'Claude';
	if (client === 'chatgpt') return 'ChatGPT';
	if (client === 'cursor') return 'Cursor';
	return 'your assistant';
}
