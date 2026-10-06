import express, { Router } from 'express';
import * as payments from '../controllers/payment.controller.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimit.js';

/** Mounted BEFORE express.json() so the signature is computed over the raw bytes. */
export const paymentWebhookRouter = Router();
paymentWebhookRouter.post('/webhook', express.raw({ type: 'application/json', limit: '1mb' }), payments.webhook);

export const paymentRouter = Router();
paymentRouter.use(requireAuth, paymentLimiter);
paymentRouter.post('/create-order', payments.createOrder);
paymentRouter.post('/retry', payments.retry);
paymentRouter.post('/verify', payments.verify);
paymentRouter.post('/failed', payments.failed);
// Simulated gateway for local development — never registered in production.
if (env.paymentsMock) paymentRouter.post('/mock/authorize', payments.mockAuthorize);
