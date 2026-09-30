import { useQuery } from '@tanstack/react-query';
import { api, resolveMetadata, type TokenSummary } from './api';

export function useConfig() {
	return useQuery({ queryKey: ['config'], queryFn: api.config, staleTime: 60_000 });
}

export function useStocks() {
	return useQuery({ queryKey: ['stocks'], queryFn: api.stocks, staleTime: 300_000 });
}

/**
 * Token lists resolve their descriptors after the list itself arrives, so the
 * grid renders immediately with placeholders and fills in artwork as it comes.
 * Blocking the whole page on a slow image host is the wrong trade.
 */
export function useTokens(limit = 50) {
	return useQuery({
		queryKey: ['tokens', limit],
		queryFn: async (): Promise<TokenSummary[]> => {
			const page = await api.tokens(limit);
			return Promise.all(page.items.map(resolveMetadata));
		},
		staleTime: 10_000,
	});
}

/** A planned launch. Polled while it waits, so the page notices the moment it lands. */
export function useDraft(id?: string | null) {
	return useQuery({
		queryKey: ['draft', id],
		queryFn: () => api.draft(id!),
		enabled: Boolean(id),
		// A missing plan will not appear by asking again; anything else gets one retry.
		retry: (failures, error) => failures < 1 && !/ 404$/.test(error.message),
		refetchInterval: (query) => (query.state.data?.status === 'awaiting signature' ? 15_000 : false),
	});
}

export function useToken(address?: string) {
	return useQuery({
		queryKey: ['token', address],
		queryFn: async () => resolveMetadata(await api.token(address!)),
		enabled: Boolean(address),
		staleTime: 5_000,
		refetchInterval: 15_000,
	});
}
