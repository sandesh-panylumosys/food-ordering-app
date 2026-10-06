import { ORDER_STATUS_LABELS } from '@food/config';
import type { Order } from '@food/shared-types';
import { Badge } from '@/components/ui';

export function OrderStatusBadge({ order }: { order: Pick<Order, 'status' | 'paymentStatus'> }) {
  if (order.status === 'PENDING') {
    return <Badge label={order.paymentStatus === 'FAILED' ? 'Payment failed' : 'Awaiting payment'} tone="warning" />;
  }
  if (order.status === 'CANCELLED') return <Badge label="Cancelled" tone="danger" />;
  if (order.status === 'DELIVERED') return <Badge label="Delivered" tone="success" />;
  return <Badge label={ORDER_STATUS_LABELS[order.status]} tone="accent" />;
}
