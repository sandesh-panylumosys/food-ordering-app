import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@food/shared-types';
import { AppError } from '../utils/AppError.js';
import { verifyToken } from '../utils/jwt.js';
import { findUserById } from '../services/user.service.js';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

/** Verifies the JWT and loads the user fresh from the DB (so role changes apply immediately). */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) throw AppError.unauthorized();

  let userId: string;
  try {
    userId = verifyToken(token).sub;
  } catch {
    throw new AppError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
  }

  const user = await findUserById(userId);
  if (!user) throw new AppError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');

  req.user = user;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();
    if (!roles.includes(req.user.role)) throw AppError.forbidden();
    next();
  };
}

/** Narrowing helper for controllers mounted behind requireAuth. */
export function currentUser(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}
