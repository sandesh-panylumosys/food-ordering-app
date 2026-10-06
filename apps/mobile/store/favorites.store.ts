import type { Product } from '@food/shared-types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';

/** Favourites are a device-local convenience (no account required). */
interface FavoritesState {
  items: Record<string, Product>;
  toggle: (product: Product) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: {},
      toggle: (product) => {
        const items = { ...get().items };
        const added = !items[product.id];
        if (added) items[product.id] = product;
        else delete items[product.id];
        set({ items });
        return added;
      },
    }),
    { name: 'eo.favorites.v1', storage: persistStorage, version: 1 },
  ),
);

export const useIsFavorite = (id: string) => useFavoritesStore((s) => Boolean(s.items[id]));
