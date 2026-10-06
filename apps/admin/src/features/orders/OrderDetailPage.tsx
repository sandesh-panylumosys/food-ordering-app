import type { Order } from '@food/shared-types';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { PaymentBadge, StatusBadge, VegDot } from '../../components/Badge';
import { buttonClass } from '../../components/Button';
import { Card, CardHeader } from '../../components/Card';
import { ErrorState } from '../../components/EmptyState';
import { IconArrowLeft } from '../../components/Icons';
import { PageHeader } from '../../components/PageHeader';
import { Skeleton } from '../../components/Spinner';
import { ApiError, errorMessage } from '../../lib/api';
import { formatDateTime, formatOrderNumber, formatPrice } from '../../lib/format';
import { useOrder } from './api';
import { PaymentRecords } from './PaymentRecords';
import { StatusActions } from './StatusActions';
import { StatusTimeline } from './StatusTimeline';

const BackLink = () => (
  <Link to="/orders" className={buttonClass('ghost', 'sm', '-ml-3 text-muted')}>
    <IconArrowLeft size={15} /> All orders
  </Link>
);

function Row({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div className={strong ? 'flex justify-between pt-2 text-[15px] font-extrabold text-ink' : 'flex justify-between text-sm'}>
      <dt className={strong ? undefined : 'text-muted'}>{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}

function ItemsCard({ order }: { order: Order }) {
  return (
    <Card>
      <CardHeader title="Items" description={`${order.itemCount} item${order.itemCount === 1 ? '' : 's'}`} />
      <ul className="divide-y divide-line/70">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-3 px-5 py-3.5">
            {item.productImageUrl ? (
              <img src={item.productImageUrl} alt="" className="size-12 shrink-0 rounded-lg bg-cream object-cover" />
            ) : (
              <span className="size-12 shrink-0 rounded-lg bg-cream" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <VegDot isVeg={item.isVeg} />
                  <span>{item.productName}</span>
                </p>
                <p className="tabular shrink-0 text-sm font-bold text-ink">{formatPrice(item.lineTotal)}</p>
              </div>
              <p className="tabular mt-0.5 text-xs text-muted">
                {item.quantity} × {formatPrice(item.unitPrice)}
              </p>
              {item.selectedOptions.length > 0 && (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {item.selectedOptions.map((o) => (
                    <li
                      key={`${o.groupId}-${o.optionId}`}
                      className="rounded-md bg-cream px-2 py-0.5 text-[11px] text-ink"
                    >
                      <span className="text-muted">{o.groupName}:</span> {o.optionName}
                      {o.price > 0 && <span className="text-muted"> (+{formatPrice(o.price)})</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
      <dl className="space-y-1.5 border-t border-line bg-cream/40 px-5 py-4">
        <Row label="Subtotal" value={formatPrice(order.subtotal)} />
        {order.discount > 0 && <Row label="Discount" value={`−${formatPrice(order.discount)}`} />}
        <Row label="Delivery" value={order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)} />
        <Row label="Tax" value={formatPrice(order.tax)} />
        <Row label="Total" value={formatPrice(order.total)} strong />
      </dl>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const { data: order, isPending, isError, error, refetch, isFetching } = useOrder(id);

  if (isPending) {
    return (
      <>
        <PageHeader eyebrow={<BackLink />} title={<Skeleton className="h-8 w-40" />} />
        <DetailSkeleton />
      </>
    );
  }

  if (isError || !order) {
    const notFound = error instanceof ApiError && (error.status === 404 || error.code === 'VALIDATION_ERROR');
    return (
      <>
        <PageHeader eyebrow={<BackLink />} title="Order" />
        <Card>
          <ErrorState
            message={notFound ? "This order doesn't exist or was removed." : errorMessage(error)}
            onRetry={notFound ? undefined : () => void refetch()}
            retrying={isFetching}
          />
        </Card>
      </>
    );
  }

  const a = order.deliveryAddress;

  return (
    <>
      <PageHeader
        eyebrow={<BackLink />}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="tabular">Order {formatOrderNumber(order.orderNumber)}</span>
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
          </span>
        }
        description={`Placed ${formatDateTime(order.createdAt)}`}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <ItemsCard order={order} />
          {order.notes && (
            <Card>
              <CardHeader title="Customer note" />
              <p className="px-5 py-4 text-sm whitespace-pre-line text-ink">{order.notes}</p>
            </Card>
          )}
          <Card>
            <CardHeader title="Payments" description="Razorpay attempts, newest first" />
            <PaymentRecords payments={order.payments} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-beige">
            <CardHeader title="Update status" />
            <StatusActions order={order} />
          </Card>

          <Card>
            <CardHeader title="Customer" />
            <dl className="space-y-2 px-5 py-4 text-sm">
              <div>
                <dt className="sr-only">Name</dt>
                <dd className="font-semibold text-ink">{order.customer?.name ?? '—'}</dd>
              </div>
              {order.customer?.email && (
                <div>
                  <dt className="sr-only">Email</dt>
                  <dd>
                    <a href={`mailto:${order.customer.email}`} className="break-all text-caramel-dark hover:underline">
                      {order.customer.email}
                    </a>
                  </dd>
                </div>
              )}
              {order.customer?.phone && (
                <div>
                  <dt className="sr-only">Phone</dt>
                  <dd>
                    <a href={`tel:${order.customer.phone}`} className="text-ink hover:underline">
                      {order.customer.phone}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Delivery address" description={a.label} />
            <address className="space-y-0.5 px-5 py-4 text-sm leading-relaxed text-ink not-italic">
              <p className="font-semibold">{a.recipientName}</p>
              <p>{a.line1}</p>
              {a.line2 && <p>{a.line2}</p>}
              {a.landmark && <p className="text-muted">Near {a.landmark}</p>}
              <p>
                {a.city}, {a.state} {a.postalCode}
              </p>
              <p className="pt-1">
                <a href={`tel:${a.phone}`} className="text-caramel-dark hover:underline">
                  {a.phone}
                </a>
              </p>
            </address>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <StatusTimeline events={order.statusHistory} />
          </Card>
        </div>
      </div>
    </>
  );
}
