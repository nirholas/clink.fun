// Launch a few real coins so a fresh deployment has something to show.
//
// Uses the same path a person does: upload artwork, store the descriptor, hash
// the exact bytes the server returned, then one transaction. Nothing here is a
// fixture; these are real launches on the real contract.

import { readFileSync } from 'node:fs';
import { createPublicClient, createWalletClient, defineChain, http, keccak256, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const API = process.env.CLINK_API ?? 'https://clink-fun-93741856042.us-central1.run.app';
const LAUNCHPAD = process.env.CLINK_LAUNCHPAD ?? '0x6a546350f79DE0Fc83ADfCe99233183aA090fa15';
const KEY = process.env.PRIVATE_KEY;
if (!KEY) throw new Error('set PRIVATE_KEY');

const chain = defineChain({
	id: 4663,
	name: 'Robinhood Chain',
	nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
	rpcUrls: { default: { http: ['https://rpc.mainnet.chain.robinhood.com'] } },
});

const abi = [
	{
		name: 'launch', type: 'function', stateMutability: 'payable',
		inputs: [{
			name: 'p', type: 'tuple', components: [
				{ name: 'name', type: 'string' }, { name: 'symbol', type: 'string' },
				{ name: 'metadataURI', type: 'string' }, { name: 'metadataHash', type: 'bytes32' },
				{ name: 'allocations', type: 'tuple[]', components: [{ name: 'quoteToken', type: 'address' }, { name: 'weightBps', type: 'uint16' }] },
				{ name: 'creatorFeeRecipient', type: 'address' }, { name: 'devBuyMarket', type: 'uint8' },
				{ name: 'devBuyQuoteIn', type: 'uint256' }, { name: 'devBuyMinTokensOut', type: 'uint256' },
				{ name: 'deadline', type: 'uint256' },
			],
		}],
		outputs: [{ name: 'token', type: 'address' }],
	},
	{ name: 'launchFeeWei', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
];

const account = privateKeyToAccount(KEY);
const publicClient = createPublicClient({ chain, transport: http() });
const walletClient = createWalletClient({ account, chain, transport: http() });

const stocks = await (await fetch(`${API}/api/stocks`)).json();
const bySymbol = new Map(stocks.map((s) => [s.symbol, s]));
const fee = await publicClient.readContract({ address: LAUNCHPAD, abi, functionName: 'launchFeeWei' });

/** Split 10000 bps evenly, remainder to the front. The contract demands exact. */
const evenWeights = (n) => {
	const base = Math.floor(10_000 / n);
	const out = Array.from({ length: n }, () => base);
	let rem = 10_000 - base * n;
	for (let i = 0; rem > 0; i = (i + 1) % n, rem--) out[i] += 1;
	return out;
};

const COINS = [
	{
		name: 'Chips Party Pack', symbol: 'CHIPS', image: '/tmp/clinkart/chips.png',
		description: 'Every semiconductor in one bag. Paired across the whole silicon aisle.',
		markets: ['NVDA', 'AMD', 'INTC', 'MU'],
	},
	{
		name: 'FAANG', symbol: 'FAANG', image: '/tmp/clinkart/faang.png',
		description: 'The old acronym, five pools deep. One coin quoted against all of big tech.',
		markets: ['META', 'AAPL', 'AMZN', 'NVDA', 'GOOGL'],
	},
	{
		name: 'Moon Orb', symbol: 'ORB', image: '/tmp/clinkart/orb.png',
		description: 'Rockets and datacenters. Paired against the two things that go up.',
		markets: ['SPCX', 'CRWV'],
	},
];

for (const coin of COINS) {
	const bytes = readFileSync(coin.image);
	const stored = await (await fetch(`${API}/api/images`, {
		method: 'POST', headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ data: bytes.toString('base64'), contentType: 'image/png' }),
	})).json();

	const metaRes = await (await fetch(`${API}/api/metadata`, {
		method: 'POST', headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			name: coin.name, symbol: coin.symbol, description: coin.description,
			image: stored.url, website: 'https://github.com/nirholas/clink.fun',
		}),
	})).json();

	const weights = evenWeights(coin.markets.length);
	const allocations = coin.markets.map((symbol, i) => {
		const stock = bySymbol.get(symbol);
		if (!stock) throw new Error(`unknown market ${symbol}`);
		return { quoteToken: stock.address, weightBps: weights[i] };
	});

	const params = {
		name: coin.name,
		symbol: coin.symbol,
		metadataURI: metaRes.url,
		// Hash the bytes the server stored, never a second serialization here.
		metadataHash: keccak256(toBytes(metaRes.bytes)),
		allocations,
		creatorFeeRecipient: account.address,
		devBuyMarket: 255,
		devBuyQuoteIn: 0n,
		devBuyMinTokensOut: 0n,
		deadline: BigInt(Math.floor(Date.now() / 1000) + 900),
	};

	const { request, result } = await publicClient.simulateContract({
		address: LAUNCHPAD, abi, functionName: 'launch', args: [params], value: fee, account,
	});
	const hash = await walletClient.writeContract(request);
	const receipt = await publicClient.waitForTransactionReceipt({ hash });
	console.log(
		`${receipt.status === 'success' ? 'launched' : 'FAILED  '} ${coin.symbol.padEnd(6)} ` +
		`${coin.markets.join('/').padEnd(28)} ${result}`,
	);
}
