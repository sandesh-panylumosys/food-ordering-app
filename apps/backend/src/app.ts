import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { apiRouter } from './routes/index.js';
import { paymentWebhookRouter } from './routes/payment.routes.js';
import { AppError } from './utils/AppError.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Native mobile apps send no Origin header; browsers must be allow-listed.
        if (!origin || env.corsOrigins.includes(origin) || env.corsOrigins.includes('*')) cb(null, true);
        else cb(new AppError(403, 'CORS_BLOCKED', 'Origin not allowed'));
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    }),
  );
  if (!env.isTest) app.use(morgan(env.isProduction ? 'combined' : 'dev'));

  // Raw-body webhook must be registered before the JSON parser.
  app.use('/api/payments', paymentWebhookRouter);

  app.use(express.json({ limit: '200kb' }));
  app.use(express.urlencoded({ extended: false, limit: '200kb' }));

  app.get('/', (_req, res) => {
    res.json({ success: true, message: 'Ember & Oak API — see /api/health' });
  });
  app.use('/api', apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
