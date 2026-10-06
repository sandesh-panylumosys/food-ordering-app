import type { Order } from '@food/shared-types';
import { api } from '@/lib/api';

export const fetchOrders = (page: number) => api.getPage<Order>('/orders', { page, limit: 10 });
export const fetchOrder = (id: string) => api.get<Order>(`/orders/${id}`);
export const cancelOrder = (id: string) => api.post<Order>(`/orders/${id}/cancel`);
