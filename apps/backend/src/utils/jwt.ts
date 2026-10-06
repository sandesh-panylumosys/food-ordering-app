import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UserRole } from '@food/shared-types';
import { env } from '../config/env.js';

const ISSUER = 'ember-oak-api';
const AUDIENCE = 'ember-oak-clients';

export interface TokenPayload {
  sub: string;
  role: UserRole;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign({ role: payload.role }, env.JWT_SECRET, {
    subject: payload.sub,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithm: 'HS256',
  });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ['HS256'],
  });
  if (typeof decoded === 'string' || !decoded.sub) throw new Error('Malformed token');
  return { sub: decoded.sub, role: decoded.role as UserRole };
}
