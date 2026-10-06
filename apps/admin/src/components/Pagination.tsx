import type { PaginationMeta } from '@food/shared-types';
import { formatNumber } from '../lib/format';
import { IconChevronLeft, IconChevronRight } from './Icons';
import { Button } from './Button';

export function Pagination({ meta, onChange }: { meta: PaginationMeta; onChange: (page: number) => void }) {
  const { page, limit, total, totalPages } = meta;
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-muted"
    >
      <p className="tabular">
        Showing <span className="font-semibold text-ink">{formatNumber(from)}</span>–
        <span className="font-semibold text-ink">{formatNumber(to)}</span> of{' '}
        <span className="font-semibold text-ink">{formatNumber(total)}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          icon={<IconChevronLeft size={15} />}
        >
          Previous
        </Button>
        <span className="tabular px-1">
          Page {page} of {totalPages}
        </span>
        <Button variant="secondary" size="sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
          Next
          <IconChevronRight size={15} />
        </Button>
      </div>
    </nav>
  );
}
