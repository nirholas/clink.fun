// Launch provenance.
//
// A coin planned by an assistant over MCP carries an `origin` block in its
// descriptor: which channel it came from, which draft, and a signature from the
// platform's attester key over the fields that matter. The keccak of the
// descriptor's exact bytes is committed on chain at launch, so the origin is
// bound to the coin forever and anyone can check it without trusting this
// server's database: recover the signer of `originMessage(...)` and compare it
// with the attester published at /api/config.
//
// The launchpad contract is immutable, so this lives in the descriptor rather
// than in an event. The descriptor is the one place a launch already commits
// arbitrary, hash-pinned data.

import { recoverMessageAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const ORIGIN_CHANNELS = ['prompt', 'site'];

/** Read on every call so a key rotated through the environment is picked up by tests and restarts alike. */
function attesterAccount() {
	const key = process.env.CLINK_ATTESTER_KEY?.trim();
	return key && /^0x[0-9a-fA-F]{64}$/.test(key) ? privateKeyToAccount(key) : null;
}

export function attesterAddress() {
	return attesterAccount()?.address ?? null;
}

/** The exact text the attester signs. Stable by contract: changing it is a v2. */
export function originMessage({ channel, draft, name, symbol }) {
	return ['clink.fun launch origin v1', `channel: ${channel}`, `draft: ${draft}`, `name: ${name}`, `symbol: ${symbol}`].join('\n');
}

/**
 * The origin block for a descriptor. Without an attester key the block is still
 * written (the server built the descriptor, so the claim is true), it just
 * carries no signature for third parties to check.
 */
export async function buildOrigin({ channel, draft, client, name, symbol }) {
	const origin = { channel, draft, client: client || undefined };
	const account = attesterAccount();
	if (!account) return origin;
	const signature = await account.signMessage({ message: originMessage({ channel, draft, name, symbol }) });
	return { ...origin, attester: account.address, signature };
}

/** True when the descriptor's origin was signed by the attester this server runs with. */
export async function verifyOrigin(descriptor) {
	const origin = descriptor?.origin;
	const expected = attesterAddress();
	if (!origin?.signature || !expected) return false;
	try {
		const signer = await recoverMessageAddress({
			message: originMessage({ channel: origin.channel, draft: origin.draft, name: descriptor.name, symbol: descriptor.symbol }),
			signature: origin.signature,
		});
		return signer.toLowerCase() === expected.toLowerCase();
	} catch {
		return false;
	}
}
