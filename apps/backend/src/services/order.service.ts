import { canTransition, ORDER_STATUS_LABELS } from '@food/config';
import type { Order, OrderStatus, Paginated } from '@food/shared-types';
import type { OrderQuery } from '@food/validation';
import { supabase } from '../config/supabase.js';
import type { OrderRow } from '../types/db.js';
import { AppError } from '../utils/AppError.js';
import { sanitizeSearch, unwrap, unwrapMaybe } from '../utils/db.js';
import { toOrder } from '../utils/mappers.js';
import { paginationMeta, range } from '../utils/response.js';

const ORDER_SELECT: string = `*,
  items:order_items(id, product_id, product_name, product_image_url, is_veg, unit_price, quantity, selected_options, line_total),
  history:order_status_history(status, note, created_at)`;

const ADMIN_ORDER_SELECT: string = `${ORDER_SELECT},
  payments(*),
  customer:users(id, name, email, phone)`;

export async function getOrderRow(id: string, opts: { userId?: string; admin?: boolean } = {}) {
  let query = supabase.from('orders').select(opts.admin ? ADMIN_ORDER_SELECT : `${ORDER_SELECT}, payments(*)`).eq('id', id);
  if (opts.userId) query = query.eq('user_id', opts.userId);
  const row = unwrapMaybe<OrderRow>(await query.maybeSingle());
  if (!row) throw AppError.notFound('Order');
  return row;
}

export async function getOrder(id: string, opts: { userId?: string; admin?: boolean } = {}): Promise<Order> {
  return toOrder(await getOrderRow(id, opts));
}

export async function listOrders(
  query: OrderQuery,
  opts: { userId?: string; admin?: boolean } = {},
): Promise<Paginated<Order>> {
  const { page, limit } = query;
  let q = supabase
    .from('orders')
    .select(opts.admin ? ADMIN_ORDER_SELECT : ORDER_SELECT, { count: 'exact' });

  if (opts.userId) q = q.eq('user_id', opts.userId);
  if (query.status) q = q.eq('status', query.status);

  // Admins only care about orders that were actually placed (paid), unless filtering explicitly.
  if (opts.admin && !query.status) q = q.neq('payment_status', 'PENDING');

  if (query.search) {
    const term = sanitizeSearch(query.search);
    const asNumber = Number(term.replace(/^#/, ''));
    if (Number.isInteger(asNumber) && asNumber > 0) q = q.eq('order_number', asNumber);
    else if (term && opts.admin) {
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .or(`name.ilike.*${term}*,email.ilike.*${term}*`)
        .limit(50);
      q = q.in('user_id', (users ?? []).map((u) => u.id));
    }
  }

  const [from, to] = range(page, limit);
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to);
  const rows = unwrap<OrderRow[]>({ data, error });
  return { items: rows.map(toOrder), meta: paginationMeta(page, limit, count ?? rows.length) };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note: string | null,
  actorId: string,
): Promise<Order> {
  const current = await getOrderRow(id, { admin: true });

  if (current.status === status) return toOrder(current);
  if (!canTransition(current.status, status)) {
    throw AppError.badRequest(
      `Cannot move an order from ${ORDER_STATUS_LABELS[current.status]} to ${ORDER_STATUS_LABELS[status]}`,
    );
  }
  if (status !== 'CANCELLED' && current.payment_status !== 'PAID') {
    throw AppError.badRequest('This order has not been paid yet');
  }

  unwrapMaybe(
    await supabase.rpc('update_order_status', {
      p_order_id: id,
      p_status: status,
      p_note: note,
      p_actor: actorId,
    }),
  );
  return getOrder(id, { admin: true });
}

/** Customers may cancel only orders that were never paid. */
export async function cancelUnpaidOrder(id: string, userId: string): Promise<Order> {
  const current = await getOrderRow(id, { userId });
  if (current.status === 'CANCELLED') return toOrder(current);
  if (current.payment_status === 'PAID' || current.status !== 'PENDING') {
    throw AppError.badRequest('This order is already being prepared. Please contact the café to cancel.');
  }
  unwrapMaybe(
    await supabase.rpc('update_order_status', {
      p_order_id: id,
      p_status: 'CANCELLED',
      p_note: 'Cancelled by customer before payment',
      p_actor: userId,
    }),
  );
  return getOrder(id, { userId });
}
