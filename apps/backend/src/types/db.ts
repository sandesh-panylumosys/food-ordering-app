import type {
  AddressSnapshot,
  CustomizationGroup,
  OrderStatus,
  PaymentRecordStatus,
  PaymentStatus,
  SelectedOption,
  UserRole,
} from '@food/shared-types';

/** Row shapes as returned by PostgREST (numeric columns arrive as numbers). */

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  password_hash?: string;
  role: UserRole;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_public_id: string | null;
  sort_order: number;
  is_active: boolean;
  products?: { count: number }[];
}

export interface ProductImageRow {
  id: string;
  url: string;
  public_id: string | null;
  alt: string | null;
  sort_order: number;
}

export interface ProductRow {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  ingredients: string[];
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  image_public_id: string | null;
  is_veg: boolean;
  is_available: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  rating: number;
  rating_count: number;
  prep_time_minutes: number;
  calories: number | null;
  customizations: CustomizationGroup[];
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string; slug: string; is_active?: boolean } | null;
  images?: ProductImageRow[];
}

export interface AddressRow {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
}

export interface OrderItemRow {
  id: string;
  product_id: string | null;
  product_name: string;
  product_image_url: string | null;
  is_veg: boolean;
  unit_price: number;
  quantity: number;
  selected_options: SelectedOption[];
  line_total: number;
}

export interface OrderStatusHistoryRow {
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export interface PaymentRow {
  id: string;
  order_id: string;
  provider: 'RAZORPAY';
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount_paise: number;
  currency: string;
  status: PaymentRecordStatus;
  method: string | null;
  error_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
  id: string;
  order_number: number;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  delivery_address: AddressSnapshot;
  notes: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
  items?: OrderItemRow[];
  history?: OrderStatusHistoryRow[];
  payments?: PaymentRow[];
  customer?: Pick<UserRow, 'id' | 'name' | 'email' | 'phone'> | null;
}
