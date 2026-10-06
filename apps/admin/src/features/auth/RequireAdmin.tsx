import { Navigate, Outlet, useLocation } from 'react-router';
import { Button } from '../../components/Button';
import { IconAlert } from '../../components/Icons';
import { FullPageSpinner } from '../../components/Spinner';
import { useAuth } from '../../lib/auth';

export function RequireAdmin() {
  const { status, retry, logout } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner label="Checking your session" />;

  if (status === 'unreachable') {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="max-w-sm rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
          <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <IconAlert />
          </span>
          <h1 className="text-lg font-bold text-espresso">Can't reach the server</h1>
          <p className="mt-1 text-sm text-muted">
            The API isn't responding right now. Check that it's running, then try again.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => void logout()}>
              Sign out
            </Button>
            <Button onClick={retry}>Try again</Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'anonymous') {
    const next = location.pathname + location.search;
    return <Navigate to={next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Outlet />;
}
