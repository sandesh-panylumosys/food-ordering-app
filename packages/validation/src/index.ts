import { z } from 'zod';
import { ORDER_STATUSES } from '@food/shared-types';

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,13}$/, 'Enter a valid phone number');

export const emailSchema = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'));

export const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

// ─── Auth ───────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: trimmed(2, 80, 'Name'),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z
  .object({
    name: trimmed(2, 80, 'Name').optional(),
    phone: phoneSchema.nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ─── Addresses ──────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  label: trimmed(1, 30, 'Label'),
  recipientName: trimmed(2, 80, 'Name'),
  phone: phoneSchema,
  line1: trimmed(3, 160, 'Address'),
  line2: optionalText(160),
  landmark: optionalText(120),
  city: trimmed(2, 80, 'City'),
  state: trimmed(2, 80, 'State'),
  postalCode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;
export const addressUpdateSchema = addressSchema.partial();
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;

// ─── Cart / orders / payments ───────────────────────────────────────────────

export const cartItemSchema = z.object({
  productId: z.uuid('Invalid product'),
  quantity: z.number().int().min(1).max(20),
  selectedOptions: z
    .array(
      z.object({
        groupId: z.string().min(1).max(60),
        optionIds: z.array(z.string().min(1).max(60)).max(20),
      }),
    )
    .max(20)
    .default([]),
});
export type CartItemSchemaInput = z.input<typeof cartItemSchema>;

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Your cart is empty').max(30),
  addressId: z.uuid('Please select a delivery address'),
  notes: optionalText(300),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const verifyPaymentSchema = z.object({
  orderId: z.uuid(),
  razorpayOrderId: z.string().min(1).max(100),
  razorpayPaymentId: z.string().min(1).max(100),
  razorpaySignature: z.string().min(1).max(256),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export const paymentFailureSchema = z.object({
  orderId: z.uuid(),
  razorpayOrderId: z.string().min(1).max(100),
  razorpayPaymentId: z.string().max(100).optional(),
  code: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});
export type PaymentFailureInput = z.infer<typeof paymentFailureSchema>;

export const retryPaymentSchema = z.object({ orderId: z.uuid() });
export const mockAuthorizeSchema = z.object({ orderId: z.uuid() });

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: optionalText(200),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// ─── Catalog (admin) ────────────────────────────────────────────────────────

const money = z.coerce.number().min(0).max(100000).multipleOf(0.01);

export const customizationGroupSchema = z.object({
  id: z.string().trim().min(1).max(60),
  name: trimmed(1, 60, 'Group name'),
  type: z.enum(['single', 'multiple']),
  required: z.boolean(),
  maxSelect: z.number().int().min(1).max(20).optional(),
  options: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(60),
        name: trimmed(1, 60, 'Option name'),
        price: money,
      }),
    )
    .min(1)
    .max(20),
});

export const productSchema = z.object({
  categoryId: z.uuid('Choose a category'),
  name: trimmed(2, 100, 'Name'),
  shortDescription: trimmed(2, 140, 'Short description'),
  description: trimmed(2, 2000, 'Description'),
  ingredients: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  price: money.refine((v) => v > 0, 'Price must be greater than 0'),
  compareAtPrice: money.nullish().transform((v) => v ?? null),
  imageUrl: z.url().nullish().transform((v) => v ?? null),
  imagePublicId: z.string().max(255).nullish().transform((v) => v ?? null),
  isVeg: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  prepTimeMinutes: z.coerce.number().int().min(1).max(180).default(20),
  calories: z.coerce.number().int().min(0).max(5000).nullish().transform((v) => v ?? null),
  customizations: z.array(customizationGroupSchema).max(10).default([]),
});
export type ProductInput = z.infer<typeof productSchema>;
export type ProductFormInput = z.input<typeof productSchema>;

export const productUpdateSchema = productSchema.partial();
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const categorySchema = z.object({
  name: trimmed(2, 60, 'Name'),
  description: optionalText(300),
  imageUrl: z.url().nullish().transform((v) => v ?? null),
  imagePublicId: z.string().max(255).nullish().transform((v) => v ?? null),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof categorySchema>;
export const categoryUpdateSchema = categorySchema.partial();
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

// ─── Queries ────────────────────────────────────────────────────────────────

const boolQuery = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true')
  .optional();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const productQuerySchema = paginationQuerySchema.extend({
  category: z.string().trim().max(80).optional(),
  search: z.string().trim().max(80).optional(),
  featured: boolQuery,
  bestseller: boolQuery,
  includeUnavailable: boolQuery,
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

export const orderQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ORDER_STATUSES).optional(),
  search: z.string().trim().max(80).optional(),
});
export type OrderQuery = z.infer<typeof orderQuerySchema>;

export const idParamSchema = z.object({ id: z.uuid('Invalid id') });

export { z };

export const quoteSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Your cart is empty').max(30),
});
export type QuoteInput = z.infer<typeof quoteSchema>;
