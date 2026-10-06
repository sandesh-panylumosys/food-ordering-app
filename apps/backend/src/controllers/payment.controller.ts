import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth.js';
import * as paymentService from '../services/payment.service.js';
import {
  createOrderSchema,
  mockAuthorizeSchema,
  paymentFailureSchema,
  retryPaymentSchema,
  verifyPaymentSchema,
} from '../validations/index.js';
import { created, ok } from '../utils/response.js';
import { parse } from '../utils/parse.js';

export async function createOrder(req: Request, res: Response) {
  const session = await paymentService.createCheckout(currentUser(req), parse(createOrderSchema, req.body));
  created(res, session);
}

export async function retry(req: Request, res: Response) {
  const { orderId } = parse(retryPaymentSchema, req.body);
  ok(res, await paymentService.retryCheckout(currentUser(req), orderId));
}

export async function verify(req: Request, res: Response) {
  const order = await paymentService.verifyPayment(currentUser(req), parse(verifyPaymentSchema, req.body));
  ok(res, { order }, { message: 'Payment verified' });
}

/** Mock provider only (local development). */
export async function mockAuthorize(req: Request, res: Response) {
  const { orderId } = parse(mockAuthorizeSchema, req.body);
  ok(res, await paymentService.authorizeMockPayment(currentUser(req), orderId));
}

export async function failed(req: Request, res: Response) {
  await paymentService.recordPaymentFailure(currentUser(req), parse(paymentFailureSchema, req.body));
  ok(res, null);
}

export async function webhook(req: Request, res: Response) {
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
  await paymentService.handleWebhook(raw, req.header('x-razorpay-signature'));
  ok(res, null);
}
