import type { ReactNode } from 'react';
import { Skeleton } from '../../components/Spinner';
import { cx } from '../../lib/cx';

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cx(
        'rounded-xl border p-4 shadow-xs',
        accent ? 'border-espresso bg-espresso text-cream' : 'border-line bg-white text-ink',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cx('text-[13px] font-semibold', accent ? 'text-cream/70' : 'text-muted')}>{label}</p>
        <span
          className={cx(
            'flex size-8 items-center justify-center rounded-lg',
            accent ? 'bg-caramel/20 text-caramel' : 'bg-cream text-gold',
          )}
        >
          {icon}
        </span>
      </div>
      <p className="tabular mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className={cx('mt-0.5 text-xs', accent ? 'text-cream/60' : 'text-muted')}>{hint}</p>}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-7 w-20" />
      <Skeleton className="mt-2 h-3 w-16" />
    </div>
  );
}
