import { PRICING, resolveSelections } from '@food/config';
import type { CartItemInput, CartSelection, Product } from '@food/shared-types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

export interface CartLine {
  /** productId + normalized selections, so the same dish with different options is a separate line. */
  key: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  isVeg: boolean;
  /** Preview unit price (base + options). The server re-prices at checkout. */
  unitPrice: number;
  optionsLabel: string;
  selections: CartSelection[];
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  add: (product: Product, selections: CartSelection[], quantity?: number) => { ok: true } | { ok: false; error: string };
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

function lineKey(productId: string, selections: CartSelection[]): string {
  const normalized = selections
    .filter((s) => s.optionIds.length)
    .map((s) => `${s.groupId}:${[...s.optionIds].sort().join('+')}`)
    .sort()
    .join('|');
  return `${productId}#${normalized}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],

      add: (product, selections, quantity = 1) => {
        const resolved = resolveSelections(product.customizations, selections);
        if (!resolved.ok) return { ok: false, error: resolved.error };

        const key = lineKey(product.id, selections);
        const existing = get().lines.find((l) => l.key === key);
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.key === key ? { ...l, quantity: Math.min(l.quantity + quantity, PRICING.maxItemQuantity) } : l,
            ),
          });
          return { ok: true };
        }
        if (get().lines.length >= PRICING.maxCartLines) {
          return { ok: false, error: 'Your cart is full' };
        }

        const line: CartLine = {
          key,
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          isVeg: product.isVeg,
          unitPrice: product.price + resolved.extraPrice,
          optionsLabel: resolved.selectedOptions.map((o) => o.optionName).join(' · '),
          selections: selections.filter((s) => s.optionIds.length),
          quantity: Math.min(quantity, PRICING.maxItemQuantity),
        };
        set({ lines: [...get().lines, line] });
        return { ok: true };
      },

      setQuantity: (key, quantity) => {
        if (quantity <= 0) return get().remove(key);
        set({
          lines: get().lines.map((l) =>
            l.key === key ? { ...l, quantity: Math.min(quantity, PRICING.maxItemQuantity) } : l,
          ),
        });
      },

      remove: (key) => set({ lines: get().lines.filter((l) => l.key !== key) }),
      clear: () => set({ lines: [] }),
    }),
    { name: 'eo.cart.v1', storage: persistStorage, version: 1 },
  ),
);

export const useCartCount = () => useCartStore((s) => s.lines.reduce((n, l) => n + l.quantity, 0));

export const useCartSubtotal = () =>
  useCartStore((s) => Math.round(s.lines.reduce((sum, l) => sum + l.unitPrice * 100 * l.quantity, 0)) / 100);

/** The payload the API accepts — ids and quantities only, never prices. */
export const toCartInput = (lines: CartLine[]): CartItemInput[] =>
  lines.map((l) => ({ productId: l.productId, quantity: l.quantity, selectedOptions: l.selections }));
