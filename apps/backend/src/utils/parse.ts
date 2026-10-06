import type { z } from 'zod';
import { AppError } from './AppError.js';

/** Parses untrusted input with a Zod schema, throwing a 422 with field errors. */
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    fields[key] ??= issue.message;
  }
  const first = result.error.issues[0]?.message ?? 'Invalid request';
  throw AppError.validation(first, { fields });
}
