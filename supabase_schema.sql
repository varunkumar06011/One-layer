-- ONE LAYER — Supabase schema for customer accounts
-- Run this in Supabase SQL Editor

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  phone text,
  email text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Addresses table
create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  label text default 'Home',
  name text,
  phone text,
  address text,
  pincode text,
  city text,
  state text,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Wishlist table
create table if not exists public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id text not null,
  color_name text,
  size text,
  created_at timestamptz default now(),
  unique(user_id, product_id, color_name, size)
);

-- Coupons table
create table if not exists public.coupons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  code text not null,
  discount_type text default 'percentage',
  discount_value integer default 10,
  expires_at timestamptz,
  used boolean default false,
  created_at timestamptz default now()
);

-- Reviews table
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id text not null,
  rating integer check (rating >= 1 and rating <= 5),
  title text,
  body text,
  created_at timestamptz default now()
);

-- Notifications settings
create table if not exists public.notification_settings (
  user_id uuid references auth.users on delete cascade primary key,
  order_updates boolean default true,
  offers boolean default true,
  newsletter boolean default false,
  updated_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlist enable row level security;
alter table public.coupons enable row level security;
alter table public.reviews enable row level security;
alter table public.notification_settings enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Addresses policies
create policy "Users can view own addresses" on public.addresses for select using (auth.uid() = user_id);
create policy "Users can insert own addresses" on public.addresses for insert with check (auth.uid() = user_id);
create policy "Users can update own addresses" on public.addresses for update using (auth.uid() = user_id);
create policy "Users can delete own addresses" on public.addresses for delete using (auth.uid() = user_id);

-- Wishlist policies
create policy "Users can view own wishlist" on public.wishlist for select using (auth.uid() = user_id);
create policy "Users can insert own wishlist" on public.wishlist for insert with check (auth.uid() = user_id);
create policy "Users can delete own wishlist" on public.wishlist for delete using (auth.uid() = user_id);

-- Coupons policies
create policy "Users can view own coupons" on public.coupons for select using (auth.uid() = user_id);
create policy "Users can insert own coupons" on public.coupons for insert with check (auth.uid() = user_id);
create policy "Users can update own coupons" on public.coupons for update using (auth.uid() = user_id);

-- Reviews policies
create policy "Users can view own reviews" on public.reviews for select using (auth.uid() = user_id);
create policy "Users can insert own reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own reviews" on public.reviews for update using (auth.uid() = user_id);
create policy "Users can delete own reviews" on public.reviews for delete using (auth.uid() = user_id);

-- Notification settings policies
create policy "Users can view own settings" on public.notification_settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on public.notification_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on public.notification_settings for update using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  insert into public.notification_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
