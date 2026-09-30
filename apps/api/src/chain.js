// Chain reads.
//
// The launchpad exposes everything the site needs, so there is no indexer and
// no database of tokens: the list, the curves and the prices all come from the
// contract. That keeps the frontend honest (it cannot show a token the chain
// does not have) and means the API can be redeployed or thrown away without
// losing state.
//
// A short cache in front of it, because the homepage would otherwise make one
// RPC call per token per visitor.

import { createPublicClient, http, defineChain, parseAbiItem } from 'viem';

export const ROBINHOOD_CHAIN_ID = 4663;

const RPC_URLS = (process.env.CLINK_RPC_URLS || 'https://rpc.mainnet.chain.robinhood.com,https://robinhood-rpc.publicnode.com')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean);

export const chain = defineChain({
	id: ROBINHOOD_CHAIN_ID,
	name: 'Robinhood Chain',
	nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
	rpcUrls: { default: { http: RPC_URLS } },
	blockExplorers: { default: { name: 'Blockscout', url: 'https://robinhoodchain.blockscout.com' } },
});

export const publicClient = createPublicClient({ chain, transport: http(RPC_URLS[0]) });

export const LAUNCHPAD = process.env.CLINK_LAUNCHPAD || '';

export const launchpadAbi = [
	{ name: 'tokenCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
	{ name: 'tokenAt', type: 'function', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ type: 'address' }] },
	{ name: 'marketsOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'address[]' }] },
	{ name: 'creatorOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'address' }] },
	{ name: 'feeRecipientOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'address' }] },
	{ name: 'priceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }] },
	{ name: 'launchFeeWei', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
	{ name: 'swapFeeBps', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint16' }] },
	{ name: 'claimable', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }] },
	{
		name: 'quoteConfig',
		type: 'function',
		stateMutability: 'view',
		inputs: [{ type: 'address' }],
		outputs: [{ name: 'virtualQuote', type: 'uint128' }, { name: 'enabled', type: 'bool' }],
	},
	{
		name: 'quoteBuy',
		type: 'function',
		stateMutability: 'view',
		inputs: [{ type: 'address' }, { type: 'address' }, { type: 'uint256' }],
		outputs: [{ name: 'tokensOut', type: 'uint256' }, { name: 'fee', type: 'uint256' }],
	},
	{
		name: 'quoteSell',
		type: 'function',
		stateMutability: 'view',
		inputs: [{ type: 'address' }, { type: 'address' }, { type: 'uint256' }],
		outputs: [{ name: 'quoteOut', type: 'uint256' }, { name: 'fee', type: 'uint256' }],
	},
	{
		name: 'curveOf',
		type: 'function',
		stateMutability: 'view',
		inputs: [{ type: 'address' }, { type: 'address' }],
		outputs: [{
			type: 'tuple',
			components: [
				{ name: 'virtualQuote', type: 'uint256' },
				{ name: 'virtualToken', type: 'uint256' },
				{ name: 'realQuote', type: 'uint256' },
				{ name: 'tokensLeft', type: 'uint256' },
				{ name: 'weightBps', type: 'uint16' },
				{ name: 'exists', type: 'bool' },
			],
		}],
	},
];

export const launchedEvent = parseAbiItem(
	'event Launched(address indexed token, address indexed creator, string name, string symbol, string metadataURI, (address quoteToken, uint16 weightBps)[] allocations)',
);

/** Creator's cut of swap fees, a constant in the contract. */
export const CREATOR_FEE_SHARE_BPS = 7_000;

export const EXPLORER = 'https://robinhoodchain.blockscout.com';

export const erc20Abi = [
	{ name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
	{ name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
	{ name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
	{ name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
	{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
	{ name: 'metadataURI', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
];

const cache = new Map();
const TTL_MS = 10_000;

/** Collapse concurrent callers onto one upstream read, and reuse it briefly. */
export async function cached(key, ttl, fn) {
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < ttl) return hit.value;
	if (hit?.inflight) return hit.inflight;

	const inflight = fn()
		.then((value) => {
			cache.set(key, { at: Date.now(), value });
			return value;
		})
		.catch((err) => {
			cache.delete(key);
			throw err;
		});

	cache.set(key, { ...(hit ?? {}), inflight });
	return inflight;
}

export { TTL_MS };
