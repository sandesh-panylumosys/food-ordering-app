import type { AuthResponse } from '@food/shared-types';
import { type Href, router } from 'expo-router';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/auth.store';

export function useAuthSuccess(returnTo?: string) {
  const signIn = useAuthStore((s) => s.signIn);
  return async (auth: AuthResponse) => {
    await signIn(auth);
    void queryClient.invalidateQueries();
    // Close the auth modal(s), then continue where the user was heading.
    router.dismissAll();
    if (returnTo) router.push(returnTo as Href);
  };
}
