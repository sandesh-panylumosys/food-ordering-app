import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cx } from '../lib/cx';
import { Skeleton } from './Spinner';

/** Horizontally scrollable table shell (keeps the page from overflowing on tablets). */
export function Table({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  return (
    <div className={cx('overflow-x-auto', className)}>
      <table aria-label={label} className="w-full min-w-[680px] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line bg-cream/60 text-[11px] font-bold tracking-wider text-muted uppercase">
      {children}
    </thead>
  );
}

export function Th({ className, children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={cx('px-4 py-2.5 whitespace-nowrap', className)} {...rest}>
      {children}
    </th>
  );
}

export function Td({ className, children, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cx('px-4 py-3 align-middle', className)} {...rest}>
      {children}
    </td>
  );
}

export function Tr({ className, children, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cx('border-b border-line/70 last:border-0 transition-colors hover:bg-warm/70', className)} {...rest}>
      {children}
    </tr>
  );
}

export function TableSkeleton({ rows = 6, cols }: { rows?: number; cols: number }) {
  return (
    <tbody aria-hidden="true">
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="border-b border-line/70 last:border-0">
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} className="px-4 py-3.5">
              <Skeleton className={cx('h-4', c === 0 ? 'w-24' : c % 3 === 0 ? 'w-14' : 'w-20')} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
