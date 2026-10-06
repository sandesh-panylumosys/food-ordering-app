import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { quoteCart } from '@/services/catalog.service';
import { toCartInput, useCartStore } from '@/store/cart.store';

/** Authoritative server pricing for the current cart (also flags unavailable items). */
export function useCartQuote() {
  const lines = useCartStore((s) => s.lines);
  const items = toCartInput(lines);
  const signature = JSON.stringify(items);

  return useQuery({
    queryKey: queryKeys.quote(signature),
    queryFn: () => quoteCart(items),
    enabled: items.length > 0,
    staleTime: 30_000,
  });
}
