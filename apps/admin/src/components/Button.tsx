import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../lib/cx';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-caramel text-espresso hover:bg-[#b97d4b] active:bg-caramel-dark active:text-white shadow-sm',
  secondary: 'bg-white text-ink border border-line hover:bg-warm hover:border-beige shadow-sm',
  ghost: 'text-ink hover:bg-espresso/5',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  dark: 'bg-espresso text-cream hover:bg-espresso-soft shadow-sm',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
  cx(
    'inline-flex shrink-0 items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner label="Working" /> : icon}
      {children}
    </button>
  );
});

/** Square icon-only button; `label` is required for screen readers. */
export function IconButton({
  label,
  children,
  className,
  tone = 'default',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'default' | 'danger' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors disabled:opacity-40',
        tone === 'danger' ? 'hover:bg-red-50 hover:text-red-700' : 'hover:bg-espresso/5 hover:text-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
