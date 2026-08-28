import { defineChain } from 'viem';

export const ROBINHOOD_CHAIN_ID = 4663 as const;

export const robinhoodChain = defineChain({
	id: ROBINHOOD_CHAIN_ID,
	name: 'Robinhood Chain',
	nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
	rpcUrls: { default: { http: ['https://rpc.mainnet.chain.robinhood.com'] } },
	blockExplorers: { default: { name: 'Blockscout', url: 'https://robinhoodchain.blockscout.com' } },
});

export const EXPLORER = 'https://robinhoodchain.blockscout.com';
export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const addressUrl = (address: string) => `${EXPLORER}/address/${address}`;

/**
 * Getting gas onto an Orbit chain nobody has heard of is the single hardest
 * step for a new user, so the app names the cheap routes instead of leaving
 * them to work it out.
 */
export const BRIDGES = [
	{ name: 'Relay', url: 'https://relay.link', note: 'cheapest from any L2, seconds' },
	{ name: 'Gas.zip', url: 'https://gas.zip', note: 'refuel amounts, from $0.015' },
] as const;
