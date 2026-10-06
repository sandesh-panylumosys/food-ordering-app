/**
 * End-to-end API check against a running backend + database.
 *
 *   pnpm --filter backend dev        # in one terminal
 *   pnpm --filter backend e2e        # in another
 *
 * Walks the full customer journey (register → browse → cart → pay → verify)
 * and the admin journey (dashboard → status updates → catalog CRUD).
 *
 * The Razorpay checkout UI can't be driven from a script, so the payment step
 * signs the verification payload with RAZORPAY_KEY_SECRET exactly as Razorpay
 * would — this exercises the real server-side signature check. Test the actual
 * Razorpay sheet from the mobile app with test-mode keys.
 */
import { createHmac, randomBytes } from 'node:crypto';
import type {
  AuthResponse,
  CartQuote,
  Category,
  CheckoutSession,
  DashboardStats,
  HomeFeed,
  Order,
  Product,
} from '@food/shared-types';

const API = process.env.E2E_API_URL ?? `http://localhost:${process.env.PORT ?? 5000}/api`;
const MOCK = process.env.PAYMENT_PROVIDER === 'mock';
const SECRET = process.env.RAZORPAY_KEY_SECRET;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

let passed = 0;
function check(condition: unknown, label: string): asserts condition {
  if (!condition) {
    console.error(`  ✗ ${label}`);
    throw new Error(`Check failed: ${label}`);
  }
  passed++;
  console.log(`  ✓ ${label}`);
}

interface Res<T> {
  status: number;
  body: { success: boolean; data: T; error?: { code: string; message: string }; meta?: { total: number } };
}

async function call<T = unknown>(method: string, path: string, opts: { token?: string; body?: unknown; raw?: string; headers?: Record<string, string> } = {}): Promise<Res<T>> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...opts.headers,
    },
    body: opts.raw ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  });
  return { status: res.status, body: (await res.json()) as Res<T>['body'] };
}

const sign = (orderId: string, paymentId: string) =>
  createHmac('sha256', SECRET!).update(`${orderId}|${paymentId}`).digest('hex');

