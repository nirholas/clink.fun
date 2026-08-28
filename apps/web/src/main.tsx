import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { wagmiConfig } from './lib/wagmi';
import './index.css';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Chain data goes stale fast and a launchpad front page that shows
			// a five-minute-old price is worse than one that shows a spinner.
			staleTime: 5_000,
			refetchOnWindowFocus: true,
			retry: 1,
		},
	},
});

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<WagmiProvider config={wagmiConfig}>
			<QueryClientProvider client={queryClient}>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</QueryClientProvider>
		</WagmiProvider>
	</React.StrictMode>,
);
