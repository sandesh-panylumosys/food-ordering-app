import { useState } from 'react';
import type { z } from '@food/validation';
import { ApiError } from '@/lib/errors';

/** Minimal form helper that validates with the same Zod schemas as the API. */
export function useZodForm<S extends z.ZodObject>(schema: S, initial: z.input<S>) {
  const [values, setValues] = useState<z.input<S>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof z.input<S>>(key: K, value: z.input<S>[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: '' }));
  };

  const validate = (): z.output<S> | null => {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return result.data;
    }
    const next: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? '_');
      next[key] ??= issue.message;
    }
    setErrors(next);
    return null;
  };

  /** Maps API field errors (422) back onto inputs. Returns true if any were applied. */
  const applyApiError = (error: unknown): boolean => {
    if (error instanceof ApiError && Object.keys(error.fields).length) {
      setErrors(error.fields);
      return true;
    }
    return false;
  };

  return { values, errors, set, validate, applyApiError, setValues };
}
