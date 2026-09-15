-- ONE LAYER — security schema: orders, payments, staff roles, audit log.
-- Run in the Supabase SQL editor after supabase_schema.sql.
-- See docs/SECURITY_ARCHITECTURE.md for the rules these objects enforce.

-- ---------------------------------------------------------------------------
-- Staff roles (admin portal). Customers are never staff by virtue of a flag.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.staff_role as enum (
    'SUPPORT', 'CONTENT_MANAGER', 'ORDER_MANAGER', 'ADMIN', 'SUPER_ADMIN'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.admin_users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password_hash text not null,          -- Argon2id
  role public.staff_role not null default 'SUPPORT',
  totp_secret_encrypted text,           -- MFA rollout
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

-- Refresh-token families for admin sessions: hashed, rotated, revocable.
create table if not exists public.admin_refresh_tokens (
  token_hash text primary key,          -- sha256 of the opaque token
  family_id uuid not null,
  admin_id uuid not null references public.admin_users on delete cascade,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz
);
create index if not exists admin_refresh_tokens_family_idx
  on public.admin_refresh_tokens (family_id);

-- ---------------------------------------------------------------------------
-- Orders. Money columns are written by the server only, in minor units.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.order_status as enum (
    'NEW', 'CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id text primary key,                            -- OL-XXXXXX
  user_id uuid references auth.users on delete set null,  -- null for guest checkout
  contact_name text not null,
  contact_phone text not null,
  address text not null,
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  zone text,
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  currency text not null default 'INR',
  status public.order_status not null default 'NEW',
  payment_status public.payment_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id text not null references public.orders on delete cascade,
  product_id text not null,
  product_name text not null,
  size text not null,
  color_name text,
  quantity integer not null check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  line_total_minor bigint not null check (line_total_minor >= 0),
  custom_design_object_key text,   -- key in the private storage bucket, not a URL
  placement text
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- No card data. Only gateway references and amounts we can reconcile.
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  order_id text not null references public.orders on delete cascade,
  gateway text not null default 'razorpay',
  gateway_payment_id text unique,
  gateway_order_id text,
  gateway_event_id text unique,       -- webhook idempotency key
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'INR',
  status public.payment_status not null default 'PENDING',
  method_summary text,                -- e.g. 'UPI', 'card •••• 4242'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Append-only audit log.
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id bigserial primary key,
  event text not null,
  occurred_at timestamptz not null default now(),
  request_id uuid,
  actor_id text,
  actor_type text not null default 'anonymous',
  ip inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists audit_log_event_idx on public.audit_log (event, occurred_at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id, occurred_at desc);

create or replace function public.audit_log_is_append_only()
returns trigger as $$
begin
  raise exception 'audit_log is append-only';
end;
$$ language plpgsql;

drop trigger if exists audit_log_no_update on public.audit_log;
create trigger audit_log_no_update
  before update or delete on public.audit_log
  for each row execute function public.audit_log_is_append_only();

-- ---------------------------------------------------------------------------
-- Row Level Security. The API is a second line of defence, not the only one.
-- ---------------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.audit_log enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_refresh_tokens enable row level security;

-- Customers can read their own orders and nothing else. Writes go through the
-- API using the service role, which bypasses RLS by design.
drop policy if exists "Customers read own orders" on public.orders;
create policy "Customers read own orders" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "Customers read own order items" on public.order_items;
create policy "Customers read own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "Customers read own payments" on public.payments;
create policy "Customers read own payments" on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id and o.user_id = auth.uid()
    )
  );

-- admin_users, admin_refresh_tokens and audit_log have no policies at all:
-- with RLS enabled that denies every anon/authenticated client outright.

-- ---------------------------------------------------------------------------
-- Tighten a pre-existing customer table: supabase_schema.sql lets a signed-in
-- user insert and update their own coupon rows, i.e. mint their own discounts.
-- Coupons are granted by the server only; clients keep read access.
-- ---------------------------------------------------------------------------
drop policy if exists "Users can insert own coupons" on public.coupons;
drop policy if exists "Users can update own coupons" on public.coupons;
