import type { DashboardStats } from '@food/shared-types';
import { supabase } from '../config/supabase.js';
import { unwrap } from '../utils/db.js';
import { listOrders } from './order.service.js';

type Aggregates = Omit<DashboardStats, 'recentOrders'>;

export async function getDashboardStats(): Promise<DashboardStats> {
  const [aggregates, recent] = await Promise.all([
    supabase.rpc('admin_dashboard_stats', { p_days: 7 }),
    listOrders({ page: 1, limit: 8 }, { admin: true }),
  ]);
  const stats = unwrap<Aggregates>(aggregates);

  return {
    ...stats,
    revenue: Number(stats.revenue),
    todayRevenue: Number(stats.todayRevenue),
    salesByDay: stats.salesByDay.map((d) => ({ ...d, revenue: Number(d.revenue), orders: Number(d.orders) })),
    topProducts: stats.topProducts.map((p) => ({ ...p, revenue: Number(p.revenue) })),
    recentOrders: recent.items,
  };
}
