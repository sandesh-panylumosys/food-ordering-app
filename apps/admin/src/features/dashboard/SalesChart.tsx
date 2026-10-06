import type { SalesPoint } from '@food/shared-types';
import { useState } from 'react';
import { formatDay, formatPrice } from '../../lib/format';

const W = 640;
const H = 240;
const PAD = { top: 16, right: 8, bottom: 40, left: 56 };
const MAX_BAR = 24;

/** Rounds up to a "nice" axis maximum (1, 2, 2.5, 5 × 10^n). */
function niceMax(value: number): number {
  if (value <= 0) return 1000;
  const exp = Math.floor(Math.log10(value));
  const base = 10 ** exp;
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (value <= step * base) return step * base;
  }
  return 10 * base;
}

const compact = (n: number) =>
  n >= 100_000 ? `₹${(n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 1)}L` : n >= 1000 ? `₹${n / 1000}k` : `₹${n}`;

/** Bar with a 4px rounded top and a square base. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

export function SalesChart({ data }: { data: SalesPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.revenue)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.min(MAX_BAR, slot * 0.5);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const activePoint = active !== null ? data[active] : undefined;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Revenue for the last 7 days"
        onMouseLeave={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#ece4da" strokeWidth={1} />
            <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px]">
              {compact(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const h = Math.max(d.revenue > 0 ? 2 : 0, (d.revenue / max) * innerH);
          const label = formatDay(d.date);
          const isToday = i === data.length - 1;
          return (
            <g
              key={d.date}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              tabIndex={0}
              role="img"
              aria-label={`${label.full}: ${formatPrice(d.revenue)} from ${d.orders} order${d.orders === 1 ? '' : 's'}`}
              className="cursor-default outline-none"
            >
              {/* generous hit target */}
              <rect x={cx - slot / 2} y={PAD.top} width={slot} height={innerH} fill="transparent" />
              {active === i && (
                <rect x={cx - slot / 2 + 4} y={PAD.top} width={slot - 8} height={innerH} rx={6} fill="#f8f4ee" />
              )}
              <path
                d={barPath(cx - barW / 2, y(0) - h, barW, h)}
                fill="var(--color-chart)"
                opacity={active === null || active === i ? 1 : 0.55}
              />
              <text
                x={cx}
                y={H - PAD.bottom + 18}
                textAnchor="middle"
                className={isToday ? 'fill-ink text-[12px] font-bold' : 'fill-muted text-[12px] font-semibold'}
              >
                {isToday ? 'Today' : label.weekday}
              </text>
              <text x={cx} y={H - PAD.bottom + 33} textAnchor="middle" className="fill-muted text-[10px]">
                {label.day}
              </text>
            </g>
          );
        })}
        <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="#d9cfc3" strokeWidth={1} />
      </svg>

      {activePoint && active !== null && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: `${((PAD.left + slot * active + slot / 2) / W) * 100}%` }}
        >
          <p className="font-semibold text-ink">{formatDay(activePoint.date).full}</p>
          <p className="tabular mt-0.5 text-ink">
            <span className="font-bold">{formatPrice(activePoint.revenue)}</span>
            <span className="text-muted">
              {' '}
              · {activePoint.orders} order{activePoint.orders === 1 ? '' : 's'}
            </span>
          </p>
        </div>
      )}

      {/* Table view for assistive tech */}
      <table className="sr-only">
        <caption>Revenue by day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Revenue</th>
            <th scope="col">Orders</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{formatDay(d.date).full}</td>
              <td>{formatPrice(d.revenue)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
