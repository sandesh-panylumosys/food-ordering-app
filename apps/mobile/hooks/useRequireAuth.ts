import { type Href, router } from 'expo-router';
import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';

/** Runs `action` if signed in, otherwise opens sign-in and returns to `returnTo`. */
export function useRequireAuth() {
  const status = useAuthStore((s) => s.status);
  return useCallback(
    (action: () => void, returnTo?: string) => {
      if (status === 'authenticated') action();
      else router.push({ pathname: '/login', params: returnTo ? { returnTo } : {} } as Href);
    },
    [status],
  );
}
