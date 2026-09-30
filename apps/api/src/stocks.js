// The registry of tokenized stocks a coin can pair against. Static, shipped
// with the image, and the same list the launch form offers.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const STOCKS = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'stocks.json'), 'utf8'));

const bySymbol = new Map(STOCKS.map((s) => [s.symbol.toUpperCase(), s]));
const byAddress = new Map(STOCKS.map((s) => [s.address.toLowerCase(), s]));

/** Accepts `NVDA`, `nvda`, `$NVDA` or the tokenized form `NVDAx`. */
export function findStock(symbol) {
	const key = String(symbol).trim().replace(/^\$/, '').toUpperCase();
	return bySymbol.get(key) ?? (key.endsWith('X') ? bySymbol.get(key.slice(0, -1)) : undefined) ?? null;
}

export const stockAt = (address) => byAddress.get(String(address).toLowerCase()) ?? null;
