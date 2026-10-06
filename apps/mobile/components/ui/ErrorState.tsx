import { friendlyMessage, NetworkError } from '@/lib/errors';
import { EmptyState } from './EmptyState';

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const offline = error instanceof NetworkError;
  return (
    <EmptyState
      icon={offline ? 'cloud-offline-outline' : 'alert-circle-outline'}
      title={offline ? 'You’re offline' : 'Something went wrong'}
      message={friendlyMessage(error)}
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
    />
  );
}
