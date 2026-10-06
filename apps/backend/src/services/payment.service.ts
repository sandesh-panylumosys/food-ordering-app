import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { BRAND, toPaise } from '@food/config';
import type { CheckoutSession, MockPaymentAuthorization, Order, PaymentProvider, User } from '@food/shared-types';
import type { CreateOrderInput, PaymentFailureInput, VerifyPaymentInput } from '@food/validation';
import { env } from '../config/env.js';
import { razorpay } from '../config/razorpay.js';
import { supabase } from '../config/supabase.js';
import type { PaymentRow } from '../types/db.js';
import { AppError } from '../utils/AppError.js';
import { unwrap, unwrapMaybe } from '../utils/db.js';
import { getOwnedAddress } from './address.service.js';
import { getOrder, getOrderRow } from './order.service.js';
import { priceCart } from './pricing.service.js';

interface PaymentGateway {
  provider: PaymentProvider;
  keyId: string;
  keySecret: string;
  createOrder(input: { amountPaise: number; receipt: string; notes: Record<string, string> }): Promise<string>;
}

/** Per-boot secret for the mock gateway; signing and verification happen in this process. */
const MOCK_SECRET = randomBytes(32).toString('hex');

const mockGateway: PaymentGateway = {
  provider: 'mock',
  keyId: 'mock_key_local_dev',
  keySecret: MOCK_SECRET,
  createOrder: async () => `order_mock_${randomBytes(7).toString('hex')}`,
};

/** The active payment gateway. Mock mode exists for local development only (blocked in production by env validation). */
function gateway(): PaymentGateway {
  if (env.paymentsMock) return mockGateway;
  if (!razorpay || !env.RAZORPAY_KEY_SECRET || !env.RAZORPAY_KEY_ID) {
    throw AppError.unavailable('Online payments are temporarily unavailable. Please try again later.');
  }
  const client = razorpay;
  return {
    provider: 'razorpay',
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
    createOrder: async ({ amountPaise, receipt, notes }) =>
      (await client.orders.create({ amount: amountPaise, currency: 'INR', receipt, notes })).id,
  };
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Razorpay checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function isValidPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return safeEqualHex(expected, signature);
}

/** Razorpay webhook signature: HMAC_SHA256(raw_body, webhook_secret). */
export function isValidWebhookSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}

function checkoutSession(
  order: { id: string; orderNumber: number },
  payment: { razorpayOrderId: string; amountPaise: number; currency: string },
  user: User,
  phone: string,
  gw: PaymentGateway,
): CheckoutSession {
  return {
    provider: gw.provider,
    orderId: order.id,
    orderNumber: order.orderNumber,
    razorpayOrderId: payment.razorpayOrderId,
    amountPaise: payment.amountPaise,
    currency: payment.currency,
    keyId: gw.keyId,
    businessName: BRAND.name,
    description: `Order #${order.orderNumber}`,
    prefill: { name: user.name, email: user.email, contact: phone },
  };
}

/**
 * 1. validate address + cart, 2. price everything server-side, 3. create the
 * Razorpay order, 4. persist order + items + payment atomically.
 */
