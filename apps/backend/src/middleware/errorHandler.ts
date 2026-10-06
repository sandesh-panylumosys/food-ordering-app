import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import type { ApiFailure } from '@food/shared-types';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.path} not found`));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof multer.MulterError) {
    appError = AppError.badRequest(
      err.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 5 MB' : err.message,
    );
  } else if (err?.type === 'entity.parse.failed') {
    appError = AppError.badRequest('Malformed JSON body');
  } else if (err?.type === 'entity.too.large') {
    appError = new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  } else {
    appError = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
  }

  if (appError.statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(`[${req.method} ${req.originalUrl}]`, err, appError.details ?? '');
  }

  const body: ApiFailure = {
    success: false,
    error: { code: appError.code, message: appError.message },
  };

  // Field-level validation details are safe to return; internal DB details are not
  // (except in development where they speed up debugging).
  if (appError.details !== undefined && (appError.statusCode < 500 || !env.isProduction)) {
    body.error.details = appError.details;
  }

  res.status(appError.statusCode).json(body);
};
