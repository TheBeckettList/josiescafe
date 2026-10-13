-- Josie's Cafe · v2: open/closed switch, online ordering (pick up, pay at the counter)
-- Run once in the Supabase SQL editor, after 001 and 002.

-- ── Settings: closed days, a note for customers, online orders on/off ──
alter table public.settings
  add column if not exists closed_until  date,                          -- closed through this day (Honduras date); null = normal hours
  add column if not exists closed_note   text not null default '',      -- shown on the website while closed
  add column if not exists online_orders boolean not null default true; -- pause online ordering without closing

-- Real hours, as listed by Sally Sees (Utila guide): Tue–Sat 6:15am–2:30pm, closed Sun & Mon.
-- Change any time in POS › Manage › Money & hours.
update public.settings
   set hours = '{"mon":"closed","tue":"6:15-14:30","wed":"6:15-14:30","thu":"6:15-14:30","fri":"6:15-14:30","sat":"6:15-14:30","sun":"closed"}',
       updated_at = now()
 where id = 1;

-- ── Orders: online orders carry a pick-up time, a phone number and a note ──
alter table public.orders
  add column if not exists pickup_at      timestamptz,
  add column if not exists customer_phone text,
  add column if not exists note           text;
create index if not exists orders_open_online on public.orders (pickup_at) where source = 'online' and status = 'open';

-- Honduras is UTC-6 all year.
create or replace function public.hn_now() returns timestamp
language sql stable as $$ select (now() at time zone 'America/Tegucigalpa') $$;

-- Is the cafe open at this Honduras-local moment (by weekly hours and the closed switch)?
create or replace function public.open_at(p_local timestamp) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare s public.settings; k text; r text; a text[]; f int; t int; m int;
begin
  select * into s from public.settings where id = 1;
  if s.closed_until is not null and p_local::date <= s.closed_until then return false; end if;
  k := (array['sun','mon','tue','wed','thu','fri','sat'])[extract(dow from p_local)::int + 1];
  r := replace(coalesce(s.hours ->> k, 'closed'), ' ', '');
  if r !~ '^\d{1,2}:\d{2}-\d{1,2}:\d{2}$' then return false; end if;
  a := regexp_split_to_array(r, '[-:]');
  f := a[1]::int * 60 + a[2]::int;  t := a[3]::int * 60 + a[4]::int;
  m := extract(hour from p_local)::int * 60 + extract(minute from p_local)::int;
  return m >= f and m < t;
end $$;

-- ── Place an online order (anyone, no sign-in) ─────────────────────
-- p = {id, name, phone, order_type, pickup_at (ISO, UTC), note, lines:[{item_id, qty, note}]}
-- Prices, to-go charges and tax are worked out here from the menu, never trusted from the browser.
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

  -- same id twice (a retried request) returns the first order
  if exists (select 1 from public.orders where id = v_id) then
    return (select jsonb_build_object('id', id, 'number', number, 'total', total) from public.orders where id = v_id);
  end if;
  -- a little brake on abuse: at most 3 open online orders per phone number
  if (select count(*) from public.orders where source = 'online' and status = 'open' and customer_phone = v_phone) >= 3 then
    raise exception 'too_many';
  end if;

  for l in select * from jsonb_array_elements(coalesce(p -> 'lines', '[]')) loop
    v_count := v_count + 1;
    if v_count > 30 then raise exception 'too_big'; end if;
    select i.id, i.name ->> 'en' as nm, i.price, coalesce(i.togo_charge, c.togo_charge, 0) as tg, c.station
      into it
      from public.items i join public.categories c on c.id = i.category_id
     where i.id = (l ->> 'item_id')::uuid and i.active and i.show_online and i.available and c.active;
    if not found then raise exception 'item_unavailable'; end if;
    if coalesce((l ->> 'qty')::int, 0) not between 1 and 20 then raise exception 'bad_qty'; end if;
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

  -- W1, W2… per Honduras day, so the counter can call it out
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

  return jsonb_build_object('id', v_id, 'number', v_num, 'total', v_total);
end $$;

-- ── The customer's own order, by its (unguessable) id ──────────────
create or replace function public.online_order_status(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('number', number, 'status', status, 'pickup_at', pickup_at, 'total', total,
           'order_type', order_type, 'ready', (bar_done_at is not null and kitchen_done_at is not null))
    from public.orders where id = p_id and source = 'online';
$$;

-- ── The register takes payment for an online order at pick-up ──────
-- p = {order:{id, order_type, togo_total, tax, tip, total, staff_name, paid_at}, payments:[…]} · safe to retry
create or replace function public.pay_online_order(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare o jsonb := p -> 'order';
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  update public.orders set status = 'paid', order_type = coalesce(o ->> 'order_type', order_type),
         togo_total = coalesce((o ->> 'togo_total')::numeric, togo_total), tax = coalesce((o ->> 'tax')::numeric, tax),
         tip = coalesce((o ->> 'tip')::numeric, 0), total = coalesce((o ->> 'total')::numeric, total),
         staff_name = o ->> 'staff_name', paid_at = coalesce((o ->> 'paid_at')::timestamptz, now())
   where id = (o ->> 'id')::uuid and source = 'online' and status = 'open';
  insert into public.payments (id, order_id, method, amount, tip, usd_amount, usd_rate, card_ref, created_at)
  select (x ->> 'id')::uuid, (o ->> 'id')::uuid, x ->> 'method', (x ->> 'amount')::numeric,
         coalesce((x ->> 'tip')::numeric, 0), (x ->> 'usd_amount')::numeric, (x ->> 'usd_rate')::numeric,
         nullif(x ->> 'card_ref', ''), coalesce((x ->> 'created_at')::timestamptz, now())
    from jsonb_array_elements(coalesce(p -> 'payments', '[]')) x
  on conflict (id) do nothing;
  return o ->> 'id';
end $$;

revoke execute on function public.place_online_order(jsonb)  from public;
revoke execute on function public.pay_online_order(jsonb)    from public, anon;
revoke execute on function public.open_at(timestamp)         from public;
grant  execute on function public.place_online_order(jsonb)  to anon, authenticated;
grant  execute on function public.online_order_status(uuid)  to anon, authenticated;
grant  execute on function public.pay_online_order(jsonb)    to authenticated;
grant  execute on function public.open_at(timestamp)         to anon, authenticated;
grant  execute on function public.hn_now()                   to anon, authenticated;
