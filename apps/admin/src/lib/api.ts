import type { ApiResponse, PaginationMeta } from '@food/shared-types';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
export const TOKEN_KEY = 'eo_admin_token';

/** A failed API call, normalised into something safe to show a person. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields: Record<string, string>;

  constructor(code: string, message: string, status = 0, fields: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

// ─── Token storage ──────────────────────────────────────────────────────────

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable — session lasts for this tab only */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

function handleUnauthorized() {
  tokenStore.clear();
  if (window.location.pathname.startsWith('/login')) return;
  const next = window.location.pathname + window.location.search;
  window.location.replace(`/login?expired=1&next=${encodeURIComponent(next)}`);
}

// ─── Request core ───────────────────────────────────────────────────────────

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

interface Envelope<T> {
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

const FRIENDLY_BY_STATUS: Record<number, string> = {
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  413: 'That file or request is too large.',
  429: 'Too many requests. Please wait a moment and try again.',
  502: 'The server had trouble completing that. Please try again.',
  503: 'The service is temporarily unavailable.',
};

function buildUrl(path: string, query?: Query) {
  const url = new URL(API_URL + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function extractFields(details: unknown): Record<string, string> {
  if (details && typeof details === 'object' && 'fields' in details) {
    const fields = (details as { fields?: unknown }).fields;
    if (fields && typeof fields === 'object') {
      return Object.fromEntries(
        Object.entries(fields as Record<string, unknown>).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string',
        ),
      );
    }
  }
  return {};
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<Envelope<T>> {
  const token = tokenStore.get();
  const headers: Record<string, string> = { Accept: 'application/json' };
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  if (opts.body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(
      'NETWORK_ERROR',
      "Can't reach the server. Check your connection or make sure the API is running.",
    );
  }

  let json: ApiResponse<T> | null = null;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    json = null;
  }

  if (res.status === 401 && token && !path.startsWith('/auth/login')) {
    handleUnauthorized();
  }

  if (!res.ok || !json || json.success === false) {
    const error = json && json.success === false ? json.error : null;
    throw new ApiError(
      error?.code ?? `HTTP_${res.status}`,
      error?.message ?? FRIENDLY_BY_STATUS[res.status] ?? 'Something went wrong. Please try again.',
      res.status,
      extractFields(error?.details),
    );
  }

  return { data: json.data, meta: json.meta, message: json.message };
}

// ─── Public client ──────────────────────────────────────────────────────────

export interface Page<T> {
  items: T[];
  meta: PaginationMeta;
}

export const api = {
  async get<T>(path: string, query?: Query, signal?: AbortSignal): Promise<T> {
    return (await request<T>(path, { query, signal })).data;
  },
  async page<T>(path: string, query?: Query, signal?: AbortSignal): Promise<Page<T>> {
    const { data, meta } = await request<T[]>(path, { query, signal });
    return {
      items: data,
      meta: meta ?? { page: 1, limit: data.length, total: data.length, totalPages: 1 },
    };
  },
  async post<T>(path: string, body?: unknown): Promise<T> {
    return (await request<T>(path, { method: 'POST', body })).data;
  },
  async patch<T>(path: string, body: unknown): Promise<T> {
    return (await request<T>(path, { method: 'PATCH', body })).data;
  },
  async del<T = null>(path: string): Promise<T> {
    return (await request<T>(path, { method: 'DELETE' })).data;
  },
};

/** Turns any thrown value into a sentence suitable for the UI. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

export function errorFields(err: unknown): Record<string, string> {
  return err instanceof ApiError ? err.fields : {};
}
