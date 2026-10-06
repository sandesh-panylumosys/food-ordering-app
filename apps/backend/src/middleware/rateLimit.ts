import rateLimit from 'express-rate-limit';
import type { ApiFailure } from '@food/shared-types';
import { env } from '../config/env.js';

const limited = (message: string): ApiFailure => ({
  success: false,
  error: { code: 'RATE_LIMITED', message },
});

const base = {
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  skip: () => env.isTest,
};

export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: limited('Too many requests. Please slow down.'),
});

export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: limited('Too many sign-in attempts. Please try again in a few minutes.'),
});

export const paymentLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: limited('Too many payment attempts. Please try again shortly.'),
});
