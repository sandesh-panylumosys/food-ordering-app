import type { Order, OrderStatus } from '@food/shared-types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface OrderListParams {
  page: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
}

export const orderKeys = {
  all: ['orders'] as const,
  list: (p: OrderListParams) => ['orders', 'list', p] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
};

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: ({ signal }) =>
      api.page<Order>('/admin/orders', { limit: 20, ...params }, signal),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: ({ signal }) => api.get<Order>(`/admin/orders/${id}`, undefined, signal),
    refetchInterval: 15_000,
  });
}

export function useUpdateOrderStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { status: OrderStatus; note?: string | null }) =>
      api.patch<Order>(`/admin/orders/${id}/status`, body),
    onSuccess: (order) => {
      qc.setQueryData(orderKeys.detail(id), order);
      void qc.invalidateQueries({ queryKey: ['orders', 'list'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
