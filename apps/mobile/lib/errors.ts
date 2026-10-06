import type { ApiErrorBody } from '@food/shared-types';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields: Record<string, string>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    const details = body.details as { fields?: Record<string, string> } | undefined;
    this.fields = details?.fields ?? {};
  }
}

export class NetworkError extends Error {
  constructor(message = 'You appear to be offline. Check your connection and try again.') {
    super(message);
    this.name = 'NetworkError';
  }
}

const FRIENDLY: Record<string, string> = {
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again.',
  DB_ERROR: 'Something went wrong on our side. Please try again.',
  SERVICE_UNAVAILABLE: 'This service is temporarily unavailable. Please try again shortly.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
  ROUTE_NOT_FOUND: 'Something went wrong. Please update the app and try again.',
};

/** Converts any thrown value into a message that is safe to show customers. */
export function friendlyMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof NetworkError) return error.message;
  if (error instanceof ApiError) {
    if (error.status >= 500) return FRIENDLY[error.code] ?? FRIENDLY.INTERNAL_ERROR!;
    return FRIENDLY[error.code] ?? error.message;
  }
  return fallback;
}

export const isApiError = (e: unknown, code?: string): e is ApiError =>
  e instanceof ApiError && (!code || e.code === code);
