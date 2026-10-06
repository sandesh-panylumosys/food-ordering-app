import type { Response } from 'express';
import type { ApiSuccess, PaginationMeta } from '@food/shared-types';

export function ok<T>(res: Response, data: T, init: { status?: number; message?: string } = {}) {
  const body: ApiSuccess<T> = { success: true, data };
  if (init.message) body.message = init.message;
  return res.status(init.status ?? 200).json(body);
}

export function created<T>(res: Response, data: T, message?: string) {
  return ok(res, data, { status: 201, message });
}

export function paginated<T>(res: Response, items: T[], meta: PaginationMeta) {
  const body: ApiSuccess<T[]> = { success: true, data: items, meta };
  return res.status(200).json(body);
}

export function paginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export function range(page: number, limit: number): [number, number] {
  const from = (page - 1) * limit;
  return [from, from + limit - 1];
}
