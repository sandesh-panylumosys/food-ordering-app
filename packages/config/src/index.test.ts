import { describe, expect, it } from 'vitest';
import type { CustomizationGroup } from '@food/shared-types';
import { calculateOrderTotals, canTransition, defaultSelections, formatPrice, resolveSelections } from './index';

describe('calculateOrderTotals', () => {
  it('adds delivery and 5% tax below the free-delivery threshold', () => {
    expect(calculateOrderTotals(349)).toEqual({
      subtotal: 349,
      deliveryFee: 49,
      tax: 17.45,
      discount: 0,
      total: 415.45,
    });
  });

  it('waives delivery at the threshold', () => {
    expect(calculateOrderTotals(599).deliveryFee).toBe(0);
  });

  it('avoids floating point drift', () => {
    expect(calculateOrderTotals(0.1 + 0.2).subtotal).toBe(0.3);
  });
});

const groups: CustomizationGroup[] = [
  {
    id: 'size',
    name: 'Size',
    type: 'single',
    required: true,
    options: [
      { id: 's', name: 'Small', price: 0 },
      { id: 'l', name: 'Large', price: 40 },
    ],
  },
  {
    id: 'extras',
    name: 'Extras',
    type: 'multiple',
    required: false,
    maxSelect: 2,
    options: [
      { id: 'a', name: 'A', price: 10 },
      { id: 'b', name: 'B', price: 20.5 },
      { id: 'c', name: 'C', price: 5 },
    ],
  },
];

describe('resolveSelections', () => {
  it('prices valid selections', () => {
    const r = resolveSelections(groups, [
      { groupId: 'size', optionIds: ['l'] },
      { groupId: 'extras', optionIds: ['a', 'b'] },
    ]);
    expect(r).toMatchObject({ ok: true, extraPrice: 70.5 });
  });

  it('requires required groups', () => {
    expect(resolveSelections(groups, []).ok).toBe(false);
  });

  it('enforces single choice and max selections', () => {
    expect(resolveSelections(groups, [{ groupId: 'size', optionIds: ['s', 'l'] }]).ok).toBe(false);
    expect(
      resolveSelections(groups, [
        { groupId: 'size', optionIds: ['s'] },
        { groupId: 'extras', optionIds: ['a', 'b', 'c'] },
      ]).ok,
    ).toBe(false);
  });

  it('rejects unknown groups and options', () => {
    expect(resolveSelections(groups, [{ groupId: 'size', optionIds: ['xl'] }]).ok).toBe(false);
    expect(resolveSelections(groups, [{ groupId: 'evil', optionIds: ['a'] }]).ok).toBe(false);
  });

  it('builds sensible defaults', () => {
    expect(defaultSelections(groups)).toEqual([{ groupId: 'size', optionIds: ['s'] }]);
  });
});

describe('order status transitions', () => {
  it('allows the happy path and blocks going backwards', () => {
    expect(canTransition('CONFIRMED', 'PREPARING')).toBe(true);
    expect(canTransition('DELIVERED', 'PENDING')).toBe(false);
    expect(canTransition('CANCELLED', 'CONFIRMED')).toBe(false);
  });
});

describe('formatPrice', () => {
  it('formats rupees', () => {
    expect(formatPrice(349)).toBe('₹349');
    expect(formatPrice(415.45)).toBe('₹415.45');
    expect(formatPrice(1299)).toBe('₹1,299');
  });
});
