import type { PostgrestError } from '@supabase/supabase-js';
import { AppError } from './AppError.js';

interface DbResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

/** Responses whose row type we assert via the generic (embedded selects). */
interface LooseResult {
  data: unknown;
  error: PostgrestError | null;
}

/** Unwraps a Supabase response, converting database errors into AppErrors. */
export function unwrap<T>(result: DbResult<T>, notFound?: string): T;
export function unwrap<T>(result: LooseResult, notFound?: string): T;
export function unwrap<T>({ data, error }: LooseResult, notFound?: string): T {
  if (error) throw toAppError(error);
  if (data === null || data === undefined) {
    if (notFound) throw AppError.notFound(notFound);
    throw new AppError(500, 'DB_ERROR', 'Unexpected empty database response');
  }
  return data as T;
}

/** Like unwrap but allows null (for maybeSingle). */
export function unwrapMaybe<T>(result: DbResult<T>): T | null;
export function unwrapMaybe<T>(result: LooseResult): T | null;
export function unwrapMaybe<T>({ data, error }: LooseResult): T | null {
  if (error) throw toAppError(error);
  return (data ?? null) as T | null;
}

export function toAppError(error: PostgrestError): AppError {
  switch (error.code) {
    case '23505':
      return AppError.conflict('A record with these details already exists');
    case '23503':
      return AppError.conflict('This record is referenced by other data and cannot be changed');
    case '22P02':
      return AppError.badRequest('Invalid identifier');
    case 'PGRST116':
      return AppError.notFound();
    default:
      return new AppError(500, 'DB_ERROR', 'A database error occurred', {
        dbCode: error.code,
        dbMessage: error.message,
      });
  }
}

/** Strips characters that have meaning in PostgREST filter syntax. */
export function sanitizeSearch(term: string): string {
  return term
    .replace(/[^\p{L}\p{N}\s'&-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}
