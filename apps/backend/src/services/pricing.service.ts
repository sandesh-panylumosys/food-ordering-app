import { calculateOrderTotals, fromPaise, PRICING, resolveSelections, toPaise } from '@food/config';
import type { CartItemInput, CartQuote, OrderTotals, QuoteIssue, SelectedOption } from '@food/shared-types';
import type { ProductRow } from '../types/db.js';
import { AppError } from '../utils/AppError.js';
import { getProductsByIds } from './product.service.js';

export interface PricedLine {
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  is_veg: boolean;
  unit_price: number;
  quantity: number;
  selected_options: SelectedOption[];
  line_total: number;
}

export interface OrderDraft {
  lines: PricedLine[];
  totals: OrderTotals;
}

type LineResult = { ok: true; line: PricedLine; linePaise: number } | { ok: false; issue: QuoteIssue };

function priceLine(product: ProductRow | undefined, item: CartItemInput): LineResult {
  if (!product) {
    return {
      ok: false,
      issue: { productId: item.productId, code: 'PRODUCT_UNAVAILABLE', message: 'This item is no longer on the menu' },
    };
  }
  if (!product.is_available || product.category?.is_active === false) {
    return {
      ok: false,
      issue: { productId: product.id, code: 'PRODUCT_UNAVAILABLE', message: `${product.name} is currently unavailable` },
    };
  }
  if (item.quantity < 1 || item.quantity > PRICING.maxItemQuantity) {
    return {
      ok: false,
      issue: {
        productId: product.id,
        code: 'INVALID_QUANTITY',
        message: `Quantity for ${product.name} must be between 1 and ${PRICING.maxItemQuantity}`,
      },
    };
  }

  const selection = resolveSelections(product.customizations ?? [], item.selectedOptions ?? []);
  if (!selection.ok) {
    return {
      ok: false,
      issue: { productId: product.id, code: 'INVALID_CUSTOMIZATION', message: `${product.name}: ${selection.error}` },
    };
  }

  const unitPaise = toPaise(Number(product.price)) + toPaise(selection.extraPrice);
  const linePaise = unitPaise * item.quantity;
  return {
    ok: true,
    linePaise,
    line: {
      product_id: product.id,
      product_name: product.name,
      product_image_url: product.image_url,
      is_veg: product.is_veg,
      unit_price: fromPaise(unitPaise),
      quantity: item.quantity,
      selected_options: selection.selectedOptions,
      line_total: fromPaise(linePaise),
    },
  };
}

async function priceAll(items: CartItemInput[]) {
  const products = await getProductsByIds([...new Set(items.map((i) => i.productId))]);
  const byId = new Map(products.map((p) => [p.id, p]));
  return items.map((item) => priceLine(byId.get(item.productId), item));
}

/**
 * Re-prices a cart entirely from the database for order creation. Client-sent
 * prices are never accepted — only product ids, quantities and option ids.
 */
export async function priceCart(items: CartItemInput[]): Promise<OrderDraft> {
  if (items.length === 0) throw AppError.badRequest('Your cart is empty');

  const lines: PricedLine[] = [];
  let subtotalPaise = 0;
  for (const result of await priceAll(items)) {
    if (!result.ok) {
      throw new AppError(409, result.issue.code, result.issue.message, { productId: result.issue.productId });
    }
    lines.push(result.line);
    subtotalPaise += result.linePaise;
  }
  return { lines, totals: calculateOrderTotals(fromPaise(subtotalPaise)) };
}

/** Lenient pricing preview for the cart/checkout screens: reports issues per line. */
export async function quoteCart(items: CartItemInput[]): Promise<CartQuote> {
  const quote: CartQuote = { lines: [], issues: [], totals: calculateOrderTotals(0) };
  let subtotalPaise = 0;
  for (const result of await priceAll(items)) {
    if (!result.ok) {
      quote.issues.push(result.issue);
      continue;
    }
    subtotalPaise += result.linePaise;
    quote.lines.push({
      productId: result.line.product_id,
      productName: result.line.product_name,
      unitPrice: result.line.unit_price,
      quantity: result.line.quantity,
      lineTotal: result.line.line_total,
      selectedOptions: result.line.selected_options,
    });
  }
  quote.totals = calculateOrderTotals(fromPaise(subtotalPaise));
  return quote;
}
