-- =============================================================
-- CRM Arabic — Complete Schema (Supabase)
-- Run all of this in Supabase SQL Editor in order
-- =============================================================

-- ====== EXTENSIONS ======
create extension if not exists "uuid-ossp";

-- ====== PROFILES (auth helpers) ======
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  role text default 'user' check (role in ('admin', 'manager', 'user')),
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ====== BRANCHES ======
create table if not exists public.branches (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  manager_name text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ====== CLIENTS ======
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text,
  phone text,
  company text,
  branch_id uuid references public.branches(id) on delete set null,
  status text default 'active' check (status in ('active', 'inactive', 'lead', 'vip')),
  notes text,
  total_value numeric(12,2) default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists clients_branch_idx on public.clients(branch_id);
create index if not exists clients_status_idx on public.clients(status);
create index if not exists clients_search_idx on public.clients(full_name, email, phone);

-- ====== ORDERS ======
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null default 'ORD-' || to_char(now(), 'YYMMDD') || '-' || substr(uuid_generate_v4()::text, 1, 6),
  client_id uuid not null references public.clients(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  amount numeric(12,2) not null default 0,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'cancelled')),
  payment_status text default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid')),
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists orders_client_idx on public.orders(client_id);
create index if not exists orders_branch_idx on public.orders(branch_id);
create index if not exists orders_status_idx on public.orders(status);

-- ====== NOTIFICATIONS ======
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  type text default 'info' check (type in ('info', 'success', 'warning', 'error')),
  title text not null,
  message text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, is_read);

-- ====== AUTO UPDATE TIMESTAMPS ======
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists branches_touch on public.branches;
create trigger branches_touch before update on public.branches
  for each row execute procedure public.touch_updated_at();

drop trigger if exists clients_touch on public.clients;
create trigger clients_touch before update on public.clients
  for each row execute procedure public.touch_updated_at();

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute procedure public.touch_updated_at();

-- ====== ROW LEVEL SECURITY ======
alter table public.profiles enable row level security;
alter table public.branches enable row level security;
alter table public.clients enable row level security;
alter table public.orders enable row level security;
alter table public.notifications enable row level security;

-- Profiles: users see/update their own
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Branches: authenticated read; admins write
drop policy if exists "branches_all_read" on public.branches;
create policy "branches_all_read" on public.branches for select using (auth.role() = 'authenticated');
drop policy if exists "branches_all_write" on public.branches;
create policy "branches_all_write" on public.branches for all using (auth.role() = 'authenticated');

-- Clients: authenticated read/write
drop policy if exists "clients_all_read" on public.clients;
create policy "clients_all_read" on public.clients for select using (auth.role() = 'authenticated');
drop policy if exists "clients_all_write" on public.clients;
create policy "clients_all_write" on public.clients for all using (auth.role() = 'authenticated');

-- Orders
drop policy if exists "orders_all_read" on public.orders;
create policy "orders_all_read" on public.orders for select using (auth.role() = 'authenticated');
drop policy if exists "orders_all_write" on public.orders;
create policy "orders_all_write" on public.orders for all using (auth.role() = 'authenticated');

-- Notifications: only own
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);
drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications for insert with check (auth.role() = 'authenticated');

-- ====== ENABLE REALTIME ======
-- Run in Supabase Dashboard → Database → Replication, or:
alter publication supabase_realtime add table public.clients;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.branches;

-- ====== SEED DATA (optional) ======
insert into public.branches (name, address, phone, manager_name) values
  ('الفرع الرئيسي - الدوحة', 'شارع الكورنيش، الدوحة', '+974-4444-1111', 'أحمد محمد'),
  ('فرع الوكرة', 'شارع المطار، الوكرة', '+974-4444-2222', 'محمود علي'),
  ('فرع الريان', 'شارع الريان، الريان', '+974-4444-3333', 'خالد سعد')
on conflict do nothing;
