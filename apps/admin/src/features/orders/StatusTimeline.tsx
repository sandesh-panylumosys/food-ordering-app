import type { OrderStatusEvent } from '@food/shared-types';
import { STATUS_TONE, statusLabel } from '../../components/Badge';
import { cx } from '../../lib/cx';
import { formatDateTime } from '../../lib/format';

const DOT: Record<string, string> = {
  gray: 'bg-stone-400 ring-stone-100',
  blue: 'bg-blue-600 ring-blue-100',
  amber: 'bg-amber-500 ring-amber-100',
  violet: 'bg-violet-600 ring-violet-100',
  indigo: 'bg-indigo-600 ring-indigo-100',
  green: 'bg-emerald-600 ring-emerald-100',
  red: 'bg-red-600 ring-red-100',
};

export function StatusTimeline({ events }: { events: OrderStatusEvent[] }) {
  if (events.length === 0) return <p className="px-5 py-4 text-sm text-muted">No status changes recorded yet.</p>;
  const ordered = [...events].reverse(); // newest first

  return (
    <ol className="px-5 py-4">
      {ordered.map((e, i) => (
        <li key={`${e.status}-${e.createdAt}`} className="relative flex gap-3 pb-5 last:pb-0">
          {i < ordered.length - 1 && (
            <span aria-hidden="true" className="absolute top-4 bottom-0 left-[5px] w-px bg-line" />
          )}
          <span
            aria-hidden="true"
            className={cx('relative mt-1 size-[11px] shrink-0 rounded-full ring-4', DOT[STATUS_TONE[e.status]])}
          />
          <div className="min-w-0">
            <p className={cx('text-sm', i === 0 ? 'font-bold text-ink' : 'font-semibold text-ink/80')}>
              {statusLabel(e.status)}
            </p>
            <time dateTime={e.createdAt} className="text-xs text-muted">
              {formatDateTime(e.createdAt)}
            </time>
            {e.note && <p className="mt-1 rounded-md bg-cream px-2 py-1 text-xs text-ink">{e.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