async function main() {
  if ((!MOCK && !SECRET) || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      'Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (admin seeded) and either RAZORPAY_KEY_SECRET or PAYMENT_PROVIDER=mock.',
    );
  }
  console.log(`\nE2E against ${API}${MOCK ? ' (mock payment provider)' : ''}\n`);

  console.log('Health');
  const health = await call('GET', '/health');
  check(health.status === 200 && health.body.success, 'GET /health is running');

  console.log('\nAuth');
  const email = `e2e+${randomBytes(4).toString('hex')}@example.com`;
  const reg = await call<AuthResponse>('POST', '/auth/register', {
    body: { name: 'E2E Customer', email, password: 'Sup3rSecret!', phone: '9876543210' },
  });
  check(reg.status === 201 && reg.body.data.token, 'register customer');
  check(!('password_hash' in reg.body.data.user), 'password hash never returned');
  const dup = await call('POST', '/auth/register', { body: { name: 'Dup', email, password: 'Sup3rSecret!' } });
  check(dup.status === 409, 'duplicate email rejected');
  const badLogin = await call('POST', '/auth/login', { body: { email, password: 'wrong-password' } });
  check(badLogin.status === 401, 'wrong password rejected');
  const login = await call<AuthResponse>('POST', '/auth/login', { body: { email, password: 'Sup3rSecret!' } });
  check(login.status === 200, 'login customer');
  const token = login.body.data.token;
  const me = await call<AuthResponse['user']>('GET', '/auth/me', { token });
  check(me.body.data.email === email && me.body.data.role === 'CUSTOMER', 'GET /auth/me');

  console.log('\nCatalog');
  const home = await call<HomeFeed>('GET', '/home');
  check(home.body.data.categories.length > 0 && home.body.data.hero, 'home feed has hero + categories');
  const cats = await call<Category[]>('GET', '/categories');
  check(cats.body.data.length >= 6, `${cats.body.data.length} categories`);
  const pizza = await call<Product[]>('GET', '/products?category=pizza&limit=50');
  check(pizza.body.data.length > 0 && pizza.body.data.every((p) => p.category?.slug === 'pizza'), 'filter products by category slug');
  const search = await call<Product[]>('GET', '/products?search=truffle');
  check(search.body.data.some((p) => /truffle/i.test(p.name)), 'search by name');
  const catSearch = await call<Product[]>('GET', '/products?search=desserts');
  check(catSearch.body.data.some((p) => p.category?.slug === 'desserts'), 'search by category name');
  const paged = await call<Product[]>('GET', '/products?limit=5&page=2');
  check(paged.body.data.length === 5 && (paged.body.meta?.total ?? 0) > 10, 'pagination');

  const product = pizza.body.data.find((p) => p.customizations.length > 0)!;
  const detail = await call<Product>('GET', `/products/${product.id}`);
  check(detail.body.data.id === product.id, 'product detail by id');
  const bySlug = await call<Product>('GET', `/products/${product.slug}`);
  check(bySlug.body.data.id === product.id, 'product detail by slug');

  console.log('\nAuthorization');
  const forbidden = await call('GET', '/admin/dashboard', { token });
  check(forbidden.status === 403, 'customer cannot call admin APIs');
  const noAuth = await call('GET', '/orders');
  check(noAuth.status === 401, 'orders require authentication');

  console.log('\nAddress');
  const addr = await call<{ id: string; isDefault: boolean }>('POST', '/addresses', {
    token,
    body: { label: 'Home', recipientName: 'E2E Customer', phone: '9876543210', line1: '12 Lavelle Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001' },
  });
  check(addr.status === 201 && addr.body.data.isDefault, 'first address becomes default');
  const badAddr = await call('POST', '/addresses', { token, body: { label: 'X', postalCode: '12' } });
  check(badAddr.status === 422, 'invalid address rejected');

  console.log('\nCart & checkout');
  const size = product.customizations.find((g) => g.id === 'size')!;
  const large = size.options.find((o) => o.price > 0)!;
  const cart = [
    { productId: product.id, quantity: 2, selectedOptions: [{ groupId: 'size', optionIds: [large.id] }] },
    { productId: home.body.data.popular[0]!.id, quantity: 1, selectedOptions: [] as { groupId: string; optionIds: string[] }[] },
  ];
  // The second item may require options (e.g. coffee size/milk) — use the defaults the app would.
  const second = (await call<Product>('GET', `/products/${cart[1]!.productId}`)).body.data;
  cart[1]!.selectedOptions = second.customizations
    .filter((g) => g.required)
    .map((g) => ({ groupId: g.id, optionIds: [g.options[0]!.id] }));

  const quote = await call<CartQuote>('POST', '/cart/quote', { body: { items: cart } });
  const expectedLine = (product.price + large.price) * 2;
  check(quote.body.data.lines[0]!.lineTotal === expectedLine, `server prices customization (${expectedLine})`);
  check(quote.body.data.issues.length === 0, 'quote has no issues');

  const tampered = await call<CheckoutSession>('POST', '/payments/create-order', {
    token,
    body: { items: cart.map((c) => ({ ...c, price: 1 })), addressId: addr.body.data.id, total: 1 },
  });
  check(tampered.status === 201, 'create order (client price/total ignored)');
  const session = tampered.body.data;
  check(session.amountPaise === Math.round(quote.body.data.totals.total * 100), `amount computed server-side (₹${quote.body.data.totals.total})`);
  check(session.provider === (MOCK ? 'mock' : 'razorpay'), `checkout session uses the ${session.provider} provider`);
  if (!MOCK) {
    check(session.keyId.startsWith('rzp_'), 'returns public key id only');
    check(!JSON.stringify(session).includes(SECRET!), 'secret never leaves the server');
  }

  const pending = await call<Order>('GET', `/orders/${session.orderId}`, { token });
  check(pending.body.data.status === 'PENDING' && pending.body.data.paymentStatus === 'PENDING', 'order is PENDING before payment');

  console.log('\nPayment verification');
  // Real mode: sign like Razorpay does. Mock mode: the simulated gateway signs for us.
  let paymentId = `pay_${randomBytes(7).toString('hex')}`;
  let goodSignature = MOCK ? '' : sign(session.razorpayOrderId, paymentId);
  if (MOCK) {
    const auth = await call<{ razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }>(
      'POST',
      '/payments/mock/authorize',
      { token, body: { orderId: session.orderId } },
    );
    check(auth.status === 200 && auth.body.data.razorpayOrderId === session.razorpayOrderId, 'mock gateway authorizes the payment');
    paymentId = auth.body.data.razorpayPaymentId;
    goodSignature = auth.body.data.razorpaySignature;
  }
  const forged = await call('POST', '/payments/verify', {
    token,
    body: { orderId: session.orderId, razorpayOrderId: session.razorpayOrderId, razorpayPaymentId: paymentId, razorpaySignature: 'f'.repeat(64) },
  });
  check(forged.status === 400, 'forged signature rejected');
  const stillPending = await call<Order>('GET', `/orders/${session.orderId}`, { token });
  check(stillPending.body.data.paymentStatus !== 'PAID', 'order not marked paid after forged signature');

  const verifyBody = { orderId: session.orderId, razorpayOrderId: session.razorpayOrderId, razorpayPaymentId: paymentId, razorpaySignature: goodSignature };
  const verified = await call<{ order: Order }>('POST', '/payments/verify', { token, body: verifyBody });
  check(verified.status === 200, 'valid signature verified');
  check(verified.body.data.order.status === 'CONFIRMED' && verified.body.data.order.paymentStatus === 'PAID', 'order CONFIRMED + PAID');
  const again = await call<{ order: Order }>('POST', '/payments/verify', { token, body: verifyBody });
  check(again.status === 200 && again.body.data.order.statusHistory.length === 2, 'verify is idempotent');
  check(verified.body.data.order.items[0]!.unitPrice === product.price + large.price, 'order item stores purchase-time price');

  const otherUser = await call<AuthResponse>('POST', '/auth/register', {
    body: { name: 'Other', email: `e2e+${randomBytes(4).toString('hex')}@example.com`, password: 'Sup3rSecret!' },
  });
  const peek = await call('GET', `/orders/${session.orderId}`, { token: otherUser.body.data.token });
  check(peek.status === 404, "customers can't see other customers' orders");
  const cancelPaid = await call('POST', `/orders/${session.orderId}/cancel`, { token });
  check(cancelPaid.status === 400, 'customer cannot cancel a paid order');

  console.log('\nAdmin');
  const adminLogin = await call<AuthResponse>('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  check(adminLogin.status === 200 && adminLogin.body.data.user.role === 'ADMIN', 'admin login');
  const admin = adminLogin.body.data.token;

  const dash = await call<DashboardStats>('GET', '/admin/dashboard', { token: admin });
  check(dash.status === 200 && dash.body.data.totalOrders >= 1 && dash.body.data.salesByDay.length === 7, 'dashboard metrics');
  const adminOrders = await call<Order[]>('GET', `/admin/orders?search=${session.orderNumber}`, { token: admin });
  check(adminOrders.body.data[0]?.id === session.orderId && adminOrders.body.data[0]?.customer?.email === email, 'admin sees the order with customer details');
  const adminOrder = await call<Order>('GET', `/admin/orders/${session.orderId}`, { token: admin });
  check(adminOrder.body.data.payments?.[0]?.status === 'PAID', 'admin sees payment status');

  const skip = await call('PATCH', `/admin/orders/${session.orderId}/status`, { token: admin, body: { status: 'PENDING' } });
  check(skip.status === 400, 'invalid status transition rejected');
  for (const status of ['PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const) {
    const r = await call<Order>('PATCH', `/admin/orders/${session.orderId}/status`, { token: admin, body: { status } });
    check(r.status === 200 && r.body.data.status === status, `admin → ${status}`);
  }
  const custView = await call<Order>('GET', `/orders/${session.orderId}`, { token });
  check(custView.body.data.status === 'DELIVERED' && custView.body.data.statusHistory.length === 6, 'customer sees updated status + full timeline');
  const history = await call<Order[]>('GET', '/orders', { token });
  check(history.body.data.some((o) => o.id === session.orderId), 'order appears in customer history');

  console.log('\nAdmin catalog');
  const newCat = await call<Category>('POST', '/admin/categories', { token: admin, body: { name: `E2E Specials ${randomBytes(2).toString('hex')}`, sortOrder: 99 } });
  check(newCat.status === 201, 'create category');
  const newProd = await call<Product>('POST', '/admin/products', {
    token: admin,
    body: { categoryId: newCat.body.data.id, name: 'E2E Test Dish', shortDescription: 'Test', description: 'Created by e2e', price: 123.5, isVeg: true },
  });
  check(newProd.status === 201 && newProd.body.data.price === 123.5, 'create product');
  const blockedDelete = await call('DELETE', `/admin/categories/${newCat.body.data.id}`, { token: admin });
  check(blockedDelete.status === 409, 'cannot delete a category that has products');
  const edited = await call<Product>('PATCH', `/admin/products/${newProd.body.data.id}`, { token: admin, body: { price: 150, isAvailable: false } });
  check(edited.body.data.price === 150 && !edited.body.data.isAvailable, 'edit price + availability');
  const hidden = await call<Product[]>('GET', `/products?category=${newCat.body.data.slug}`);
  check(hidden.body.data.length === 0, 'unavailable product hidden from customers');
  const blockedQuote = await call<CartQuote>('POST', '/cart/quote', { body: { items: [{ productId: newProd.body.data.id, quantity: 1, selectedOptions: [] }] } });
  check(blockedQuote.body.data.issues[0]?.code === 'PRODUCT_UNAVAILABLE', 'quote flags unavailable product');
  const blockedOrder = await call('POST', '/payments/create-order', {
    token,
    body: { items: [{ productId: newProd.body.data.id, quantity: 1, selectedOptions: [] }], addressId: addr.body.data.id },
  });
  check(blockedOrder.status === 409, 'cannot order an unavailable product');
  const custCreate = await call('POST', '/admin/products', { token, body: {} });
  check(custCreate.status === 403, 'customer cannot create products');
  check((await call('DELETE', `/admin/products/${newProd.body.data.id}`, { token: admin })).status === 200, 'delete product');
  check((await call('DELETE', `/admin/categories/${newCat.body.data.id}`, { token: admin })).status === 200, 'delete empty category');

  if (process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.log('\nWebhook');
    const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: paymentId, order_id: session.razorpayOrderId, method: 'upi' } } } });
    const sig = createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
    const hook = await call('POST', '/payments/webhook', { raw, headers: { 'x-razorpay-signature': sig } });
    check(hook.status === 200, 'signed webhook accepted (idempotent)');
    const badHook = await call('POST', '/payments/webhook', { raw, headers: { 'x-razorpay-signature': 'bad' } });
    check(badHook.status === 400, 'unsigned webhook rejected');
  }

  console.log(`\n✅ ${passed} checks passed — order #${session.orderNumber}\n`);
}

main().catch((err: unknown) => {
  console.error(`\n❌ ${err instanceof Error ? err.message : String(err)} (after ${passed} passing checks)\n`);
  process.exit(1);
});
