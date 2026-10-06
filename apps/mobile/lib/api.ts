import type { ApiResponse, PaginationMeta } from '@food/shared-types';
import { API_URL, REQUEST_TIMEOUT_MS } from '@/constants/config';
import { ApiError, NetworkError } from './errors';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

let tokenGetter: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

/** Wired up by the auth store so the client stays framework-agnostic. */
export function configureApi(opts: { getToken: () => string | null; onUnauthorized: () => void }) {
  tokenGetter = opts.getToken;
  onUnauthorized = opts.onUnauthorized;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return params ? `${url}?${params}` : url;
}

async function send<T>(path: string, opts: RequestOptions = {}): Promise<{ data: T; meta?: PaginationMeta }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  opts.signal?.addEventListener('abort', () => controller.abort());

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenGetter();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (opts.signal?.aborted) throw err;
    throw new NetworkError(
      controller.signal.aborted ? 'The request timed out. Please check your connection.' : undefined,
    );
  } finally {
    clearTimeout(timeout);
  }

  let json: ApiResponse<T> | null = null;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    // Non-JSON response (proxy error page etc.)
  }

  if (!json || !json.success) {
    const body = json && !json.success ? json.error : { code: 'INTERNAL_ERROR', message: 'Unexpected response' };
    const error = new ApiError(response.status, body);
    if (response.status === 401 && token) onUnauthorized();
    throw error;
  }

  return { data: json.data, meta: json.meta };
}

export const api = {
  get: async <T>(path: string, query?: RequestOptions['query'], signal?: AbortSignal) =>
    (await send<T>(path, { query, signal })).data,
  getPage: <T>(path: string, query?: RequestOptions['query'], signal?: AbortSignal) =>
    send<T[]>(path, { query, signal }) as Promise<{ data: T[]; meta: PaginationMeta }>,
  post: async <T>(path: string, body?: unknown) => (await send<T>(path, { method: 'POST', body: body ?? {} })).data,
  patch: async <T>(path: string, body: unknown) => (await send<T>(path, { method: 'PATCH', body })).data,
  delete: async <T>(path: string) => (await send<T>(path, { method: 'DELETE' })).data,
};
