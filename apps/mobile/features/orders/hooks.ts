import { ACTIVE_ORDER_STATUSES } from '@food/config';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import * as orders from '@/services/order.service';
import { useIsAuthenticated } from '@/store/auth.store';

export function useOrders() {
  const authed = useIsAuthenticated();
  return useInfiniteQuery({
    queryKey: queryKeys.orders,
    queryFn: ({ pageParam }) => orders.fetchOrders(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled: authed,
    staleTime: 15_000,
  });
}

/** Polls while the order is in progress so status changes from the café appear live. */
export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => orders.fetchOrder(id),
    enabled: Boolean(id),
    staleTime: 5_000,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && ACTIVE_ORDER_STATUSES.includes(status) ? 15_000 : false;
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orders.cancelOrder,
    onSuccess: (order) => {
      qc.setQueryData(queryKeys.order(order.id), order);
      void qc.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}
