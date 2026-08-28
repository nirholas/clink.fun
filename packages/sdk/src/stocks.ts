// The tokenized equities a coin can be paired against.
//
// These are real ERC-20s on Robinhood Chain, issued independently of any
// launchpad, which is precisely why a second launchpad can exist: the assets
// are public infrastructure and pairing against them needs nobody's
// permission.
//
// The list is baked in as a floor rather than fetched, because a launch form
// that renders empty when an API is down is a launch form that loses the user.
// `fetchStockTokens` refreshes it at runtime and falls back to this.

export interface StockToken {
	symbol: string;
	address: `0x${string}`;
	decimals: number;
}

export const STOCK_TOKENS: readonly StockToken[] = Object.freeze([
	{ symbol: "AAPL", address: "0xaf3d76f1834a1d425780943c99ea8a608f8a93f9" as `0x${string}`, decimals: 18 },
	{ symbol: "AMD", address: "0x86923f96303d656e4aa86d9d42d1e57ad2023fdc" as `0x${string}`, decimals: 18 },
	{ symbol: "AMZN", address: "0x12f190a9f9d7d37a250758b26824b97ce941bf54" as `0x${string}`, decimals: 18 },
	{ symbol: "BABA", address: "0xad25ac6c84d497db898fa1e8387bf6af3532a1c4" as `0x${string}`, decimals: 18 },
	{ symbol: "BE", address: "0x822cc93ffd030293e9842c30bbd678f530701867" as `0x${string}`, decimals: 18 },
	{ symbol: "COIN", address: "0x6330d8c3178a418788df01a47479c0ce7ccf450b" as `0x${string}`, decimals: 18 },
	{ symbol: "CRCL", address: "0xdf0992e440dd0be65bd8439b609d6d4366bf1cb5" as `0x${string}`, decimals: 18 },
	{ symbol: "CRWV", address: "0x5f10a1c971b69e47e059e1dc91901b59b3fb49c3" as `0x${string}`, decimals: 18 },
	{ symbol: "GOOGL", address: "0x2e0847e8910a9732eb3fb1bb4b70a580adad4fe3" as `0x${string}`, decimals: 18 },
	{ symbol: "INTC", address: "0xc72b96e0e48ecd4dc75e1e45396e26300bc39681" as `0x${string}`, decimals: 18 },
	{ symbol: "META", address: "0xc0d6457c16cc70d6790dd43521c899c87ce02f35" as `0x${string}`, decimals: 18 },
	{ symbol: "MSFT", address: "0xe93237c50d904957cf27e7b1133b510c669c2e74" as `0x${string}`, decimals: 18 },
	{ symbol: "MU", address: "0xff080c8ce2e5feadaca0da81314ae59d232d4afd" as `0x${string}`, decimals: 18 },
	{ symbol: "NVDA", address: "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec" as `0x${string}`, decimals: 18 },
	{ symbol: "ORCL", address: "0xb0992820e760d836549ba69bc7598b4af75dee03" as `0x${string}`, decimals: 18 },
	{ symbol: "PLTR", address: "0x894e1ec2d74ffe5aef8dc8a9e84686accb964f2a" as `0x${string}`, decimals: 18 },
	{ symbol: "QQQ", address: "0xd5f3879160bc7c32ebb4dc785f8a4f505888de68" as `0x${string}`, decimals: 18 },
	{ symbol: "SGOV", address: "0x92fd66527192e3e61d4ddd13322aa222de86f9b5" as `0x${string}`, decimals: 18 },
	{ symbol: "SLV", address: "0x411efb0e7f985935daec3d4c3ebaea0d0ad7d89f" as `0x${string}`, decimals: 18 },
	{ symbol: "SNDK", address: "0xb90a19ff0af67f7779aff50a882a9cff42446400" as `0x${string}`, decimals: 18 },
	{ symbol: "SPCX", address: "0x4a0e65a3eccec6dbe60ae065f2e7bb85fae35eea" as `0x${string}`, decimals: 18 },
	{ symbol: "SPY", address: "0x117cc2133c37b721f49de2a7a74833232b3b4c0c" as `0x${string}`, decimals: 18 },
	{ symbol: "TSLA", address: "0x322f0929c4625ed5bad873c95208d54e1c003b2d" as `0x${string}`, decimals: 18 },
	{ symbol: "USAR", address: "0xd917b029c761d264c6a312bbbcda868658ef86a6" as `0x${string}`, decimals: 18 },
]);

export const STOCK_BY_SYMBOL: ReadonlyMap<string, StockToken> = new Map(
	STOCK_TOKENS.map((t) => [t.symbol, t]),
);

export const STOCK_BY_ADDRESS: ReadonlyMap<string, StockToken> = new Map(
	STOCK_TOKENS.map((t) => [t.address.toLowerCase(), t]),
);

/**
 * Sector groupings. Used by the launch form to offer one-click baskets, and by
 * the relay/agent integrations to pick a themed pairing without hardcoding
 * tickers at the call site.
 */
export const SECTORS: Readonly<Record<string, readonly string[]>> = Object.freeze({
	'AI and semis': ['NVDA', 'AMD', 'INTC', 'MU', 'SNDK', 'CRWV'],
	'Big tech': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'ORCL'],
	Crypto: ['COIN', 'CRCL'],
	Space: ['SPCX'],
	Energy: ['BE'],
	Index: ['SPY', 'QQQ'],
	'Safe haven': ['SGOV', 'SLV'],
	Other: ['TSLA', 'PLTR', 'BABA', 'USAR'],
});

export function resolveStock(symbolOrAddress: string): StockToken | undefined {
	const key = symbolOrAddress.trim();
	return STOCK_BY_SYMBOL.get(key.toUpperCase()) ?? STOCK_BY_ADDRESS.get(key.toLowerCase());
}
