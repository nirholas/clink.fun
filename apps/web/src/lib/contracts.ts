// The launchpad ABI, trimmed to what the app calls.

export const LAUNCHPAD_ADDRESS = (import.meta.env.VITE_LAUNCHPAD ?? '') as `0x${string}`;

export const NO_DEV_BUY = 255;
export const BPS = 10_000;
export const MAX_MARKETS = 5;
export const TOTAL_SUPPLY = 1_000_000_000n * 10n ** 18n;

export const launchpadAbi = [
	{
		name: 'launch',
		type: 'function',
		stateMutability: 'payable',
		inputs: [{
			name: 'p',
			type: 'tuple',
			components: [
				{ name: 'name', type: 'string' },
				{ name: 'symbol', type: 'string' },
				{ name: 'metadataURI', type: 'string' },
				{ name: 'metadataHash', type: 'bytes32' },
				{
					name: 'allocations',
					type: 'tuple[]',
					components: [
						{ name: 'quoteToken', type: 'address' },
						{ name: 'weightBps', type: 'uint16' },
					],
				},
				{ name: 'creatorFeeRecipient', type: 'address' },
				{ name: 'devBuyMarket', type: 'uint8' },
				{ name: 'devBuyQuoteIn', type: 'uint256' },
				{ name: 'devBuyMinTokensOut', type: 'uint256' },
				{ name: 'deadline', type: 'uint256' },
			],
		}],
		outputs: [{ name: 'token', type: 'address' }],
	},
	{
		name: 'buy',
		type: 'function',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'token', type: 'address' },
			{ name: 'quoteToken', type: 'address' },
			{ name: 'quoteIn', type: 'uint256' },
			{ name: 'minTokensOut', type: 'uint256' },
		],
		outputs: [{ name: 'tokensOut', type: 'uint256' }],
	},
	{
		name: 'sell',
		type: 'function',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'token', type: 'address' },
			{ name: 'quoteToken', type: 'address' },
			{ name: 'tokensIn', type: 'uint256' },
			{ name: 'minQuoteOut', type: 'uint256' },
		],
		outputs: [{ name: 'quoteOut', type: 'uint256' }],
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
	{ name: 'claimFees', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'assets', type: 'address[]' }], outputs: [{ type: 'uint256' }] },
	{ name: 'claimable', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }] },
	{ name: 'setFeeRecipient', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [] },
	{ name: 'launchFeeWei', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
	{ name: 'swapFeeBps', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint16' }] },
	{ name: 'priceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }] },
	{ name: 'marketsOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'address[]' }] },
	{ name: 'feeRecipientOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'address' }] },
] as const;

export const erc20Abi = [
	{ name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
	{ name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
	{ name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
	{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
	{ name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }] },
	{ name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const;
