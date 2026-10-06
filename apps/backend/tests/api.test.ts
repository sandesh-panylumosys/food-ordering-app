import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@food/shared-types';

// The DB is mocked: these tests cover HTTP wiring, validation and authorization.
const users = new Map<string, User>();
vi.mock('../src/services/user.service.js', () => ({
  USER_PUBLIC_COLUMNS: 'id, name, email, phone, role, created_at',
  findUserById: vi.fn(async (id: string) => users.get(id) ?? null),
  updateProfile: vi.fn(),
}));
vi.mock('../src/services/dashboard.service.js', () => ({
  getDashboardStats: vi.fn(async () => ({ totalOrders: 3 })),
}));

const { createApp } = await import('../src/app.js');
const { signToken } = await import('../src/utils/jwt.js');

const app = createApp();
const customer: User = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Asha',
  email: 'asha@example.com',
  phone: null,
  role: 'CUSTOMER',
  createdAt: new Date().toISOString(),
};
const admin: User = { ...customer, id: '22222222-2222-4222-8222-222222222222', role: 'ADMIN' };
const tokenFor = (u: User) => signToken({ sub: u.id, role: u.role });

beforeEach(() => {
  users.clear();
  users.set(customer.id, customer);
  users.set(admin.id, admin);
});

describe('health', () => {
  it('reports the API is running', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'API is running' });
  });

  it('returns a structured 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});

describe('authentication', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects forged tokens', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('SESSION_EXPIRED');
  });

  it('returns the current user for a valid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(customer.email);
  });

  it('rejects tokens for deleted users', async () => {
    const token = tokenFor(customer);
    users.delete(customer.id);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('validates registration input before touching the database', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'bad', password: '1' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.fields).toHaveProperty('email');
    expect(res.body.error.details.fields).toHaveProperty('password');
  });
});

describe('role-based authorization', () => {
  it('blocks customers from admin APIs', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);
    expect(res.status).toBe(403);
  });

  it('blocks customers from changing order status', async () => {
    const res = await request(app)
      .patch('/api/orders/33333333-3333-4333-8333-333333333333/status')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ status: 'DELIVERED' });
    expect(res.status).toBe(403);
  });

  it('ignores a forged ADMIN role claim (role is loaded from the DB)', async () => {
    const forged = signToken({ sub: customer.id, role: 'ADMIN' });
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(403);
  });

  it('allows admins', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalOrders).toBe(3);
  });
});

describe('payments', () => {
  it('requires authentication to create an order', async () => {
    const res = await request(app).post('/api/payments/create-order').send({});
    expect(res.status).toBe(401);
  });

  it('rejects an empty cart', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ items: [], addressId: '44444444-4444-4444-8444-444444444444' });
    expect(res.status).toBe(422);
  });

  it('never accepts client-supplied prices (unknown keys are stripped)', async () => {
    const { createOrderSchema } = await import('@food/validation');
    const parsed = createOrderSchema.parse({
      items: [{ productId: '55555555-5555-4555-8555-555555555555', quantity: 1, price: 1 }],
      addressId: '44444444-4444-4444-8444-444444444444',
      total: 1,
    });
    expect(parsed).not.toHaveProperty('total');
    expect(parsed.items[0]).not.toHaveProperty('price');
  });

  it('rejects webhooks with a bad signature', async () => {
    const res = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'bad')
      .send(JSON.stringify({ event: 'payment.captured' }));
    expect([400, 503]).toContain(res.status);
  });
});
