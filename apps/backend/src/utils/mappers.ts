import { PREP_TIME } from '@food/config';
import type { Address, Category, Order, Product, User } from '@food/shared-types';
import type { AddressRow, CategoryRow, OrderRow, ProductRow, UserRow } from '../types/db.js';

const num = (v: number | string | null | undefined): number => Number(v ?? 0);

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function toCategory(row: CategoryRow): Category {
  const category: Category = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    imagePublicId: row.image_public_id,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
  if (row.products) category.productCount = row.products[0]?.count ?? 0;
  return category;
}

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    category: row.category
      ? { id: row.category.id, name: row.category.name, slug: row.category.slug }
      : null,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description,
    description: row.description,
    ingredients: row.ingredients ?? [],
    price: num(row.price),
    compareAtPrice: row.compare_at_price === null ? null : num(row.compare_at_price),
    imageUrl: row.image_url,
    imagePublicId: row.image_public_id,
    images: (row.images ?? [])
      .map((i) => ({ id: i.id, url: i.url, alt: i.alt, sortOrder: i.sort_order }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    isVeg: row.is_veg,
    isAvailable: row.is_available,
    isFeatured: row.is_featured,
    isBestseller: row.is_bestseller,
    rating: num(row.rating),
    ratingCount: row.rating_count,
    prepTimeMinutes: row.prep_time_minutes,
    calories: row.calories,
    customizations: row.customizations ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAddress(row: AddressRow): Address {
  return {
    id: row.id,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    landmark: row.landmark,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

export function toOrder(row: OrderRow): Order {
  const order: Order = {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    subtotal: num(row.subtotal),
    deliveryFee: num(row.delivery_fee),
    tax: num(row.tax),
    discount: num(row.discount),
    total: num(row.total),
    currency: row.currency,
    deliveryAddress: row.delivery_address,
    notes: row.notes,
    itemCount: row.item_count,
    items: (row.items ?? []).map((i) => ({
      id: i.id,
      productId: i.product_id,
      productName: i.product_name,
      productImageUrl: i.product_image_url,
      isVeg: i.is_veg,
      unitPrice: num(i.unit_price),
      quantity: i.quantity,
      selectedOptions: i.selected_options ?? [],
      lineTotal: num(i.line_total),
    })),
    statusHistory: (row.history ?? [])
      .map((h) => ({ status: h.status, note: h.note, createdAt: h.created_at }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    estimatedMinutes: { min: PREP_TIME.min, max: PREP_TIME.max },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.payments) {
    order.payments = row.payments
      .map((p) => ({
        id: p.id,
        provider: p.provider,
        razorpayOrderId: p.razorpay_order_id,
        razorpayPaymentId: p.razorpay_payment_id,
        amountPaise: p.amount_paise,
        currency: p.currency,
        status: p.status,
        method: p.method,
        errorDescription: p.error_description,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  if (row.customer) {
    order.customer = {
      id: row.customer.id,
      name: row.customer.name,
      email: row.customer.email,
      phone: row.customer.phone,
    };
  }
  return order;
}
