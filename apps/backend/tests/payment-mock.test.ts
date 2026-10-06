import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

const customer = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Asha',
  email: 'asha@example.com',
  phone: null,
  role: 'CUSTOMER' as const,
  createdAt: new Date().toISOString(),
};
vi.mock('../src/services/user.service.js', () => ({
  USER_PUBLIC_COLUMNS: 'id, name, email, phone, role, created_at',
  findUserById: vi.fn(async (id: string) => (id === customer.id ? customer : null)),
  updateProfile: vi.fn(),
}));

async function bootApp() {
  const { createApp } = await import('../src/app.js');
  const { signToken } = await import('../src/utils/jwt.js');
  return { app: createApp(), token: signToken({ sub: customer.id, role: 'CUSTOMER' }) };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('mock payment provider', () => {
  it('refuses to boot in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PAYMENT_PROVIDER', 'mock');
    const exit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit ${code}`);
    }) as never);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(import('../src/config/env.js')).rejects.toThrow('exit 1');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('is not routable when the provider is razorpay, even for signed-in users', async () => {
    const { app, token } = await bootApp();
    const res = await request(app)
      .post('/api/payments/mock/authorize')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: crypto.randomUUID() });
    expect(res.status).toBe(404);
    const config = await request(app).get('/api/config');
    expect(config.body.data.paymentProvider).toBe('razorpay');
  });

  it('exposes the simulated gateway (auth required) in mock mode', async () => {
    vi.stubEnv('PAYMENT_PROVIDER', 'mock');
    const { app, token } = await bootApp();
    const config = await request(app).get('/api/config');
    expect(config.body.data).toMatchObject({ paymentsEnabled: true, paymentProvider: 'mock' });
    const anon = await request(app).post('/api/payments/mock/authorize').send({ orderId: crypto.randomUUID() });
    expect(anon.status).toBe(401);
    const invalid = await request(app)
      .post('/api/payments/mock/authorize')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: 'not-a-uuid' });
    expect(invalid.status).toBe(422);
  });
});
