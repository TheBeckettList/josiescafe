-- Josie's Cafe POS + website · schema v1 (MVP)
-- Run once in the Supabase SQL editor.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- ── Settings (one row) ──────────────────────────────────────────────
create table public.settings (
  id                 int primary key default 1 check (id = 1),
  cafe_name          text    not null default 'Josie''s Cafe',
  address            text    not null default 'Utila, Honduras',
  hours              jsonb   not null default '{"mon":"7:00-15:00","tue":"7:00-15:00","wed":"7:00-15:00","thu":"7:00-15:00","fri":"7:00-15:00","sat":"7:00-15:00","sun":"closed"}',
  tax_rate           numeric not null default 0.15,
  prices_include_tax boolean not null default true,
  usd_fee            numeric not null default 1.00,   -- lempiras kept per $1 to cover bank fees
  usd_rate_manual    numeric,                          -- set to override the bank rate
  fx_request_id      bigint,
  updated_at         timestamptz not null default now()
);
insert into public.settings (id) values (1);

-- ── Daily Banco Atlántida dollar rate ───────────────────────────────
create table public.fx_rates (
  day        date primary key,
  bank_buy   numeric not null,
  bank_sell  numeric,
  fetched_at timestamptz not null default now()
);

-- ── Menu ────────────────────────────────────────────────────────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  sort        int     not null default 0,
  name        jsonb   not null,                         -- {"en":"Coffee","es":"Café",...}
  station     text    not null default 'kitchen' check (station in ('bar','kitchen','none')),
  togo_charge numeric not null default 0 check (togo_charge >= 0),
  color       text    not null default '#F5B5C8',
  active      boolean not null default true
);

create table public.items (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid    not null references public.categories(id) on delete cascade,
  sort        int     not null default 0,
  name        jsonb   not null,
  description jsonb   not null default '{}',
  price       numeric not null check (price >= 0),
  togo_charge numeric check (togo_charge >= 0),         -- null = use the category's charge
  show_online boolean not null default true,
  available   boolean not null default true,            -- false = sold out today
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);
create index items_category on public.items (category_id);

-- ── Who may use the POS ─────────────────────────────────────────────
-- Device logins (Supabase Auth emails) allowed into the POS.
create table public.pos_users (
  email text primary key,
  label text
);
insert into public.pos_users (email, label) values
  ('pos@josiescafe.com', 'Cafe tablets'),
  ('rickytrent@icloud.com', 'Richard');

create table public.staff (
  id     uuid primary key default gen_random_uuid(),
  name   text not null,
  pin    text not null check (pin ~ '^[0-9]{4}$'),
  role   text not null default 'staff' check (role in ('staff','manager')),
  active boolean not null default true
);
insert into public.staff (name, pin, role) values ('Manager', '1234', 'manager');

create or replace function public.is_pos() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pos_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ── Orders ──────────────────────────────────────────────────────────
create table public.orders (
  id              uuid primary key,                      -- made on the device, so offline orders never collide
  device          text not null,
  number          text not null,
  customer_name   text,
  order_type      text not null default 'here' check (order_type in ('here','togo')),
  source          text not null default 'pos'  check (source in ('pos','online')),
  status          text not null default 'paid' check (status in ('open','paid','void')),
  subtotal        numeric not null default 0,
  togo_total      numeric not null default 0,
  tax             numeric not null default 0,
  tip             numeric not null default 0,
  total           numeric not null default 0,
  staff_name      text,
  created_at      timestamptz not null default now(),
  paid_at         timestamptz,
  bar_done_at     timestamptz,
  kitchen_done_at timestamptz,
  synced_at       timestamptz not null default now()
);
create index orders_created on public.orders (created_at desc);

create table public.order_items (
  id          uuid primary key,
  order_id    uuid not null references public.orders(id) on delete cascade,
  item_id     uuid,
  name        text not null,
  qty         int  not null check (qty > 0),
  unit_price  numeric not null,
  togo_charge numeric not null default 0,
  note        text,
  station     text not null default 'kitchen' check (station in ('bar','kitchen','none'))
);
create index order_items_order on public.order_items (order_id);

create table public.payments (
  id         uuid primary key,
  order_id   uuid not null references public.orders(id) on delete cascade,
  method     text not null check (method in ('cash_hnl','cash_usd','card')),
  amount     numeric not null,         -- lempiras, incl. card tip
  tip        numeric not null default 0,
  usd_amount numeric,
  usd_rate   numeric,
  card_ref   text,
  created_at timestamptz not null default now()
);
create index payments_order on public.payments (order_id);

