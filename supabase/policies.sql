-- ════════════════════════════════════════════════════════════════════════
-- VANTA — Supabase security layer
-- Applied automatically by `npm run db:migrate` when the database is Supabase.
-- Safe to re-run (idempotent).
--
-- The Next.js server talks to Postgres through DATABASE_URL and enforces
-- business rules itself (prices, stock, roles). These Row Level Security
-- policies are the second line of defence: they lock down the auto-generated
-- Supabase REST API, which is reachable from any browser with the anon key.
-- ════════════════════════════════════════════════════════════════════════

-- ─── Helpers ────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─── Profile row for every new Supabase Auth user ───────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', null))
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Customers may edit their own profile but never their role.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_admin()
     and current_user in ('authenticated', 'anon') then
    raise exception 'Changing the role is not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ─── Enable RLS everywhere ──────────────────────────────────────────────
alter table public.profiles               enable row level security;
alter table public.password_reset_tokens  enable row level security;
alter table public.addresses              enable row level security;
alter table public.categories             enable row level security;
alter table public.sizes                  enable row level security;
alter table public.colors                 enable row level security;
alter table public.products               enable row level security;
alter table public.product_images         enable row level security;
alter table public.product_variants       enable row level security;
alter table public.inventory_movements    enable row level security;
alter table public.carts                  enable row level security;
alter table public.cart_items             enable row level security;
alter table public.favorites              enable row level security;
alter table public.coupons                enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.order_status_history   enable row level security;
alter table public.payments               enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Demo-auth artefacts are never reachable through the API. (`profiles.password_hash`
-- is always NULL on Supabase projects: credentials live in auth.users.)
revoke all on public.password_reset_tokens from anon, authenticated;

-- ─── Profiles ───────────────────────────────────────────────────────────
drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
drop policy if exists "profiles: admin all"  on public.profiles;
create policy "profiles: read own"   on public.profiles for select using (id = auth.uid());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: admin all"  on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- ─── Public catalogue (read-only for everyone, write for admins) ────────
do $$
declare t text;
begin
  foreach t in array array['categories','sizes','colors','product_images','product_variants'] loop
    execute format('drop policy if exists "%1$s: public read" on public.%1$I', t);
    execute format('drop policy if exists "%1$s: admin write" on public.%1$I', t);
    execute format('create policy "%1$s: public read" on public.%1$I for select using (true)', t);
    execute format('create policy "%1$s: admin write" on public.%1$I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "products: public read active" on public.products;
drop policy if exists "products: admin write"        on public.products;
create policy "products: public read active" on public.products for select using (is_active or public.is_admin());
create policy "products: admin write"        on public.products for all using (public.is_admin()) with check (public.is_admin());

-- ─── Customer-owned data ────────────────────────────────────────────────
drop policy if exists "addresses: own" on public.addresses;
create policy "addresses: own" on public.addresses for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid());

drop policy if exists "favorites: own" on public.favorites;
create policy "favorites: own" on public.favorites for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "carts: own" on public.carts;
create policy "carts: own" on public.carts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "cart_items: own" on public.cart_items;
create policy "cart_items: own" on public.cart_items for all
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

-- ─── Orders: customers read their own; only the server creates them ─────
drop policy if exists "orders: read own"    on public.orders;
drop policy if exists "orders: admin all"   on public.orders;
create policy "orders: read own"  on public.orders for select using (user_id = auth.uid());
create policy "orders: admin all" on public.orders for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_items: read own"  on public.order_items;
drop policy if exists "order_items: admin all" on public.order_items;
create policy "order_items: read own" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "order_items: admin all" on public.order_items for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_status_history: read own"  on public.order_status_history;
drop policy if exists "order_status_history: admin all" on public.order_status_history;
create policy "order_status_history: read own" on public.order_status_history for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "order_status_history: admin all" on public.order_status_history for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payments: read own"  on public.payments;
drop policy if exists "payments: admin all" on public.payments;
create policy "payments: read own" on public.payments for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "payments: admin all" on public.payments for all using (public.is_admin()) with check (public.is_admin());

-- ─── Admin-only tables ──────────────────────────────────────────────────
drop policy if exists "coupons: admin all"             on public.coupons;
drop policy if exists "inventory_movements: admin all" on public.inventory_movements;
drop policy if exists "newsletter: admin read"         on public.newsletter_subscribers;
create policy "coupons: admin all"             on public.coupons for all using (public.is_admin()) with check (public.is_admin());
create policy "inventory_movements: admin all" on public.inventory_movements for all using (public.is_admin()) with check (public.is_admin());
create policy "newsletter: admin read"         on public.newsletter_subscribers for select using (public.is_admin());

-- ─── Storage bucket for product images ──────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product-images: public read"  on storage.objects;
drop policy if exists "product-images: admin write"  on storage.objects;
create policy "product-images: public read" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "product-images: admin write" on storage.objects for all
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
