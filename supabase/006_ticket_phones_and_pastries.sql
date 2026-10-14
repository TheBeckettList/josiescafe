-- v1.2 · Ticket phones (kitchen and bar) + counted items (pastries).
--
-- Ticket phones: cooks and baristas open josiescafe.com/pos on their own phones, pick Kitchen or Bar,
-- type the 6-digit ticket code, and see that station's tickets (read only). Each new ticket buzzes the phone
-- through Web Push (the kitchen-push edge function). Phones never sign in to the POS, and the code only
-- unlocks ticket contents: no prices, no phone numbers.
--
-- Counted items: a category marked "counted" (Pastries) keeps a count per item. Every sale takes from it.
-- The register may sell past 0; online ordering stops at 0. Voiding an order puts the count back.

-- ═════════════════════════════ ticket phones ═════════════════════════════
create table if not exists public.ticket_link (
  id         int primary key default 1 check (id = 1),
  code       text not null default lpad((floor(random() * 1000000))::int::text, 6, '0'),
  fail_count int  not null default 0,
  fail_since timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.ticket_link (id) values (1) on conflict do nothing;
alter table public.ticket_link enable row level security;
drop policy if exists pos_all on public.ticket_link;
create policy pos_all on public.ticket_link for all to authenticated using (public.is_pos()) with check (public.is_pos());
grant select on public.ticket_link to authenticated;

create table if not exists public.push_subs (
  endpoint   text primary key,
  p256dh     text not null,
  auth       text not null,
  station    text not null default 'kitchen' check (station in ('kitchen', 'bar')),
  lang       text not null default 'es',
  created_at timestamptz not null default now(),
  last_ok_at timestamptz
);
alter table public.push_subs enable row level security;   -- no policies: only the functions below touch it

-- Web Push signing key; the kitchen-push function makes it on first run. Never readable through the API.
create table if not exists public.push_keys (
  id          int primary key default 1 check (id = 1),
  public_key  text not null,
  private_jwk jsonb not null,
  created_at  timestamptz not null default now()
);
alter table public.push_keys enable row level security;

alter table public.orders add column if not exists pushed_at timestamptz;

-- Code check with a brake on guessing: 25 wrong tries locks it for 10 minutes.
create or replace function public.tickets_ok(p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare k public.ticket_link;
begin
  select * into k from public.ticket_link where id = 1 for update;
  if k.fail_since is not null and k.fail_since < now() - interval '10 minutes' then
    update public.ticket_link set fail_count = 0, fail_since = null where id = 1;
    k.fail_count := 0;
  end if;
  if k.fail_count >= 25 then return false; end if;
  if p_code is not null and p_code = k.code then return true; end if;
  update public.ticket_link set fail_count = fail_count + 1, fail_since = coalesce(fail_since, now()) where id = 1;
  return false;
end $$;

-- One station's tickets from the last 12 hours, item names in the phone's language.
create or replace function public.tickets_feed(p_code text, p_station text, p_lang text default 'es') returns jsonb
language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.tickets_ok(p_code) then return jsonb_build_object('ok', false); end if;
  select coalesce(jsonb_agg(t), '[]') into v from (
    select jsonb_build_object(
      'id', o.id, 'number', o.number, 'name', o.customer_name, 'type', o.order_type, 'source', o.source,
      'note', o.note, 'created_at', o.created_at, 'pickup_at', o.pickup_at,
      'done', case when p_station = 'bar' then o.bar_done_at is not null else o.kitchen_done_at is not null end,
      'items', (select jsonb_agg(jsonb_build_object('qty', oi.qty, 'note', oi.note,
                  'name', coalesce(it.name ->> p_lang, it.name ->> 'en', oi.name)) order by oi.id)
                from public.order_items oi left join public.items it on it.id = oi.item_id
                where oi.order_id = o.id and oi.station = p_station)) t
    from public.orders o
    where o.status in ('open', 'paid') and o.created_at > now() - interval '12 hours'
      and exists (select 1 from public.order_items oi where oi.order_id = o.id and oi.station = p_station)
    order by coalesce(o.pickup_at - interval '20 minutes', o.created_at) desc
    limit 30
  ) q;
  return jsonb_build_object('ok', true, 'tickets', v, 'now', now(),
    'vapid', (select public_key from public.push_keys where id = 1));
end $$;

create or replace function public.tickets_subscribe(p_code text, p_sub jsonb, p_station text, p_lang text default 'es') returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.tickets_ok(p_code) then return false; end if;
  if coalesce(p_sub ->> 'endpoint', '') !~ '^https://' or p_station not in ('kitchen', 'bar') then return false; end if;
  insert into public.push_subs (endpoint, p256dh, auth, station, lang)
  values (p_sub ->> 'endpoint', p_sub -> 'keys' ->> 'p256dh', p_sub -> 'keys' ->> 'auth', p_station, coalesce(nullif(p_lang, ''), 'es'))
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, station = excluded.station, lang = excluded.lang;
  return true;
end $$;

create or replace function public.tickets_unsubscribe(p_code text, p_endpoint text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.tickets_ok(p_code) then return false; end if;
  delete from public.push_subs where endpoint = p_endpoint;
  return true;
end $$;

-- POS manager: a new code. Every phone has to type it again, and old alerts stop.
create or replace function public.tickets_new_code() returns text
language plpgsql security definer set search_path = public as $$
declare c text := lpad((floor(random() * 1000000))::int::text, 6, '0');
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  update public.ticket_link set code = c, fail_count = 0, fail_since = null, updated_at = now() where id = 1;
  delete from public.push_subs;
  return c;
end $$;

-- POS manager: how many phones have alerts on, per station.
create or replace function public.tickets_phones() returns jsonb
language sql security definer set search_path = public as $$
  select case when public.is_pos() then jsonb_build_object(
    'kitchen', (select count(*) from public.push_subs where station = 'kitchen'),
    'bar',     (select count(*) from public.push_subs where station = 'bar')) end;
$$;

revoke execute on function public.tickets_ok(text)                           from public, anon, authenticated;
revoke execute on function public.tickets_feed(text, text, text)             from public;
revoke execute on function public.tickets_subscribe(text, jsonb, text, text) from public;
revoke execute on function public.tickets_unsubscribe(text, text)            from public;
revoke execute on function public.tickets_new_code()                         from public, anon;
revoke execute on function public.tickets_phones()                           from public, anon;
grant  execute on function public.tickets_feed(text, text, text)             to anon, authenticated;
grant  execute on function public.tickets_subscribe(text, jsonb, text, text) to anon, authenticated;
grant  execute on function public.tickets_unsubscribe(text, text)            to anon, authenticated;
grant  execute on function public.tickets_new_code()                         to authenticated;
grant  execute on function public.tickets_phones()                           to authenticated;

-- New order with bar or kitchen items → kitchen-push sends the alerts.
-- Deferred to commit, so the order's items are saved by the time the function reads them.
-- Orders that reach the server over 30 minutes late (register was offline) don't buzz phones.
create or replace function public.orders_push() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'void' and (new.kitchen_done_at is null or new.bar_done_at is null)
     and new.created_at > now() - interval '30 minutes'
     and exists (select 1 from public.push_subs) then
    perform net.http_post(
      url := 'https://tuthebxguxvogmiowhcx.supabase.co/functions/v1/kitchen-push',
      body := jsonb_build_object('order_id', new.id),
      headers := '{"Content-Type":"application/json"}'::jsonb);
  end if;
  return null;
end $$;
revoke execute on function public.orders_push() from public, anon, authenticated;

drop trigger if exists orders_push on public.orders;
create constraint trigger orders_push after insert on public.orders
  deferrable initially deferred for each row execute function public.orders_push();

-- ═════════════════════════════ counted items (pastries) ═════════════════════════════
alter table public.categories add column if not exists counted boolean not null default false;
alter table public.items      add column if not exists stock int;   -- how many left; used when the category is counted

insert into public.categories (sort, name, station, togo_charge, color, counted)
select coalesce(max(sort), 0) + 1,
  '{"en":"Pastries","es":"Repostería","fr":"Pâtisseries","de":"Gebäck","nl":"Gebak","it":"Pasticceria","pt":"Confeitaria","nb":"Bakverk","ga":"Taosráin","he":"מאפים"}'::jsonb,
  'none', 0, '#F9D7A8', true
from public.categories
where not exists (select 1 from public.categories where counted);

-- Manager +/- buttons: atomic, so a sale landing at the same moment isn't lost.
create or replace function public.add_stock(p_item uuid, p_delta int) returns int
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  update public.items set stock = coalesce(stock, 0) + p_delta, updated_at = now() where id = p_item returning stock into v;
  return v;
end $$;
revoke execute on function public.add_stock(uuid, int) from public, anon;
grant  execute on function public.add_stock(uuid, int) to authenticated;

-- Take sold quantities off counted items (or put them back with p_sign = 1).
create or replace function public.apply_stock(p_order uuid, p_sign int) returns void
language sql security definer set search_path = public as $$
  update public.items i set stock = coalesce(i.stock, 0) + p_sign * s.qty
    from (select oi.item_id, sum(oi.qty)::int as qty from public.order_items oi
           where oi.order_id = p_order and oi.item_id is not null group by oi.item_id) s,
         public.categories c
   where i.id = s.item_id and c.id = i.category_id and c.counted;
$$;
revoke execute on function public.apply_stock(uuid, int) from public, anon, authenticated;

-- Voided order: counts go back.
create or replace function public.orders_void_stock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'void' and old.status <> 'void' then perform public.apply_stock(new.id, 1); end if;
  return null;
end $$;
revoke execute on function public.orders_void_stock() from public, anon, authenticated;
drop trigger if exists orders_void_stock on public.orders;
create trigger orders_void_stock after update of status on public.orders
  for each row execute function public.orders_void_stock();

-- Register orders: same as before, plus counts come off once, the first time an order arrives.
create or replace function public.sync_order(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare o jsonb := p -> 'order'; v_new uuid;
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
  on conflict (id) do nothing
  returning id into v_new;

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

  if v_new is not null and coalesce(o->>'status','paid') <> 'void' then perform public.apply_stock(v_new, -1); end if;
  return o->>'id';
end $$;

-- Online orders: same as before, plus counted items can't go below 0.
create or replace function public.place_online_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.settings; v_id uuid; v_type text; v_pick timestamptz; v_local timestamp;
  v_name text; v_phone text; v_note text; l jsonb; it record;
  v_sub numeric := 0; v_togo numeric := 0; v_tax numeric; v_total numeric; v_rate numeric;
  v_bar boolean := false; v_kit boolean := false; v_n int; v_num text; v_count int := 0; v_lines jsonb := '[]';
begin
  select * into s from public.settings where id = 1;
  if not s.online_orders then raise exception 'orders_paused'; end if;

  v_id    := (p ->> 'id')::uuid;
  v_type  := case when p ->> 'order_type' = 'togo' then 'togo' else 'here' end;
  v_name  := left(btrim(coalesce(p ->> 'name', '')), 40);
  v_phone := left(btrim(coalesce(p ->> 'phone', '')), 24);
  v_note  := nullif(left(btrim(coalesce(p ->> 'note', '')), 240), '');
  v_pick  := (p ->> 'pickup_at')::timestamptz;
  if v_name = '' or length(regexp_replace(v_phone, '\D', '', 'g')) < 7 then raise exception 'bad_details'; end if;
  if v_pick is null or v_pick < now() + interval '10 minutes' or v_pick > now() + interval '7 days' then raise exception 'bad_time'; end if;
  v_local := v_pick at time zone 'America/Tegucigalpa';
  if not public.open_at(v_local) then raise exception 'closed_then'; end if;

  if exists (select 1 from public.orders where id = v_id) then
    return (select jsonb_build_object('id', id, 'number', number, 'total', total) from public.orders where id = v_id);
  end if;
  if (select count(*) from public.orders where source = 'online' and status = 'open' and customer_phone = v_phone) >= 3 then
    raise exception 'too_many';
  end if;

  for l in select * from jsonb_array_elements(coalesce(p -> 'lines', '[]')) loop
    v_count := v_count + 1;
    if v_count > 30 then raise exception 'too_big'; end if;
    select i.id, i.name ->> 'en' as nm, i.price, coalesce(i.togo_charge, c.togo_charge, 0) as tg, c.station, c.counted, i.stock
      into it
      from public.items i join public.categories c on c.id = i.category_id
     where i.id = (l ->> 'item_id')::uuid and i.active and i.show_online and i.available and c.active
       for update of i;
    if not found then raise exception 'item_unavailable'; end if;
    if coalesce((l ->> 'qty')::int, 0) not between 1 and 20 then raise exception 'bad_qty'; end if;
    if it.counted and coalesce(it.stock, 0) < (l ->> 'qty')::int then raise exception 'item_unavailable'; end if;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('item_id', it.id, 'name', it.nm, 'qty', (l ->> 'qty')::int,
      'unit_price', it.price, 'togo', case when v_type = 'togo' then it.tg else 0 end,
      'note', nullif(left(btrim(coalesce(l ->> 'note', '')), 120), ''), 'station', it.station));
    v_sub  := v_sub + it.price * (l ->> 'qty')::int;
    if v_type = 'togo' then v_togo := v_togo + it.tg * (l ->> 'qty')::int; end if;
    if it.station = 'bar' then v_bar := true; elsif it.station = 'kitchen' then v_kit := true; end if;
  end loop;
  if v_count = 0 then raise exception 'empty'; end if;

  v_rate := coalesce(s.tax_rate, 0);
  if s.prices_include_tax then
    v_total := round(v_sub + v_togo, 2);  v_tax := round(v_total - v_total / (1 + v_rate), 2);
  else
    v_tax := round((v_sub + v_togo) * v_rate, 2);  v_total := round(v_sub + v_togo + v_tax, 2);
  end if;

  select count(*) + 1 into v_n from public.orders
   where source = 'online' and (created_at at time zone 'America/Tegucigalpa')::date = public.hn_now()::date;
  v_num := 'W' || v_n;

  insert into public.orders (id, device, number, customer_name, customer_phone, note, order_type, source, status,
    subtotal, togo_total, tax, tip, total, created_at, pickup_at, bar_done_at, kitchen_done_at)
  values (v_id, 'web', v_num, v_name, v_phone, v_note, v_type, 'online', 'open',
    round(v_sub, 2), round(v_togo, 2), v_tax, 0, v_total, now(), v_pick,
    case when v_bar then null else now() end, case when v_kit then null else now() end);
  insert into public.order_items (id, order_id, item_id, name, qty, unit_price, togo_charge, note, station)
    select gen_random_uuid(), v_id, (x ->> 'item_id')::uuid, x ->> 'name', (x ->> 'qty')::int, (x ->> 'unit_price')::numeric,
           (x ->> 'togo')::numeric, x ->> 'note', x ->> 'station'
      from jsonb_array_elements(v_lines) x;
  perform public.apply_stock(v_id, -1);

  return jsonb_build_object('id', v_id, 'number', v_num, 'total', v_total);
end $$;
