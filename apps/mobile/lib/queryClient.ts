import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: (count, error) => {
        // Don't retry client errors — they won't fix themselves.
        if (error instanceof ApiError && error.status < 500) return false;
        return count < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});

export const queryKeys = {
  home: ['home'] as const,
  categories: ['categories'] as const,
  products: (params: Record<string, unknown>) => ['products', params] as const,
  product: (id: string) => ['product', id] as const,
  quote: (signature: string) => ['quote', signature] as const,
  addresses: ['addresses'] as const,
  orders: ['orders'] as const,
  order: (id: string) => ['order', id] as const,
  me: ['me'] as const,
};
