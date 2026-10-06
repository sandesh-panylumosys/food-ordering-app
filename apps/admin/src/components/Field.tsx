import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from '../lib/cx';

export const controlClass = (invalid?: boolean, className?: string) =>
  cx(
    'w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-muted/70 shadow-xs transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-caramel/40 focus:border-caramel',
    'disabled:cursor-not-allowed disabled:bg-cream disabled:text-muted',
    invalid ? 'border-red-500' : 'border-line hover:border-beige',
    className,
  );

interface FieldShellProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  srOnlyLabel?: boolean;
  children: ReactNode;
}

export function FieldShell({ id, label, hint, error, required, className, srOnlyLabel, children }: FieldShellProps) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className={cx('text-[13px] font-semibold text-ink', srOnlyLabel && 'sr-only')}>
          {label}
          {required && (
            <span className="ml-0.5 text-red-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: ReactNode) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

type Common = { label?: ReactNode; hint?: ReactNode; error?: string; wrapperClassName?: string; srOnlyLabel?: boolean };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & Common & { leading?: ReactNode }>(
  function Input({ label, hint, error, wrapperClassName, srOnlyLabel, className, id, leading, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <FieldShell id={fid} label={label} hint={hint} error={error} required={rest.required} className={wrapperClassName} srOnlyLabel={srOnlyLabel}>
        <div className="relative">
          {leading && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">{leading}</span>
          )}
          <input
            ref={ref}
            id={fid}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(fid, error, hint)}
            className={controlClass(!!error, cx('h-10', leading ? 'pl-9' : undefined, className))}
            {...rest}
          />
        </div>
      </FieldShell>
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & Common>(function Select(
  { label, hint, error, wrapperClassName, srOnlyLabel, className, id, children, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} required={rest.required} className={wrapperClassName} srOnlyLabel={srOnlyLabel}>
      <select
        ref={ref}
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fid, error, hint)}
        className={controlClass(!!error, cx('h-10 cursor-pointer pr-8', className))}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & Common>(
  function Textarea({ label, hint, error, wrapperClassName, srOnlyLabel, className, id, rows = 3, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <FieldShell id={fid} label={label} hint={hint} error={error} required={rest.required} className={wrapperClassName} srOnlyLabel={srOnlyLabel}>
        <textarea
          ref={ref}
          id={fid}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fid, error, hint)}
          className={controlClass(!!error, cx('resize-y py-2 leading-relaxed', className))}
          {...rest}
        />
      </FieldShell>
    );
  },
);
