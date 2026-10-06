import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { isValidPaymentSignature, isValidWebhookSignature } from '../src/services/payment.service.js';

const secret = 'razorpay-test-secret';

describe('Razorpay signature verification', () => {
  const orderId = 'order_ABC123';
  const paymentId = 'pay_XYZ789';
  const good = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

  it('accepts a correctly signed payment', () => {
    expect(isValidPaymentSignature(orderId, paymentId, good, secret)).toBe(true);
  });

  it('rejects a tampered payment id', () => {
    expect(isValidPaymentSignature(orderId, 'pay_OTHER', good, secret)).toBe(false);
  });

  it('rejects a signature made with a different secret', () => {
    const forged = createHmac('sha256', 'attacker').update(`${orderId}|${paymentId}`).digest('hex');
    expect(isValidPaymentSignature(orderId, paymentId, forged, secret)).toBe(false);
  });

  it('rejects malformed signatures without throwing', () => {
    expect(isValidPaymentSignature(orderId, paymentId, 'short', secret)).toBe(false);
  });

  it('verifies webhook bodies over the raw bytes', () => {
    const body = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
    const sig = createHmac('sha256', 'whsec').update(body).digest('hex');
    expect(isValidWebhookSignature(body, sig, 'whsec')).toBe(true);
    expect(isValidWebhookSignature(Buffer.from(`${body} `), sig, 'whsec')).toBe(false);
  });
});
