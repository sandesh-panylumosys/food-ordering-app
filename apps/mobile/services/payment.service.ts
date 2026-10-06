import type { CheckoutSession, MockPaymentAuthorization, PaymentVerificationResult } from '@food/shared-types';
import type { CreateOrderInput, PaymentFailureInput, VerifyPaymentInput } from '@food/validation';
import { api } from '@/lib/api';

export const createCheckout = (input: CreateOrderInput) => api.post<CheckoutSession>('/payments/create-order', input);
export const retryCheckout = (orderId: string) => api.post<CheckoutSession>('/payments/retry', { orderId });
export const verifyPayment = (input: VerifyPaymentInput) =>
  api.post<PaymentVerificationResult>('/payments/verify', input);
export const reportPaymentFailure = (input: PaymentFailureInput) => api.post<null>('/payments/failed', input);

/** Local development only (backend PAYMENT_PROVIDER=mock): simulates the gateway's signed result. */
export const authorizeMockPayment = (orderId: string) =>
  api.post<MockPaymentAuthorization>('/payments/mock/authorize', { orderId });
