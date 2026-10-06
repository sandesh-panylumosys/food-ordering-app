import { Router } from 'express';
import { env } from '../config/env.js';
import { ok } from '../utils/response.js';
import { addressRouter } from './address.routes.js';
import { adminRouter } from './admin.routes.js';
import { authRouter } from './auth.routes.js';
import { catalogRouter } from './catalog.routes.js';
import { orderRouter } from './order.routes.js';
import { paymentRouter } from './payment.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

apiRouter.get('/config', (_req, res) => {
  // Public, non-secret client configuration.
  ok(res, {
    paymentsEnabled: env.paymentsMock || env.razorpayEnabled,
    paymentProvider: env.paymentsMock ? 'mock' : 'razorpay',
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/', catalogRouter);
apiRouter.use('/addresses', addressRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/admin', adminRouter);
