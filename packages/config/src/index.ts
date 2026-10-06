/**
 * Business rules shared by every app. The backend is always authoritative —
 * clients use these only to *preview* prices so the numbers match.
 */
import type {
  CartSelection,
  CustomizationGroup,
  OrderStatus,
  OrderTotals,
  SelectedOption,
} from '@food/shared-types';

export const BRAND = {
  name: 'Ember & Oak',
  tagline: 'Slow food, made fresh.',
  supportEmail: 'hello@emberandoak.cafe',
} as const;

export const PRICING = {
  currency: 'INR',
  deliveryFee: 49,
  freeDeliveryThreshold: 599,
  taxRate: 0.05,
  maxItemQuantity: 20,
  maxCartLines: 30,
} as const;

export const PREP_TIME = { min: 25, max: 35 } as const;

export const toPaise = (rupees: number): number => Math.round(rupees * 100);
export const fromPaise = (paise: number): number => Math.round(paise) / 100;

export function calculateOrderTotals(subtotal: number, discount = 0): OrderTotals {
  const subtotalPaise = toPaise(subtotal);
  const discountPaise = Math.min(toPaise(discount), subtotalPaise);
  const taxable = subtotalPaise - discountPaise;
  const deliveryPaise =
    subtotalPaise === 0 || subtotal >= PRICING.freeDeliveryThreshold
      ? 0
      : toPaise(PRICING.deliveryFee);
  const taxPaise = Math.round(taxable * PRICING.taxRate);

  return {
    subtotal: fromPaise(subtotalPaise),
    deliveryFee: fromPaise(deliveryPaise),
    tax: fromPaise(taxPaise),
    discount: fromPaise(discountPaise),
    total: fromPaise(taxable + deliveryPaise + taxPaise),
  };
}

export type SelectionResult =
  | { ok: true; selectedOptions: SelectedOption[]; extraPrice: number }
  | { ok: false; error: string };

/** Validates a customer's customization choices against a product's groups. */
export function resolveSelections(
  groups: CustomizationGroup[],
  selections: CartSelection[],
): SelectionResult {
  const byGroup = new Map(selections.map((s) => [s.groupId, s.optionIds]));

  for (const groupId of byGroup.keys()) {
    if (!groups.some((g) => g.id === groupId)) {
      return { ok: false, error: 'Unknown customization selected' };
    }
  }

  const selectedOptions: SelectedOption[] = [];
  let extraPaise = 0;

  for (const group of groups) {
    const optionIds = [...new Set(byGroup.get(group.id) ?? [])];

    if (group.required && optionIds.length === 0) {
      return { ok: false, error: `Please choose a ${group.name.toLowerCase()}` };
    }
    if (group.type === 'single' && optionIds.length > 1) {
      return { ok: false, error: `Only one ${group.name.toLowerCase()} can be selected` };
    }
    if (group.type === 'multiple' && group.maxSelect && optionIds.length > group.maxSelect) {
      return { ok: false, error: `Choose up to ${group.maxSelect} for ${group.name.toLowerCase()}` };
    }

    for (const optionId of optionIds) {
      const option = group.options.find((o) => o.id === optionId);
      if (!option) return { ok: false, error: 'Selected option is no longer available' };
      extraPaise += toPaise(option.price);
      selectedOptions.push({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        price: option.price,
      });
    }
  }

  return { ok: true, selectedOptions, extraPrice: fromPaise(extraPaise) };
}

/** Pre-selects the first option of every required single-choice group. */
export function defaultSelections(groups: CustomizationGroup[]): CartSelection[] {
  return groups
    .filter((g) => g.required && g.type === 'single' && g.options.length > 0)
    .map((g) => ({ groupId: g.id, optionIds: [g.options[0]!.id] }));
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/** The happy-path sequence shown on the tracking timeline. */
export const ORDER_TIMELINE: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

/** Which statuses an admin may move an order to from its current status. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function formatPrice(amount: number): string {
  const hasPaise = Math.round(amount * 100) % 100 !== 0;
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
