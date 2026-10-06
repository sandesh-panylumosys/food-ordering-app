import type { DashboardStats } from '@food/shared-types';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: ({ signal }) => api.get<DashboardStats>('/admin/dashboard', undefined, signal),
    refetchInterval: 30_000,
  });
}
