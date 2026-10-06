import { describe, expect, it } from 'vitest';
import { addressSchema, createOrderSchema, productSchema, registerSchema, updateOrderStatusSchema } from './index';

describe('registerSchema', () => {
  it('normalises email and trims names', () => {
    const r = registerSchema.parse({ name: '  Asha Rao ', email: ' Asha@Example.COM ', password: 'longenough' });
    expect(r).toMatchObject({ name: 'Asha Rao', email: 'asha@example.com' });
  });

  it('rejects short passwords and bad emails', () => {
    expect(registerSchema.safeParse({ name: 'A B', email: 'nope', password: 'short' }).success).toBe(false);
  });
});

describe('addressSchema', () => {
  const valid = {
    label: 'Home',
    recipientName: 'Asha',
    phone: '9876543210',
    line1: '12 Lavelle Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
  };

  it('accepts a valid address and nulls empty optionals', () => {
    expect(addressSchema.parse({ ...valid, line2: '' }).line2).toBeNull();
  });

  it('says "is required" for empty fields', () => {
    const r = addressSchema.safeParse({ ...valid, state: '' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe('State is required');
  });

  it('validates PIN codes', () => {
    expect(addressSchema.safeParse({ ...valid, postalCode: '5600' }).success).toBe(false);
  });
});

describe('createOrderSchema', () => {
  it('strips client-supplied prices and totals', () => {
    const r = createOrderSchema.parse({
      items: [{ productId: '55555555-5555-4555-8555-555555555555', quantity: 2, price: 1 }],
      addressId: '44444444-4444-4444-8444-444444444444',
      total: 1,
    });
    expect(r).not.toHaveProperty('total');
    expect(r.items[0]).not.toHaveProperty('price');
    expect(r.items[0]?.selectedOptions).toEqual([]);
  });

  it('caps quantities', () => {
    expect(
      createOrderSchema.safeParse({
        items: [{ productId: '55555555-5555-4555-8555-555555555555', quantity: 99 }],
        addressId: '44444444-4444-4444-8444-444444444444',
      }).success,
    ).toBe(false);
  });
});

describe('admin schemas', () => {
  it('coerces product numbers from form strings', () => {
    const p = productSchema.parse({
      categoryId: '66666666-6666-4666-8666-666666666666',
      name: 'Test Dish',
      shortDescription: 'Short',
      description: 'Longer description',
      price: '349.50',
    });
    expect(p.price).toBe(349.5);
    expect(p.isAvailable).toBe(true);
  });

  it('only accepts known order statuses', () => {
    expect(updateOrderStatusSchema.safeParse({ status: 'SHIPPED' }).success).toBe(false);
    expect(updateOrderStatusSchema.parse({ status: 'READY' }).note).toBeNull();
  });
});
