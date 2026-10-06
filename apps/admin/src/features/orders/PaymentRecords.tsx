import { fromPaise } from '@food/config';
import type { PaymentSummary } from '@food/shared-types';
import { PaymentRecordBadge } from '../../components/Badge';
import { formatDateTime, formatPrice } from '../../lib/format';

const METHOD_LABELS: Record<string, string> = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net banking',
  wallet: 'Wallet',
  emi: 'EMI',
  paylater: 'Pay later',
};

const methodLabel = (m: string | null) => (m ? (METHOD_LABELS[m.toLowerCase()] ?? m) : '—');

function Mono({ children }: { children: string | null }) {
  if (!children) return <span className="text-muted">—</span>;
  return <code className="rounded bg-cream px-1.5 py-0.5 font-mono text-[12px] break-all text-ink">{children}</code>;
}

export function PaymentRecords({ payments }: { payments: PaymentSummary[] | undefined }) {
  if (!payments || payments.length === 0) {
    return <p className="px-5 py-4 text-sm text-muted">No payment attempts recorded.</p>;
  }

  return (
    <ul className="divide-y divide-line/70">
      {payments.map((p) => (
        <li key={p.id} className="px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PaymentRecordBadge status={p.status} />
              <span className="tabular text-sm font-bold text-ink">{formatPrice(fromPaise(p.amountPaise))}</span>
              <span className="text-xs text-muted">{p.currency}</span>
            </div>
            <time dateTime={p.createdAt} className="text-xs text-muted">
              {formatDateTime(p.createdAt)}
            </time>
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-[auto_1fr]">
            <dt className="text-muted">Razorpay order</dt>
            <dd>
              <Mono>{p.razorpayOrderId}</Mono>
            </dd>
            <dt className="text-muted">Razorpay payment</dt>
            <dd>
              <Mono>{p.razorpayPaymentId}</Mono>
            </dd>
            <dt className="text-muted">Method</dt>
            <dd className="font-medium text-ink">{methodLabel(p.method)}</dd>
            {p.errorDescription && (
              <>
                <dt className="text-muted">Error</dt>
                <dd className="text-red-700">{p.errorDescription}</dd>
              </>
            )}
          </dl>
        </li>
      ))}
    </ul>
  );
}
