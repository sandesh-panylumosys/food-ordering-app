import type { ReactNode } from 'react';
import { cx } from '../lib/cx';
import { Button } from './Button';
import { IconAlert, IconRefresh } from './Icons';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {icon && (
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-cream text-gold">{icon}</div>
      )}
      <h3 className="text-[15px] font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  retrying,
  className,
}: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  return (
    <EmptyState
      className={className}
      icon={<IconAlert size={22} className="text-red-600" />}
      title="Couldn't load this"
      description={message}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" icon={<IconRefresh size={15} />} loading={retrying} onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  );
}

export function InlineAlert({
  tone = 'error',
  children,
  className,
}: {
  tone?: 'error' | 'info' | 'warning';
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cx('rounded-lg border px-3 py-2.5 text-sm', styles, className)}>
      {children}
    </div>
  );
}
