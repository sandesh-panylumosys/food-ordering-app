export { formatPrice } from '@food/config';

const dateTime = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const shortDateTime = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatShortDateTime = (iso: string) => shortDateTime.format(new Date(iso));
export const formatOrderNumber = (n: number) => `#${n}`;
export const formatNumber = (n: number) => n.toLocaleString('en-IN');

/** "just now", "12 min ago", "3 hr ago", then a short date. */
export function formatRelative(iso: string, now = Date.now()): string {
  const diffSec = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 45) return 'just now';
  if (abs < 3600) return relative.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86_400) return relative.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 7 * 86_400) return relative.format(Math.round(diffSec / 86_400), 'day');
  return shortDateTime.format(new Date(iso));
}

/** "2026-10-05" → { weekday: "Mon", day: "5 Oct" } without timezone drift. */
export function formatDay(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  return {
    weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
    day: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    full: date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
  };
}
