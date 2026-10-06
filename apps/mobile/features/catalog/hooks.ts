import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import * as catalog from '@/services/catalog.service';

export const useHomeFeed = () =>
  useQuery({ queryKey: queryKeys.home, queryFn: ({ signal }) => catalog.fetchHome(signal) });

export const useCategories = () =>
  useQuery({ queryKey: queryKeys.categories, queryFn: catalog.fetchCategories, staleTime: 5 * 60_000 });

export const useProduct = (id: string) =>
  useQuery({ queryKey: queryKeys.product(id), queryFn: () => catalog.fetchProduct(id), enabled: Boolean(id) });

const PAGE_SIZE = 12;

export function useProductList(params: { category?: string; search?: string }) {
  return useInfiniteQuery({
    queryKey: queryKeys.products(params),
    queryFn: ({ pageParam, signal }) => catalog.fetchProducts({ ...params, page: pageParam, limit: PAGE_SIZE }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    placeholderData: keepPreviousData,
    enabled: params.search === undefined || params.search.length >= 2,
  });
}
