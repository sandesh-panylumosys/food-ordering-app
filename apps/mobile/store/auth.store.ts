import type { AuthResponse, User } from '@food/shared-types';
import { create } from 'zustand';
import { configureApi } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { secureToken } from '@/lib/storage';

type Status = 'loading' | 'authenticated' | 'guest';

interface AuthState {
  status: Status;
  token: string | null;
  user: User | null;
  /** Set when a request failed with an expired session, so the UI can explain. */
  sessionExpired: boolean;
  hydrate: () => Promise<void>;
  signIn: (auth: AuthResponse) => Promise<void>;
  setUser: (user: User) => void;
  signOut: (opts?: { expired?: boolean }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  token: null,
  user: null,
  sessionExpired: false,

  hydrate: async () => {
    const token = await secureToken.get().catch(() => null);
    if (!token) {
      set({ status: 'guest' });
      return;
    }
    set({ token });
    try {
      // Validate the stored token and refresh the profile.
      const { fetchMe } = await import('@/services/auth.service');
      const user = await fetchMe();
      set({ user, status: 'authenticated' });
    } catch (error) {
      const { NetworkError } = await import('@/lib/errors');
      if (error instanceof NetworkError) {
        // Offline at launch: keep the session; requests will retry later.
        set({ status: 'authenticated' });
      } else {
        await secureToken.clear();
        set({ token: null, user: null, status: 'guest' });
      }
    }
  },

  signIn: async ({ token, user }) => {
    await secureToken.set(token);
    set({ token, user, status: 'authenticated', sessionExpired: false });
  },

  setUser: (user) => set({ user }),

  signOut: async (opts) => {
    if (get().status === 'guest' && !get().token) return;
    await secureToken.clear();
    set({ token: null, user: null, status: 'guest', sessionExpired: Boolean(opts?.expired) });
    queryClient.removeQueries({ queryKey: ['orders'] });
    queryClient.removeQueries({ queryKey: ['order'] });
    queryClient.removeQueries({ queryKey: ['addresses'] });
  },
}));

configureApi({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => void useAuthStore.getState().signOut({ expired: true }),
});

export const useIsAuthenticated = () => useAuthStore((s) => s.status === 'authenticated');
