import type { Category } from '@food/shared-types';
import type { CategoryUpdateInput } from '@food/validation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export const categoryKeys = { all: ['categories'] as const };

/** Request body: the schema's *input* shape (the API applies defaults/transforms). */
export type CategoryPayload = CategoryUpdateInput;

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => api.get<Category[]>('/admin/categories', undefined, signal),
    staleTime: 60_000,
  });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: CategoryPayload }) =>
      id ? api.patch<Category>(`/admin/categories/${id}`, body) : api.post<Category>('/admin/categories', body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: categoryKeys.all });
      void qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useToggleCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<Category>(`/admin/categories/${id}`, { isActive }),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: categoryKeys.all });
      const previous = qc.getQueryData<Category[]>(categoryKeys.all);
      qc.setQueryData<Category[]>(categoryKeys.all, (list) =>
        list?.map((c) => (c.id === id ? { ...c, isActive } : c)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(categoryKeys.all, ctx.previous);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/admin/categories/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
