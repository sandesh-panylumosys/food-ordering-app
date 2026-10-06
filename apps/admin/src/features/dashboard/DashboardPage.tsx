import { Link } from 'react-router';
import { buttonClass } from '../../components/Button';
import { Card, CardHeader } from '../../components/Card';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { IconCheck, IconCup, IconFlame, IconReceipt, IconRefresh } from '../../components/Icons';
import { PageHeader } from '../../components/PageHeader';
import { Skeleton } from '../../components/Spinner';
import { errorMessage } from '../../lib/api';
import { formatNumber, formatPrice } from '../../lib/format';
import { OrdersTable } from '../orders/OrdersTable';
import { useDashboard } from './api';
import { SalesChart } from './SalesChart';
import { StatCard, StatCardSkeleton } from './StatCard';
import { TopProducts } from './TopProducts';

const IconRupee = () => (
  <span aria-hidden="true" className="text-[15px] leading-none font-bold">
    ₹
  </span>
);

export function DashboardPage() {
  const { data, isPending, isError, error, refetch, isFetching, dataUpdatedAt } = useDashboard();

  const weekRevenue = data?.salesByDay.reduce((sum, d) => sum + d.revenue, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          dataUpdatedAt
            ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} · refreshes every 30 seconds`
            : 'Today at a glance'
        }
        actions={
          <button
            type="button"
            onClick={() => void refetch()}
            className={buttonClass('secondary', 'sm')}
            disabled={isFetching}
          >
            <IconRefresh size={15} className={isFetching ? 'animate-spin' : undefined} />
            Refresh
          </button>
        }
      />

      {isError && !data ? (
        <Card>
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} retrying={isFetching} />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {isPending || !data ? (
              Array.from({ length: 6 }, (_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <StatCard accent label="Today's orders" value={formatNumber(data.todayOrders)} icon={<IconReceipt />} hint="Paid orders today" />
                <StatCard label="Today's revenue" value={formatPrice(data.todayRevenue)} icon={<IconRupee />} hint="Excludes cancelled" />
                <StatCard label="Total revenue" value={formatPrice(data.revenue)} icon={<IconRupee />} hint="All time" />
                <StatCard
                  label="Active orders"
                  value={formatNumber(data.pendingOrders)}
                  icon={<IconFlame />}
                  hint={
                    <Link to="/orders" className="font-semibold text-caramel-dark hover:underline">
                      In the kitchen or on the way
                    </Link>
                  }
                />
                <StatCard label="Completed" value={formatNumber(data.completedOrders)} icon={<IconCheck />} hint={`${formatNumber(data.cancelledOrders)} cancelled`} />
                <StatCard label="Total orders" value={formatNumber(data.totalOrders)} icon={<IconCup />} hint={`${formatNumber(data.activeProducts)} dishes available`} />
              </>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <Card>
              <CardHeader
                title="Revenue, last 7 days"
                description={data ? `${formatPrice(weekRevenue)} this week` : ' '}
              />
              <div className="px-3 pt-4 pb-3 sm:px-5">
                {data ? <SalesChart data={data.salesByDay} /> : <Skeleton className="h-56 w-full" />}
              </div>
            </Card>

            <Card>
              <CardHeader title="Top products" description="By quantity sold" />
              {data ? (
                <TopProducts products={data.topProducts} />
              ) : (
                <div className="space-y-4 p-5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Recent orders"
              actions={
                <Link to="/orders" className={buttonClass('ghost', 'sm')}>
                  View all
                </Link>
              }
            />
            {data && data.recentOrders.length === 0 ? (
              <EmptyState icon={<IconReceipt />} title="No orders yet" description="New paid orders will show up here." />
            ) : (
              <OrdersTable orders={data?.recentOrders} loading={isPending} label="Recent orders" />
            )}
          </Card>
        </div>
      )}
    </>
  );
}
