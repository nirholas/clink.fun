// Robinhood Chain.
//
// An Arbitrum Orbit L2 settling to Ethereum, and the home of the tokenized
// equities this launchpad pairs against. Defined here rather than pulled from
// viem/chains so the RPC stays swappable: a public endpoint is a single point
// of failure for anything that has to land a transaction.

import { defineChain } from 'viem';

export const ROBINHOOD_CHAIN_ID = 4663 as const;

export const RPC_URLS = [
	'https://rpc.mainnet.chain.robinhood.com',
	'https://robinhood-rpc.publicnode.com',
	'https://rpc.arrowrpc.com',
] as const;

export const EXPLORERS = {
	blockscout: 'https://robinhoodchain.blockscout.com',
	robinscan: 'https://robinscan.io',
} as const;

export function robinhoodChain(rpcUrl?: string) {
	return defineChain({
		id: ROBINHOOD_CHAIN_ID,
		name: 'Robinhood Chain',
		nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
		rpcUrls: { default: { http: [rpcUrl ?? RPC_URLS[0]] } },
		blockExplorers: { default: { name: 'Blockscout', url: EXPLORERS.blockscout } },
	});
}

export const txUrl = (hash: string) => `${EXPLORERS.blockscout}/tx/${hash}`;
export const addressUrl = (address: string) => `${EXPLORERS.blockscout}/address/${address}`;

/**
 * Bridges that support chain 4663 inbound. Relevant because the single hardest
 * step for a new user is getting gas onto an Orbit chain nobody has heard of,
 * and the L1 canonical bridge costs more than most people want to launch with.
 */
export const BRIDGES = [
	{ name: 'Relay', url: 'https://relay.link', note: 'cheapest from any L2, seconds' },
	{ name: 'Gas.zip', url: 'https://gas.zip', note: 'refuel amounts, from $0.015' },
	{ name: 'Arbitrum Portal', url: 'https://portal.arbitrum.io/bridge?destinationChain=robinhood-chain&sourceChain=ethereum', note: 'canonical, from L1, slow and expensive' },
] as const;
