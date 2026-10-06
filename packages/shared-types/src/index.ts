/**
 * Domain + API contract types shared by the backend, admin panel and mobile app.
 * Monetary values are in rupees (number with up to 2 decimals) unless the field
 * name ends in `Paise`.
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

export const USER_ROLES = ['CUSTOMER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_RECORD_STATUSES = ['CREATED', 'PAID', 'FAILED'] as const;
export type PaymentRecordStatus = (typeof PAYMENT_RECORD_STATUSES)[number];

// ─── API envelope ───────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

// ─── Users & auth ───────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Catalog ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  /** Cloudinary public id when the image is hosted on Cloudinary. */
  imagePublicId: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
}

export interface CustomizationOption {
  id: string;
  name: string;
  /** Extra cost on top of the base price, in rupees. */
  price: number;
}

export interface CustomizationGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  /** Only meaningful for `multiple`. */
  maxSelect?: number;
  options: CustomizationOption[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  categoryId: string;
  category: CategoryRef | null;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  ingredients: string[];
  price: number;
  /** Original price when the product is on offer. */
  compareAtPrice: number | null;
  imageUrl: string | null;
  /** Cloudinary public id when the image is hosted on Cloudinary. */
  imagePublicId: string | null;
  images: ProductImage[];
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  rating: number;
  ratingCount: number;
  prepTimeMinutes: number;
  calories: number | null;
  customizations: CustomizationGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface HomeFeed {
  hero: Product | null;
  categories: Category[];
  popular: Product[];
  bestsellers: Product[];
  recommended: Product[];
  offers: Product[];
}

// ─── Addresses ──────────────────────────────────────────────────────────────

export interface AddressFields {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postalCode: string;
}

export interface Address extends AddressFields {
  id: string;
  isDefault: boolean;
  createdAt: string;
}

/** Address copied onto the order at purchase time. */
export type AddressSnapshot = AddressFields;

// ─── Cart & orders ──────────────────────────────────────────────────────────

export interface CartSelection {
  groupId: string;
  optionIds: string[];
}

export interface CartItemInput {
  productId: string;
  quantity: number;
  selectedOptions: CartSelection[];
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  productName: string;
  productImageUrl: string | null;
  isVeg: boolean;
  unitPrice: number;
  quantity: number;
  selectedOptions: SelectedOption[];
  lineTotal: number;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface PaymentSummary {
  id: string;
  provider: 'RAZORPAY';
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amountPaise: number;
  currency: string;
  status: PaymentRecordStatus;
  method: string | null;
  errorDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
}

export interface Order extends OrderTotals {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  deliveryAddress: AddressSnapshot;
  notes: string | null;
  itemCount: number;
  items: OrderItem[];
  statusHistory: OrderStatusEvent[];
  payments?: PaymentSummary[];
  customer?: OrderCustomer;
  estimatedMinutes: { min: number; max: number };
  createdAt: string;
  updatedAt: string;
}

// ─── Payments ───────────────────────────────────────────────────────────────

/** Everything the client needs to open Razorpay Checkout. */
export type PaymentProvider = 'razorpay' | 'mock';

export interface CheckoutSession {
  /** `mock` only in local development (no real gateway — see PAYMENT_PROVIDER). */
  provider: PaymentProvider;
  orderId: string;
  orderNumber: number;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  businessName: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
}

/** Simulated gateway response (mock provider only) — fed into /payments/verify. */
export interface MockPaymentAuthorization {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentVerificationResult {
  order: Order;
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export interface SalesPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productName: string;
  quantity: number;
  revenue: number;
}

export interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  revenue: number;
  todayRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  activeProducts: number;
  salesByDay: SalesPoint[];
  topProducts: TopProduct[];
  recentOrders: Order[];
}

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

// ─── Cart quote (server-side pricing preview) ───────────────────────────────

export interface QuoteLine {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  selectedOptions: SelectedOption[];
}

export interface QuoteIssue {
  productId: string;
  code: 'PRODUCT_UNAVAILABLE' | 'INVALID_CUSTOMIZATION' | 'INVALID_QUANTITY';
  message: string;
}

export interface CartQuote {
  lines: QuoteLine[];
  totals: OrderTotals;
  issues: QuoteIssue[];
}
