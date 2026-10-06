import type { Order } from '@food/shared-types';
import { Link, useNavigate } from 'react-router';
import { PaymentBadge, StatusBadge } from '../../components/Badge';
import { Table, TableSkeleton, Td, Th, THead, Tr } from '../../components/Table';
import { formatDateTime, formatOrderNumber, formatPrice, formatRelative } from '../../lib/format';

interface OrdersTableProps {
  orders: Order[] | undefined;
  loading?: boolean;
  label?: string;
}

const COLS = 7;

export function OrdersTable({ orders, loading, label = 'Orders' }: OrdersTableProps) {
  const navigate = useNavigate();

  return (
    <Table label={label}>
      <THead>
        <tr>
          <Th>Order</Th>
          <Th>Customer</Th>
          <Th className="text-right">Items</Th>
          <Th className="text-right">Total</Th>
          <Th>Payment</Th>
          <Th>Status</Th>
          <Th className="text-right">Placed</Th>
        </tr>
      </THead>
      {loading && !orders ? (
        <TableSkeleton cols={COLS} />
      ) : (
        <tbody>
          {(orders ?? []).map((order) => (
            <Tr
              key={order.id}
              className="cursor-pointer"
              onClick={(e) => {
                // Let real links / modified clicks behave natively.
                if ((e.target as HTMLElement).closest('a') || e.metaKey || e.ctrlKey) return;
                navigate(`/orders/${order.id}`);
              }}
            >
              <Td>
                <Link
                  to={`/orders/${order.id}`}
                  className="tabular font-bold text-espresso underline-offset-2 hover:text-caramel-dark hover:underline"
                >
                  {formatOrderNumber(order.orderNumber)}
                </Link>
              </Td>
              <Td>
                <p className="max-w-[220px] truncate font-semibold text-ink">{order.customer?.name ?? '—'}</p>
                <p className="max-w-[220px] truncate text-xs text-muted">{order.customer?.email}</p>
              </Td>
              <Td className="tabular text-right">{order.itemCount}</Td>
              <Td className="tabular text-right font-semibold">{formatPrice(order.total)}</Td>
              <Td>
                <PaymentBadge status={order.paymentStatus} />
              </Td>
              <Td>
                <StatusBadge status={order.status} />
              </Td>
              <Td className="text-right whitespace-nowrap text-muted">
                <time dateTime={order.createdAt} title={formatDateTime(order.createdAt)}>
                  {formatRelative(order.createdAt)}
                </time>
              </Td>
            </Tr>
          ))}
        </tbody>
      )}
    </Table>
  );
}