-- One call per order from a device: order + items + payments, safe to retry.
create or replace function public.sync_order(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare o jsonb := p -> 'order';
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;

  insert into public.orders (id, device, number, customer_name, order_type, source, status,
    subtotal, togo_total, tax, tip, total, staff_name, created_at, paid_at, bar_done_at, kitchen_done_at)
  values ((o->>'id')::uuid, o->>'device', o->>'number', o->>'customer_name',
    coalesce(o->>'order_type','here'), 'pos', coalesce(o->>'status','paid'),
    coalesce((o->>'subtotal')::numeric,0), coalesce((o->>'togo_total')::numeric,0),
    coalesce((o->>'tax')::numeric,0), coalesce((o->>'tip')::numeric,0), coalesce((o->>'total')::numeric,0),
    o->>'staff_name', coalesce((o->>'created_at')::timestamptz, now()), (o->>'paid_at')::timestamptz,
    case when (o->>'has_bar')::boolean then null else coalesce((o->>'created_at')::timestamptz, now()) end,
    case when (o->>'has_kitchen')::boolean then null else coalesce((o->>'created_at')::timestamptz, now()) end)
  on conflict (id) do nothing;

  insert into public.order_items (id, order_id, item_id, name, qty, unit_price, togo_charge, note, station)
  select (i->>'id')::uuid, (o->>'id')::uuid, nullif(i->>'item_id','')::uuid, i->>'name',
         (i->>'qty')::int, (i->>'unit_price')::numeric, coalesce((i->>'togo_charge')::numeric,0),
         nullif(i->>'note',''), coalesce(i->>'station','kitchen')
  from jsonb_array_elements(coalesce(p->'items','[]')) i
  on conflict (id) do nothing;

  insert into public.payments (id, order_id, method, amount, tip, usd_amount, usd_rate, card_ref, created_at)
  select (x->>'id')::uuid, (o->>'id')::uuid, x->>'method', (x->>'amount')::numeric,
         coalesce((x->>'tip')::numeric,0), (x->>'usd_amount')::numeric, (x->>'usd_rate')::numeric,
         nullif(x->>'card_ref',''), coalesce((x->>'created_at')::timestamptz, now())
  from jsonb_array_elements(coalesce(p->'payments','[]')) x
  on conflict (id) do nothing;

  return o->>'id';
end $$;

-- Station screens mark a ticket done.
create or replace function public.bump(p_order uuid, p_station text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  if p_station = 'bar' then
    update public.orders set bar_done_at = coalesce(bar_done_at, now()) where id = p_order;
  elsif p_station = 'kitchen' then
    update public.orders set kitchen_done_at = coalesce(kitchen_done_at, now()) where id = p_order;
  end if;
end $$;

-- ── Row level security ──────────────────────────────────────────────
alter table public.settings    enable row level security;
alter table public.fx_rates    enable row level security;
alter table public.categories  enable row level security;
alter table public.items       enable row level security;
alter table public.pos_users   enable row level security;
alter table public.staff       enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.payments    enable row level security;

-- Website (anyone): menu, hours, rate
create policy public_read on public.settings   for select using (true);
create policy public_read on public.fx_rates   for select using (true);
create policy public_read on public.categories for select using (active);
create policy public_read on public.items      for select using (active and show_online);

-- POS devices: everything
create policy pos_all on public.settings    for all to authenticated using (public.is_pos()) with check (public.is_pos());
create policy pos_all on public.fx_rates    for all to authenticated using (public.is_pos()) with check (public.is_pos());
create policy pos_all on public.categories  for all to authenticated using (public.is_pos()) with check (public.is_pos());
create policy pos_all on public.items       for all to authenticated using (public.is_pos()) with check (public.is_pos());
create policy pos_all on public.staff       for all to authenticated using (public.is_pos()) with check (public.is_pos());
create policy pos_all on public.orders      for all to authenticated using (public.is_pos()) with check (public.is_pos());
create policy pos_all on public.order_items for all to authenticated using (public.is_pos()) with check (public.is_pos());
create policy pos_all on public.payments    for all to authenticated using (public.is_pos()) with check (public.is_pos());
-- pos_users: no policies, so nobody reads it through the API.

revoke execute on function public.sync_order(jsonb)  from public, anon;
revoke execute on function public.bump(uuid, text)   from public, anon;
grant  execute on function public.sync_order(jsonb)  to authenticated;
grant  execute on function public.bump(uuid, text)   to authenticated;

-- ── Morning rate job (Banco Atlántida's public rate file) ───────────
create or replace function public.fetch_fx() returns void
language plpgsql security definer set search_path = public, extensions as $$
declare rid bigint;
begin
  select net.http_get('https://d1s04f7gesr75p.cloudfront.net/tasa-de-cambio-managed.json') into rid;
  update public.settings set fx_request_id = rid where id = 1;
end $$;

create or replace function public.store_fx() returns void
language plpgsql security definer set search_path = public, extensions as $$
declare j jsonb; k text;
begin
  select content::jsonb into j
  from net._http_response r, public.settings s
  where s.id = 1 and r.id = s.fx_request_id and r.status_code = 200;
  if j is null then return; end if;
  for k in select jsonb_object_keys(j) loop
    if (j -> k -> 'USD' ->> 'compra') is not null then
      insert into public.fx_rates (day, bank_buy, bank_sell)
      values (to_date(k, 'DD-MM-YYYY'), (j -> k -> 'USD' ->> 'compra')::numeric, (j -> k -> 'USD' ->> 'venta')::numeric)
      on conflict (day) do update set bank_buy = excluded.bank_buy, bank_sell = excluded.bank_sell, fetched_at = now();
    end if;
  end loop;
end $$;

revoke execute on function public.fetch_fx() from public, anon, authenticated;
revoke execute on function public.store_fx() from public, anon, authenticated;

-- 6:00 and 12:00 Honduras time (UTC-6), then store 3 minutes later
select cron.schedule('fx-fetch', '0 12,18 * * *', 'select public.fetch_fx()');
select cron.schedule('fx-store', '3 12,18 * * *', 'select public.store_fx()');

-- First fetch right now
select public.fetch_fx();

-- ── API permissions (this project doesn't auto-expose new tables; RLS still decides rows) ──
grant usage on schema public to anon, authenticated;
grant select on public.settings, public.fx_rates, public.categories, public.items to anon;
grant select, insert, update, delete on public.settings, public.fx_rates, public.categories, public.items,
  public.staff, public.orders, public.order_items, public.payments to authenticated;
grant execute on function public.is_pos() to anon, authenticated;
