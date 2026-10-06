import { useId, useState, type KeyboardEvent } from 'react';
import { cx } from '../../lib/cx';
import { IconX } from '../../components/Icons';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
  max?: number;
}

export function IngredientsInput({ value, onChange, error, max = 30 }: Props) {
  const id = useId();
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const parts = raw
      .split(',')
      .map((s) => s.trim().slice(0, 60))
      .filter(Boolean);
    if (parts.length === 0) return;
    const existing = new Set(value.map((v) => v.toLowerCase()));
    const next = [...value];
    for (const p of parts) {
      if (!existing.has(p.toLowerCase()) && next.length < max) {
        next.push(p);
        existing.add(p.toLowerCase());
      }
    }
    onChange(next);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        Ingredients
      </label>
      <div
        className={cx(
          'flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 shadow-xs',
          'focus-within:border-caramel focus-within:ring-2 focus-within:ring-caramel/40',
          error ? 'border-red-500' : 'border-line',
        )}
      >
        {value.map((item, i) => (
          <span key={`${item}-${i}`} className="inline-flex items-center gap-1 rounded-md bg-cream py-0.5 pr-1 pl-2 text-[13px] text-ink">
            {item}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="rounded p-0.5 text-muted hover:bg-beige/40 hover:text-ink"
              aria-label={`Remove ${item}`}
            >
              <IconX size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (text.includes(',')) {
              e.preventDefault();
              add(text);
            }
          }}
          placeholder={value.length ? '' : 'e.g. espresso, oat milk, cinnamon'}
          aria-describedby={`${id}-hint`}
          aria-invalid={error ? true : undefined}
          className="min-w-[140px] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted/70"
          disabled={value.length >= max}
        />
      </div>
      <p id={`${id}-hint`} className={cx('text-xs', error ? 'font-medium text-red-700' : 'text-muted')}>
        {error ?? 'Press Enter or comma to add. Backspace removes the last one.'}
      </p>
    </div>
  );
}
