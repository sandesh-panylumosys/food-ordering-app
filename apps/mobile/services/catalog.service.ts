import type { CartItemInput, CartQuote, Category, HomeFeed, Product } from '@food/shared-types';
import { api } from '@/lib/api';

export interface ProductListParams {
  category?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export const fetchHome = (signal?: AbortSignal) => api.get<HomeFeed>('/home', undefined, signal);
export const fetchCategories = () => api.get<Category[]>('/categories');
export const fetchProduct = (id: string) => api.get<Product>(`/products/${id}`);
export const fetchProducts = (params: ProductListParams, signal?: AbortSignal) =>
  api.getPage<Product>('/products', { ...params }, signal);
export const quoteCart = (items: CartItemInput[]) => api.post<CartQuote>('/cart/quote', { items });
