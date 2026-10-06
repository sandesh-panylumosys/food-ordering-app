import { BRAND } from '@food/config';
import { loginSchema } from '@food/validation';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../components/Button';
import { InlineAlert } from '../../components/EmptyState';
import { Input } from '../../components/Field';
import { Wordmark } from '../../components/Layout';
import { errorFields, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { zodFieldErrors, type FieldErrors } from '../../lib/forms';

/** Only allow same-app relative redirects. */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/login')) return '/';
  return next;
}

export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const expired = params.get('expired') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fields, setFields] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') return <Navigate to={next} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFields(zodFieldErrors(parsed.error));
      return;
    }
    setFields({});
    setSubmitting(true);
    try {
      await login(parsed.data);
      navigate(next, { replace: true });
    } catch (err) {
      setFields(errorFields(err));
      setFormError(errorMessage(err, "We couldn't sign you in. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-espresso p-10 lg:flex">
        <Wordmark />
        <div className="max-w-sm">
          <p className="font-display text-4xl leading-tight font-semibold text-cream">{BRAND.tagline}</p>
          <p className="mt-3 text-sm text-cream/60">
            Manage orders, the menu and categories for the café — all in one place.
          </p>
        </div>
        <div aria-hidden="true" className="absolute -right-24 -bottom-24 size-80 rounded-full bg-caramel/10" />
        <div aria-hidden="true" className="absolute -right-10 bottom-24 size-40 rounded-full bg-gold/10" />
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Wordmark tone="dark" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-espresso">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Use your admin account to continue.</p>

          {expired && !formError && (
            <InlineAlert tone="info" className="mt-5">
              Your session has expired. Please sign in again.
            </InlineAlert>
          )}
          {formError && <InlineAlert className="mt-5">{formError}</InlineAlert>}

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fields.email}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fields.password}
              required
            />
            <Button type="submit" className="w-full" loading={submitting}>
              Sign in
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
