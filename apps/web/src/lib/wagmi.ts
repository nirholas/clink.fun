import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { robinhoodChain } from './chain';

// Injected only, deliberately. WalletConnect needs a project id and a relay
// round trip, and every wallet that matters on an EVM L2 injects. Adding more
// connectors is a one-line change when there is a reason to.
export const wagmiConfig = createConfig({
	chains: [robinhoodChain],
	connectors: [injected()],
	transports: { [robinhoodChain.id]: http() },
});

declare module 'wagmi' {
	interface Register {
		config: typeof wagmiConfig;
	}
}
