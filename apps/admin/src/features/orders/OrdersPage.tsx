import { ORDER_STATUSES, type OrderStatus } from '@food/shared-types';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { STATUS_TONE } from '../../components/Badge';
import { Card } from '../../components/Card';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { Input } from '../../components/Field';
import { IconReceipt, IconSearch } from '../../components/Icons';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { Spinner } from '../../components/Spinner';
import { errorMessage } from '../../lib/api';
import { cx } from '../../lib/cx';
import { useDebounced } from '../../lib/useDebounced';
import { useOrders } from './api';
import { OrdersTable } from './OrdersTable';

const TABS: Array<{ value: OrderStatus | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY', label: 'Ready' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'PENDING', label: 'Unpaid' },
];

const DOT: Record<string, string> = {
  gray: 'bg-stone-400',
  blue: 'bg-blue-600',
  amber: 'bg-amber-500',
  violet: 'bg-violet-600',
  indigo: 'bg-indigo-600',
  green: 'bg-emerald-600',
  red: 'bg-red-600',
};

const asStatus = (v: string | null): OrderStatus | undefined =>
  v && (ORDER_STATUSES as readonly string[]).includes(v) ? (v as OrderStatus) : undefined;

export function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const status = asStatus(params.get('status'));
  const page = Math.max(1, Number(params.get('page')) || 1);
  const q = params.get('q') ?? '';

  const [search, setSearch] = useState(q);
  const debounced = useDebounced(search.trim());

  const update = (patch: Record<string, string | undefined>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v) next.set(k, v);
          else next.delete(k);
        }
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    if (debounced !== q) update({ q: debounced || undefined, page: undefined });
  }, [debounced]);

  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useOrders({
    page,
    status,
    search: q || undefined,
  });

  return (
    <>
      <PageHeader title="Orders" description="Live order queue · refreshes every 15 seconds" />

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:p-4">
          <div className="-mx-1 overflow-x-auto px-1">
            <div role="group" aria-label="Filter by status" className="flex min-w-max gap-1">
              {TABS.map((tab) => {
                const selected = (status ?? '') === tab.value;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => update({ status: tab.value || undefined, page: undefined })}
                    className={cx(
                      'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors',
                      selected ? 'bg-espresso text-cream' : 'text-muted hover:bg-cream hover:text-ink',
                    )}
                  >
                    {tab.value && (
                      <span aria-hidden="true" className={cx('size-1.5 rounded-full', DOT[STATUS_TONE[tab.value]])} />
                    )}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Input
              label="Search orders"
              srOnlyLabel
              type="search"
              placeholder="Order # (e.g. 1024), customer name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leading={<IconSearch size={16} />}
              wrapperClassName="w-full max-w-md"
            />
            {isFetching && !isPending && <Spinner label="Refreshing orders" className="text-muted" />}
          </div>
          {!status && (
            <p className="text-xs text-muted">
              “All” shows placed orders only. Use <strong className="font-semibold text-ink">Unpaid</strong> to see
              checkouts that were never paid.
            </p>
          )}
        </div>

        {isError && !data ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} retrying={isFetching} />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            icon={<IconReceipt />}
            title={q ? 'No matching orders' : 'No orders here yet'}
            description={
              q ? 'Try an order number like 1024, or part of the customer’s name or email.' : 'Orders with this status will appear here.'
            }
          />
        ) : (
          <div className={cx('transition-opacity', isPlaceholderData && 'opacity-60')}>
            <OrdersTable orders={data?.items} loading={isPending} />
          </div>
        )}

        {data && <Pagination meta={data.meta} onChange={(p) => update({ page: p > 1 ? String(p) : undefined })} />}
      </Card>
    </>
  );
}
