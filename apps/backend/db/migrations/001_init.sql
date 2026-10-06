-- ============================================================================
-- Ember & Oak — initial schema
-- Run in the Supabase SQL editor, or `pnpm db:migrate` with SUPABASE_DB_URL set.
-- The mobile/admin clients never talk to Supabase directly: every table has RLS
-- enabled with NO policies, so only the backend's service-role key can access.
-- ============================================================================

set client_min_messages = warning;

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ─── Enums ──────────────────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('CUSTOMER', 'ADMIN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_record_status as enum ('CREATED', 'PAID', 'FAILED');
exception when duplicate_object then null; end $$;

-- ─── updated_at helper ──────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─── users ──────────────────────────────────────────────────────────────────
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 80),
  email         citext not null unique,
  phone         text,
  password_hash text not null,
  role          user_role not null default 'CUSTOMER',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── categories ─────────────────────────────────────────────────────────────
create table if not exists categories (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  description     text,
  image_url       text,
  image_public_id text,
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists categories_active_sort_idx on categories (is_active, sort_order);

-- ─── products ───────────────────────────────────────────────────────────────
create table if not exists products (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid not null references categories (id) on delete restrict,
  name              text not null,
  slug              text not null unique,
  short_description text not null default '',
  description       text not null default '',
  ingredients       text[] not null default '{}',
  price             numeric(10, 2) not null check (price > 0),
  compare_at_price  numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  image_url         text,
  image_public_id   text,
  is_veg            boolean not null default true,
  is_available      boolean not null default true,
  is_featured       boolean not null default false,
  is_bestseller     boolean not null default false,
  rating            numeric(2, 1) not null default 0 check (rating between 0 and 5),
  rating_count      integer not null default 0,
  prep_time_minutes integer not null default 20,
  calories          integer,
  customizations    jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists products_category_idx on products (category_id);
create index if not exists products_available_idx on products (is_available);
create index if not exists products_featured_idx on products (is_featured) where is_featured;

-- ─── product_images (gallery) ───────────────────────────────────────────────
create table if not exists product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url        text not null,
  public_id  text,
  alt        text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on product_images (product_id, sort_order);

-- ─── addresses ──────────────────────────────────────────────────────────────
create table if not exists addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users (id) on delete cascade,
  label          text not null default 'Home',
  recipient_name text not null,
  phone          text not null,
  line1          text not null,
  line2          text,
  landmark       text,
  city           text not null,
  state          text not null,
  postal_code    text not null,
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists addresses_user_idx on addresses (user_id);
create unique index if not exists addresses_one_default_per_user
  on addresses (user_id) where is_default;

-- ─── orders ─────────────────────────────────────────────────────────────────
create sequence if not exists order_number_seq start 1001;

create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     bigint not null unique default nextval('order_number_seq'),
  user_id          uuid not null references users (id) on delete restrict,
  status           order_status not null default 'PENDING',
  payment_status   payment_status not null default 'PENDING',
  subtotal         numeric(10, 2) not null,
  delivery_fee     numeric(10, 2) not null default 0,
  tax              numeric(10, 2) not null default 0,
  discount         numeric(10, 2) not null default 0,
  total            numeric(10, 2) not null check (total >= 0),
  currency         text not null default 'INR',
  delivery_address jsonb not null,
  notes            text,
  item_count       integer not null default 0,
  paid_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_user_created_idx on orders (user_id, created_at desc);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_created_idx on orders (created_at desc);

-- ─── order_items (purchase-time snapshot) ───────────────────────────────────
create table if not exists order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders (id) on delete cascade,
  product_id        uuid references products (id) on delete set null,
  product_name      text not null,
  product_image_url text,
  is_veg            boolean not null default true,
  unit_price        numeric(10, 2) not null,
  quantity          integer not null check (quantity > 0),
  selected_options  jsonb not null default '[]'::jsonb,
  line_total        numeric(10, 2) not null,
  created_at        timestamptz not null default now()
);
create index if not exists order_items_order_idx on order_items (order_id);
create index if not exists order_items_product_idx on order_items (product_id);

-- ─── order_status_history (tracking timeline) ───────────────────────────────
create table if not exists order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders (id) on delete cascade,
  status     order_status not null,
  note       text,
  changed_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on order_status_history (order_id, created_at);

-- ─── payments ───────────────────────────────────────────────────────────────
create table if not exists payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders (id) on delete cascade,
  provider            text not null default 'RAZORPAY',
  razorpay_order_id   text not null unique,
  razorpay_payment_id text unique,
  razorpay_signature  text,
  amount_paise        integer not null check (amount_paise > 0),
  currency            text not null default 'INR',
  status              payment_record_status not null default 'CREATED',
  method              text,
  error_code          text,
  error_description   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists payments_order_idx on payments (order_id);

-- ─── triggers ───────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['users', 'categories', 'products', 'addresses', 'orders', 'payments'] loop
    execute format('drop trigger if exists %I_set_updated_at on %I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on %I for each row execute function set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ─── Row level security: deny everything to anon/authenticated roles ────────
alter table users                enable row level security;
alter table categories           enable row level security;
alter table products             enable row level security;
alter table product_images       enable row level security;
alter table addresses            enable row level security;
alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table order_status_history enable row level security;
alter table payments             enable row level security;

-- ============================================================================
-- RPC functions (called by the backend with the service-role key)
-- ============================================================================

-- Creates an order, its items, the first timeline event and the payment record
-- in a single transaction. Totals are computed by the backend, never the client.
create or replace function create_order(
  p_order_id          uuid,
  p_user_id           uuid,
  p_address           jsonb,
  p_notes             text,
  p_subtotal          numeric,
  p_delivery_fee      numeric,
  p_tax               numeric,
  p_discount          numeric,
  p_total             numeric,
  p_currency          text,
  p_items             jsonb,
  p_razorpay_order_id text,
  p_amount_paise      integer
) returns table (id uuid, order_number bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number bigint;
  v_count  integer;
begin
  select coalesce(sum((i ->> 'quantity')::int), 0) into v_count
  from jsonb_array_elements(p_items) as i;

  insert into orders (
    id, user_id, delivery_address, notes, subtotal, delivery_fee, tax, discount,
    total, currency, item_count
  ) values (
    p_order_id, p_user_id, p_address, p_notes, p_subtotal, p_delivery_fee, p_tax,
    p_discount, p_total, p_currency, v_count
  ) returning orders.order_number into v_number;

  insert into order_items (
    order_id, product_id, product_name, product_image_url, is_veg, unit_price,
    quantity, selected_options, line_total
  )
  select
    p_order_id,
    (i ->> 'product_id')::uuid,
    i ->> 'product_name',
    i ->> 'product_image_url',
    coalesce((i ->> 'is_veg')::boolean, true),
    (i ->> 'unit_price')::numeric,
    (i ->> 'quantity')::int,
    coalesce(i -> 'selected_options', '[]'::jsonb),
    (i ->> 'line_total')::numeric
  from jsonb_array_elements(p_items) as i;

  insert into order_status_history (order_id, status, note, changed_by)
  values (p_order_id, 'PENDING', 'Order placed', p_user_id);

  insert into payments (order_id, razorpay_order_id, amount_paise, currency)
  values (p_order_id, p_razorpay_order_id, p_amount_paise, p_currency);

  return query select p_order_id, v_number;
end $$;

-- Marks a Razorpay order as paid and confirms the order. Idempotent: calling it
-- twice (client verify + webhook) leaves the same end state.
create or replace function mark_order_paid(
  p_razorpay_order_id   text,
  p_razorpay_payment_id text,
  p_signature           text,
  p_method              text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment payments%rowtype;
  v_order   orders%rowtype;
begin
  select * into v_payment from payments
  where razorpay_order_id = p_razorpay_order_id
  for update;

  if not found then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;

  select * into v_order from orders where id = v_payment.order_id for update;

  if v_payment.status = 'PAID' then
    return v_order.id;
  end if;

  update payments set
    status = 'PAID',
    razorpay_payment_id = p_razorpay_payment_id,
    razorpay_signature = coalesce(p_signature, razorpay_signature),
    method = coalesce(p_method, method),
    error_code = null,
    error_description = null
  where id = v_payment.id;

  update orders set
    payment_status = 'PAID',
    paid_at = now(),
    status = case when status = 'PENDING' then 'CONFIRMED'::order_status else status end
  where id = v_order.id;

  if v_order.status = 'PENDING' then
    insert into order_status_history (order_id, status, note)
    values (v_order.id, 'CONFIRMED', 'Payment received');
  end if;

  return v_order.id;
end $$;

-- Records a failed / abandoned payment attempt without touching paid orders.
create or replace function mark_payment_failed(
  p_razorpay_order_id   text,
  p_razorpay_payment_id text,
  p_error_code          text,
  p_error_description   text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment payments%rowtype;
begin
  select * into v_payment from payments where razorpay_order_id = p_razorpay_order_id for update;
  if not found or v_payment.status = 'PAID' then
    return;
  end if;

  update payments set
    status = 'FAILED',
    razorpay_payment_id = coalesce(p_razorpay_payment_id, razorpay_payment_id),
    error_code = p_error_code,
    error_description = p_error_description
  where id = v_payment.id;

  update orders set payment_status = 'FAILED'
  where id = v_payment.order_id and payment_status <> 'PAID';
end $$;

-- Updates an order's status and appends to the timeline atomically.
create or replace function update_order_status(
  p_order_id uuid,
  p_status   order_status,
  p_note     text,
  p_actor    uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders set status = p_status where id = p_order_id;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  insert into order_status_history (order_id, status, note, changed_by)
  values (p_order_id, p_status, p_note, p_actor);
end $$;

-- Makes one address the default for its user (unsetting the previous one).
create or replace function set_default_address(p_user_id uuid, p_address_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update addresses set is_default = false where user_id = p_user_id and is_default and id <> p_address_id;
  update addresses set is_default = true where user_id = p_user_id and id = p_address_id;
end $$;

-- Aggregated metrics for the admin dashboard (business day = Asia/Kolkata).
create or replace function admin_dashboard_stats(p_days integer default 7)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select (date_trunc('day', now() at time zone 'Asia/Kolkata')) at time zone 'Asia/Kolkata' as today_start
  ),
  paid as (
    select * from orders where payment_status = 'PAID'
  )
  select jsonb_build_object(
    'totalOrders',     (select count(*) from orders where payment_status = 'PAID'),
    'todayOrders',     (select count(*) from paid, bounds where paid.created_at >= bounds.today_start),
    'revenue',         (select coalesce(sum(total), 0) from paid where status <> 'CANCELLED'),
    'todayRevenue',    (select coalesce(sum(total), 0) from paid, bounds
                         where paid.created_at >= bounds.today_start and status <> 'CANCELLED'),
    'pendingOrders',   (select count(*) from paid where status in ('CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY')),
    'completedOrders', (select count(*) from paid where status = 'DELIVERED'),
    'cancelledOrders', (select count(*) from paid where status = 'CANCELLED'),
    'activeProducts',  (select count(*) from products where is_available),
    'salesByDay', (
      select coalesce(jsonb_agg(jsonb_build_object('date', d.day, 'revenue', d.revenue, 'orders', d.orders) order by d.day), '[]'::jsonb)
      from (
        select to_char(g.day, 'YYYY-MM-DD') as day,
               coalesce(sum(p.total) filter (where p.status <> 'CANCELLED'), 0) as revenue,
               count(p.id) as orders
        from generate_series(
               (now() at time zone 'Asia/Kolkata')::date - (p_days - 1),
               (now() at time zone 'Asia/Kolkata')::date,
               interval '1 day'
             ) as g(day)
        left join paid p on (p.created_at at time zone 'Asia/Kolkata')::date = g.day::date
        group by g.day
      ) d
    ),
    'topProducts', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select oi.product_name as "productName",
               sum(oi.quantity)::int as quantity,
               sum(oi.line_total) as revenue
        from order_items oi
        join paid p on p.id = oi.order_id
        where p.status <> 'CANCELLED'
        group by oi.product_name
        order by quantity desc
        limit 5
      ) t
    )
  );
$$;

-- Lock RPCs down to the service role only.
revoke all on function create_order(uuid, uuid, jsonb, text, numeric, numeric, numeric, numeric, numeric, text, jsonb, text, integer) from public, anon, authenticated;
revoke all on function mark_order_paid(text, text, text, text) from public, anon, authenticated;
revoke all on function mark_payment_failed(text, text, text, text) from public, anon, authenticated;
revoke all on function update_order_status(uuid, order_status, text, uuid) from public, anon, authenticated;
revoke all on function set_default_address(uuid, uuid) from public, anon, authenticated;
revoke all on function admin_dashboard_stats(integer) from public, anon, authenticated;
grant execute on function create_order(uuid, uuid, jsonb, text, numeric, numeric, numeric, numeric, numeric, text, jsonb, text, integer) to service_role;
grant execute on function mark_order_paid(text, text, text, text) to service_role;
grant execute on function mark_payment_failed(text, text, text, text) to service_role;
grant execute on function update_order_status(uuid, order_status, text, uuid) to service_role;
grant execute on function set_default_address(uuid, uuid) to service_role;
grant execute on function admin_dashboard_stats(integer) to service_role;
