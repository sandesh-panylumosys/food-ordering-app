import type { z } from '@food/validation';

export type FieldErrors = Record<string, string>;

/** Flattens zod issues into the same `a.b.0.c` → message map the API returns. */
export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || '_';
    fields[key] ??= issue.message;
  }
  return fields;
}

/** Empty input → undefined; otherwise a number (NaN is left for zod to reject). */
export function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : Number(trimmed);
}

export function slugifyId(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

let seq = 0;
export const uid = () => `k${Date.now().toString(36)}${(seq++).toString(36)}`;
