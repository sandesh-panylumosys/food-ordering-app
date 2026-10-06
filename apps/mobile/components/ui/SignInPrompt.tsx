import { router } from 'expo-router';
import { EmptyState } from './EmptyState';

export function SignInPrompt({ message, returnTo }: { message: string; returnTo?: string }) {
  return (
    <EmptyState
      icon="person-circle-outline"
      title="Sign in to continue"
      message={message}
      actionLabel="Sign In"
      onAction={() => router.push({ pathname: '/login', params: returnTo ? { returnTo } : {} })}
    />
  );
}
