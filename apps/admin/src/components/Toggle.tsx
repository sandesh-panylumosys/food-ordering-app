import { useId, type ReactNode } from 'react';
import { cx } from '../lib/cx';

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  /** Visually hide the label (it is still announced). */
  hideLabel?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, label, description, hideLabel, disabled, size = 'md' }: ToggleProps) {
  const id = useId();
  const track = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const knob = size === 'sm' ? 'size-4' : 'size-5';
  const shift = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-emerald-600' : 'bg-[#cfc4b8]',
          track,
        )}
      >
        <span
          aria-hidden="true"
          className={cx('rounded-full bg-white shadow transition-transform', knob, checked ? shift : 'translate-x-0')}
        />
      </button>
      <div className={cx('flex flex-col', hideLabel && 'sr-only')}>
        <label id={`${id}-label`} htmlFor={id} className="cursor-pointer text-sm font-semibold text-ink">
          {label}
        </label>
        {description && (
          <span id={`${id}-desc`} className="text-xs text-muted">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
