import type { TopProduct } from '@food/shared-types';
import { EmptyState } from '../../components/EmptyState';
import { IconCup } from '../../components/Icons';
import { formatPrice } from '../../lib/format';

export function TopProducts({ products }: { products: TopProduct[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<IconCup />}
        title="No sales yet"
        description="Best-selling dishes will appear here once orders are paid."
        className="py-10"
      />
    );
  }
  const max = Math.max(...products.map((p) => p.quantity), 1);

  return (
    <ol className="divide-y divide-line/70">
      {products.map((p, i) => (
        <li key={p.productName} className="flex items-center gap-3 px-5 py-3">
          <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full bg-cream text-xs font-bold text-gold">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold text-ink">{p.productName}</p>
              <p className="tabular shrink-0 text-sm font-bold text-ink">{formatPrice(p.revenue)}</p>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream" aria-hidden="true">
                <div className="h-full rounded-full bg-beige" style={{ width: `${(p.quantity / max) * 100}%` }} />
              </div>
              <span className="tabular w-14 shrink-0 text-right text-xs text-muted">{p.quantity} sold</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
