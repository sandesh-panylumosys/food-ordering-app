import { ORDER_STATUS_LABELS } from '@food/config';
import type { OrderStatus, PaymentRecordStatus, PaymentStatus } from '@food/shared-types';
import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

export type Tone = 'gray' | 'blue' | 'amber' | 'violet' | 'indigo' | 'green' | 'red' | 'caramel' | 'gold';

const TONES: Record<Tone, { pill: string; dot: string }> = {
  gray: { pill: 'bg-stone-100 text-stone-700 ring-stone-300/60', dot: 'bg-stone-500' },
  blue: { pill: 'bg-blue-50 text-blue-800 ring-blue-300/60', dot: 'bg-blue-600' },
  amber: { pill: 'bg-amber-50 text-amber-900 ring-amber-300/70', dot: 'bg-amber-500' },
  violet: { pill: 'bg-violet-50 text-violet-800 ring-violet-300/60', dot: 'bg-violet-600' },
  indigo: { pill: 'bg-indigo-50 text-indigo-800 ring-indigo-300/60', dot: 'bg-indigo-600' },
  green: { pill: 'bg-emerald-50 text-emerald-800 ring-emerald-300/60', dot: 'bg-emerald-600' },
  red: { pill: 'bg-red-50 text-red-800 ring-red-300/60', dot: 'bg-red-600' },
  caramel: { pill: 'bg-[#f6e8da] text-[#7a4d25] ring-[#ddb892]/80', dot: 'bg-caramel' },
  gold: { pill: 'bg-[#f4ead9] text-[#6e5225] ring-[#b98d57]/50', dot: 'bg-gold' },
};

export function Badge({
  tone = 'gray',
  dot = false,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset',
        t.pill,
        className,
      )}
    >
      {dot && <span aria-hidden="true" className={cx('size-1.5 rounded-full', t.dot)} />}
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<OrderStatus, Tone> = {
  PENDING: 'gray',
  CONFIRMED: 'blue',
  PREPARING: 'amber',
  READY: 'violet',
  OUT_FOR_DELIVERY: 'indigo',
  DELIVERED: 'green',
  CANCELLED: 'red',
};

/** In the admin, a PENDING order is one that hasn't been paid for yet. */
export const statusLabel = (status: OrderStatus) =>
  status === 'PENDING' ? 'Awaiting payment' : ORDER_STATUS_LABELS[status];

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {statusLabel(status)}
    </Badge>
  );
}

const PAYMENT_META: Record<PaymentStatus, { tone: Tone; label: string }> = {
  PENDING: { tone: 'gray', label: 'Unpaid' },
  PAID: { tone: 'green', label: 'Paid' },
  FAILED: { tone: 'red', label: 'Failed' },
  REFUNDED: { tone: 'violet', label: 'Refunded' },
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

const RECORD_META: Record<PaymentRecordStatus, { tone: Tone; label: string }> = {
  CREATED: { tone: 'gray', label: 'Created' },
  PAID: { tone: 'green', label: 'Paid' },
  FAILED: { tone: 'red', label: 'Failed' },
};

export function PaymentRecordBadge({ status }: { status: PaymentRecordStatus }) {
  const meta = RECORD_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function VegDot({ isVeg, className }: { isVeg: boolean; className?: string }) {
  const label = isVeg ? 'Vegetarian' : 'Non-vegetarian';
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] bg-white',
        isVeg ? 'border-emerald-700' : 'border-red-700',
        className,
      )}
    >
      <span className={cx('size-1.5 rounded-full', isVeg ? 'bg-emerald-700' : 'bg-red-700')} />
    </span>
  );
}