export async function createCheckout(user: User, input: CreateOrderInput): Promise<CheckoutSession> {
  const gw = gateway();

  const address = await getOwnedAddress(user.id, input.addressId);
  const { lines, totals } = await priceCart(input.items);
  const amountPaise = toPaise(totals.total);
  if (amountPaise < 100) throw AppError.badRequest('Order total must be at least ₹1');

  const orderId = randomUUID();

  let razorpayOrderId: string;
  try {
    razorpayOrderId = await gw.createOrder({
      amountPaise,
      receipt: orderId.replace(/-/g, '').slice(0, 32),
      notes: { orderId, userId: user.id },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Razorpay order creation failed', err);
    throw new AppError(502, 'PAYMENT_INIT_FAILED', 'We could not start the payment. Please try again.');
  }

  const created = unwrap<{ id: string; order_number: number }[]>(
    await supabase.rpc('create_order', {
      p_order_id: orderId,
      p_user_id: user.id,
      p_address: {
        label: address.label,
        recipientName: address.recipient_name,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        postalCode: address.postal_code,
      },
      p_notes: input.notes,
      p_subtotal: totals.subtotal,
      p_delivery_fee: totals.deliveryFee,
      p_tax: totals.tax,
      p_discount: totals.discount,
      p_total: totals.total,
      p_currency: 'INR',
      p_items: lines,
      p_razorpay_order_id: razorpayOrderId,
      p_amount_paise: amountPaise,
    }),
  );
  const orderNumber = Number(created[0]?.order_number);

  return checkoutSession(
    { id: orderId, orderNumber },
    { razorpayOrderId, amountPaise, currency: 'INR' },
    user,
    address.phone,
    gw,
  );
}

/** Re-opens checkout for an unpaid order (Razorpay orders accept multiple attempts). */
export async function retryCheckout(user: User, orderId: string): Promise<CheckoutSession> {
  const gw = gateway();
  const order = await getOrderRow(orderId, { userId: user.id });

  if (order.payment_status === 'PAID') throw AppError.conflict('This order has already been paid');
  if (order.status !== 'PENDING') throw AppError.badRequest('This order can no longer be paid');

  const payment = [...(order.payments ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!payment) throw AppError.notFound('Payment');

  return checkoutSession(
    { id: order.id, orderNumber: order.order_number },
    { razorpayOrderId: payment.razorpay_order_id, amountPaise: payment.amount_paise, currency: payment.currency },
    user,
    order.delivery_address.phone,
    gw,
  );
}

async function findPayment(razorpayOrderId: string): Promise<PaymentRow | null> {
  return unwrapMaybe<PaymentRow>(
    await supabase.from('payments').select('*').eq('razorpay_order_id', razorpayOrderId).maybeSingle(),
  );
}

async function fetchPaymentMethod(paymentId: string): Promise<string | null> {
  if (env.paymentsMock) return 'mock';
  if (!razorpay) return null;
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return typeof payment.method === 'string' ? payment.method : null;
  } catch {
    return null;
  }
}

/**
 * Verifies the checkout signature server-side before marking the order paid.
 * The client's "success" callback alone is never trusted.
 */
export async function verifyPayment(user: User, input: VerifyPaymentInput): Promise<Order> {
  const gw = gateway();

  const payment = await findPayment(input.razorpayOrderId);
  if (!payment || payment.order_id !== input.orderId) throw AppError.notFound('Payment');

  // Ownership check: throws 404 if the order belongs to someone else.
  await getOrderRow(input.orderId, { userId: user.id });

  const valid = isValidPaymentSignature(
    input.razorpayOrderId,
    input.razorpayPaymentId,
    input.razorpaySignature,
    gw.keySecret,
  );
  if (!valid) {
    throw new AppError(400, 'PAYMENT_VERIFICATION_FAILED', 'We could not verify your payment. If money was deducted, it will be refunded automatically.');
  }

  const method = await fetchPaymentMethod(input.razorpayPaymentId);
  unwrapMaybe(
    await supabase.rpc('mark_order_paid', {
      p_razorpay_order_id: input.razorpayOrderId,
      p_razorpay_payment_id: input.razorpayPaymentId,
      p_signature: input.razorpaySignature,
      p_method: method,
    }),
  );

  return getOrder(input.orderId, { userId: user.id });
}

/**
 * MOCK PROVIDER ONLY — plays the role of the Razorpay checkout sheet: returns a
 * signed payment result that the client then submits to /payments/verify, so
 * the real verification + confirmation path still runs.
 */
export async function authorizeMockPayment(user: User, orderId: string): Promise<MockPaymentAuthorization> {
  if (!env.paymentsMock) throw AppError.notFound('Route');
  const order = await getOrderRow(orderId, { userId: user.id });
  if (order.payment_status === 'PAID') throw AppError.conflict('This order has already been paid');
  if (order.status !== 'PENDING') throw AppError.badRequest('This order can no longer be paid');

  const payment = [...(order.payments ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!payment) throw AppError.notFound('Payment');

  const razorpayPaymentId = `pay_mock_${randomBytes(7).toString('hex')}`;
  const razorpaySignature = createHmac('sha256', mockGateway.keySecret)
    .update(`${payment.razorpay_order_id}|${razorpayPaymentId}`)
    .digest('hex');
  return { razorpayOrderId: payment.razorpay_order_id, razorpayPaymentId, razorpaySignature };
}

export async function recordPaymentFailure(user: User, input: PaymentFailureInput): Promise<void> {
  const payment = await findPayment(input.razorpayOrderId);
  if (!payment || payment.order_id !== input.orderId) throw AppError.notFound('Payment');
  await getOrderRow(input.orderId, { userId: user.id });

  unwrapMaybe(
    await supabase.rpc('mark_payment_failed', {
      p_razorpay_order_id: input.razorpayOrderId,
      p_razorpay_payment_id: input.razorpayPaymentId ?? null,
      p_error_code: input.code ?? 'PAYMENT_CANCELLED',
      p_error_description: input.description ?? 'Payment was cancelled',
    }),
  );
}

interface RazorpayWebhookEvent {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id: string;
        order_id: string;
        method?: string;
        error_code?: string | null;
        error_description?: string | null;
      };
    };
  };
}

/**
 * Safety net for when the app closes before calling /verify: Razorpay notifies
 * us directly. Configure the webhook URL + secret in the Razorpay dashboard.
 */
export async function handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<void> {
  if (!env.RAZORPAY_WEBHOOK_SECRET) throw AppError.unavailable('Webhook not configured');
  if (!signature || !isValidWebhookSignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET)) {
    throw new AppError(400, 'INVALID_SIGNATURE', 'Invalid webhook signature');
  }

  const event = JSON.parse(rawBody.toString('utf8')) as RazorpayWebhookEvent;
  const entity = event.payload?.payment?.entity;
  if (!entity?.order_id) return;

  const payment = await findPayment(entity.order_id);
  if (!payment) return; // Not one of ours.

  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    unwrapMaybe(
      await supabase.rpc('mark_order_paid', {
        p_razorpay_order_id: entity.order_id,
        p_razorpay_payment_id: entity.id,
        p_signature: null,
        p_method: entity.method ?? null,
      }),
    );
  } else if (event.event === 'payment.failed') {
    unwrapMaybe(
      await supabase.rpc('mark_payment_failed', {
        p_razorpay_order_id: entity.order_id,
        p_razorpay_payment_id: entity.id,
        p_error_code: entity.error_code ?? 'PAYMENT_FAILED',
        p_error_description: entity.error_description ?? 'Payment failed',
      }),
    );
  }
}
