import type { AuthResponse, User } from '@food/shared-types';
import type { LoginInput } from '@food/validation';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, tokenStore } from './api';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'unreachable';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (input: LoginInput) => Promise<User>;
  logout: () => Promise<void>;
  /** Re-tries restoring the session after the API was unreachable. */
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_ADMIN = "This account doesn't have admin access.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStore.get() ? 'loading' : 'anonymous'));

  const [attempt, setAttempt] = useState(0);

  // Restore the session on first load (and on retry).
  useEffect(() => {
    if (!tokenStore.get()) return;
    const controller = new AbortController();
    setStatus('loading');
    api
      .get<User>('/auth/me', undefined, controller.signal)
      .then((me) => {
        if (me.role !== 'ADMIN') throw new ApiError('FORBIDDEN', NOT_ADMIN, 403);
        setUser(me);
        setStatus('authenticated');
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const transient = err instanceof ApiError && (err.status === 0 || err.status >= 500 || err.status === 429);
        if (transient) {
          // Keep the token: the API is down, not the session.
          setStatus('unreachable');
          return;
        }
        tokenStore.clear();
        setUser(null);
        setStatus('anonymous');
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const login = useCallback(async (input: LoginInput) => {
    const res = await api.post<AuthResponse>('/auth/login', input);
    if (res.user.role !== 'ADMIN') throw new ApiError('FORBIDDEN', NOT_ADMIN, 403);
    tokenStore.set(res.token);
    setUser(res.user);
    setStatus('authenticated');
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* stateless JWT — signing out locally is what matters */
    }
    tokenStore.clear();
    queryClient.clear();
    setUser(null);
    setStatus('anonymous');
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, status, login, logout, retry }),
    [user, status, login, logout, retry],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
