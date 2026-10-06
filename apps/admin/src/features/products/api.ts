import type { Product } from '@food/shared-types';
import type { ProductUpdateInput } from '@food/validation';
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { api, type Page } from '../../lib/api';

export interface ProductListParams {
  page: number;
  limit?: number;
  search?: string;
  category?: string;
}

export const productKeys = {
  all: ['products'] as const,
  lists: ['products', 'list'] as const,
  list: (p: ProductListParams) => ['products', 'list', p] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
};

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) => api.page<Product>('/admin/products', { limit: 20, ...params }, signal),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: ({ signal }) => api.get<Product>(`/admin/products/${id}`, undefined, signal),
    enabled: Boolean(id),
    staleTime: 0,
  });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: ProductUpdateInput }) =>
      id ? api.patch<Product>(`/admin/products/${id}`, body) : api.post<Product>('/admin/products', body),
    onSuccess: (product) => {
      qc.setQueryData(productKeys.detail(product.id), product);
      void qc.invalidateQueries({ queryKey: productKeys.lists });
      void qc.invalidateQueries({ queryKey: ['categories'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/** Inline edits from the table (availability etc.) with an optimistic update. */
export function usePatchProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ProductUpdateInput }) =>
      api.patch<Product>(`/admin/products/${id}`, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: productKeys.lists });
      const snapshots = qc.getQueriesData<Page<Product>>({ queryKey: productKeys.lists });
      qc.setQueriesData<Page<Product>>({ queryKey: productKeys.lists }, (page) =>
        page
          ? { ...page, items: page.items.map((p) => (p.id === id ? ({ ...p, ...patch } as Product) : p)) }
          : page,
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, value]: [QueryKey, Page<Product> | undefined]) => qc.setQueryData(key, value));
    },
    onSuccess: (product) => qc.setQueryData(productKeys.detail(product.id), product),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: productKeys.lists });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/admin/products/${id}`),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: productKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: productKeys.lists });
      void qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
