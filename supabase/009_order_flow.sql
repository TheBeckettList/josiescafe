-- 009 · Order flow for Josie's World: orders with sticks, payment later, add-on pieces, stops, completing a number
-- with Undo, the live floor, and the read-only ticket feeds. Additive: nothing the v1.2 register uses is changed.
--
-- Every write below is idempotent (ids are made on the device) so the offline queue can safely retry.
-- Who may call: the POS device login (is_pos). Staff-level attribution is optional (a PIN-session token).
-- Words: a "number" is a stick number (for here) or a counter code (to go). A number can hold several orders;
-- the number completes as one: all orders on it must be paid first. phase = 'open' | 'done' is the only status.

-- ═════════════════════════ floor seed: the tables on the map and the sticks ═════════════════════════
alter table public.tables
  add column if not exists w      numeric not null default 11,
  add column if not exists h      numeric not null default 10,
  add column if not exists picnic boolean not null default false;

insert into public.tables (label, area, x, y, w, h, picnic, seats)
select * from (values
  ('1', 'inside',      8,   46.5, 11, 10, false, 4),
  ('2', 'inside',      23,  46.5, 11, 10, false, 4),
  ('3', 'inside',      38,  46.5, 11, 10, false, 4),
  ('4', 'deck',        8,   66,   11, 10, false, 4),
  ('5', 'outside',     55,  66,   9,  12, true,  6),
  ('6', 'outside',     68,  66,   9,  12, true,  6),
  ('7', 'schoolhouse', 78,  16,   15, 8,  false, 8)
) as v(label, area, x, y, w, h, picnic, seats)
where not exists (select 1 from public.tables);

insert into public.sticks (number) select g from generate_series(1, 20) g on conflict (number) do nothing;

-- ═════════════════════════ ring up (and optionally pay) ═════════════════════════
-- p = { order:{id, device, number, customer_name, order_type, status, subtotal, togo_total, tax, tip, total, staff_name,
--               created_by, created_at, paid_at, has_bar, has_kitchen, stick_number, diets[], note},
--        items:[{id, item_id, name, qty, unit_price, togo_charge, note, station, chips[], piece_id}],
--        pieces:[{id, station, kind:'original'|'addon'}], payments:[...] }
-- An add-on piece is linked to the stick's first open original piece at that station; if there is none it becomes an original.
create or replace function public.sync_order2(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  o   jsonb := p -> 'order';
  oid uuid  := (o ->> 'id')::uuid;
  stk int   := nullif(o ->> 'stick_number', '')::int;
  made timestamptz := coalesce((o ->> 'created_at')::timestamptz, now());
  pc  jsonb; par uuid; kind text; n int;
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  if stk is not null then insert into public.sticks (number) values (stk) on conflict (number) do nothing; end if;

  insert into public.orders (id, device, number, customer_name, order_type, source, status, subtotal, togo_total, tax, tip, total,
    staff_name, created_by, created_at, paid_at, bar_done_at, kitchen_done_at, stick_number, diets, note, phase)
  values (oid, o ->> 'device', o ->> 'number', nullif(o ->> 'customer_name', ''), coalesce(o ->> 'order_type', 'here'), 'pos',
    coalesce(o ->> 'status', 'paid'),
    coalesce((o ->> 'subtotal')::numeric, 0), coalesce((o ->> 'togo_total')::numeric, 0), coalesce((o ->> 'tax')::numeric, 0),
    coalesce((o ->> 'tip')::numeric, 0), coalesce((o ->> 'total')::numeric, 0),
    o ->> 'staff_name', nullif(o ->> 'created_by', '')::uuid, made, (o ->> 'paid_at')::timestamptz,
    case when (o ->> 'has_bar')::boolean then null else made end,
    case when (o ->> 'has_kitchen')::boolean then null else made end,
    stk, coalesce(array(select jsonb_array_elements_text(coalesce(o -> 'diets', '[]'))), '{}'),
    nullif(o ->> 'note', ''), 'open')
  on conflict (id) do nothing;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('ok', true, 'dup', true); end if;

  -- ring up moves the stick from the home pot to the waiting pot
  if stk is not null then
    update public.sticks set state = 'waiting' where number = stk and state = 'home';
  end if;

  for pc in select * from jsonb_array_elements(coalesce(p -> 'pieces', '[]')) loop
    kind := coalesce(pc ->> 'kind', 'original'); par := null;
    if kind = 'addon' then
      select op.id into par from public.order_pieces op join public.orders oo on oo.id = op.order_id
       where op.kind = 'original' and op.station = pc ->> 'station' and oo.stick_number = stk and oo.phase = 'open' and oo.id <> oid
       order by op.created_at limit 1;
      if par is null then kind := 'original'; end if;
    end if;
    insert into public.order_pieces (id, order_id, station, kind, parent_id, created_at)
    values ((pc ->> 'id')::uuid, oid, pc ->> 'station', kind, par, made) on conflict (id) do nothing;
  end loop;

  insert into public.order_items (id, order_id, item_id, name, qty, unit_price, togo_charge, note, station, chips, piece_id)
  select (i ->> 'id')::uuid, oid, nullif(i ->> 'item_id', '')::uuid, i ->> 'name', (i ->> 'qty')::int,
         (i ->> 'unit_price')::numeric, coalesce((i ->> 'togo_charge')::numeric, 0), nullif(i ->> 'note', ''),
         coalesce(i ->> 'station', 'kitchen'), coalesce(i -> 'chips', '[]'), nullif(i ->> 'piece_id', '')::uuid
  from jsonb_array_elements(coalesce(p -> 'items', '[]')) i
  on conflict (id) do nothing;

  insert into public.payments (id, order_id, method, amount, tip, usd_amount, usd_rate, card_ref, created_at)
  select (x ->> 'id')::uuid, oid, x ->> 'method', (x ->> 'amount')::numeric, coalesce((x ->> 'tip')::numeric, 0),
         (x ->> 'usd_amount')::numeric, (x ->> 'usd_rate')::numeric, nullif(x ->> 'card_ref', ''),
         coalesce((x ->> 'created_at')::timestamptz, now())
  from jsonb_array_elements(coalesce(p -> 'payments', '[]')) x
  on conflict (id) do nothing;

  return jsonb_build_object('ok', true);
end $$;

-- ═════════════════════════ take payment on orders already rung up ═════════════════════════
-- p = { payments:[{id, order_id, method, amount, tip, usd_amount, usd_rate, card_ref, created_at}] }
-- amount is lempiras incl. a card tip. Safe to repeat: a payment id is only applied once.
create or replace function public.pay_orders(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare x jsonb; n int; paid int := 0;
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  for x in select * from jsonb_array_elements(coalesce(p -> 'payments', '[]')) loop
    insert into public.payments (id, order_id, method, amount, tip, usd_amount, usd_rate, card_ref, created_at)
    values ((x ->> 'id')::uuid, (x ->> 'order_id')::uuid, x ->> 'method', (x ->> 'amount')::numeric,
            coalesce((x ->> 'tip')::numeric, 0), (x ->> 'usd_amount')::numeric, (x ->> 'usd_rate')::numeric,
            nullif(x ->> 'card_ref', ''), coalesce((x ->> 'created_at')::timestamptz, now()))
    on conflict (id) do nothing;
    get diagnostics n = row_count;
    if n > 0 then
      update public.orders set status = 'paid', paid_at = coalesce(paid_at, coalesce((x ->> 'created_at')::timestamptz, now())),
             tip = tip + coalesce((x ->> 'tip')::numeric, 0), total = total + coalesce((x ->> 'tip')::numeric, 0)
       where id = (x ->> 'order_id')::uuid and status = 'open';
      paid := paid + 1;
    end if;
  end loop;
  return jsonb_build_object('ok', true, 'paid', paid);
end $$;

-- ═════════════════════════ completing a number, and Undo ═════════════════════════
-- Stick back / number complete / picked up are all this one call. Everything on the number must be paid first.
-- p = { order_ids:[...], at, token }  →  { ok:true } or { ok:false, unpaid:[order ids] }
create or replace function public.complete_number(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ids uuid[]; at_ timestamptz := coalesce((p ->> 'at')::timestamptz, now()); unpaid uuid[]; who uuid; stks int[];
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  ids := array(select jsonb_array_elements_text(coalesce(p -> 'order_ids', '[]'))::uuid);
  select coalesce(array_agg(id), '{}') into unpaid from public.orders where id = any(ids) and phase = 'open' and status <> 'paid';
  if cardinality(unpaid) > 0 then return jsonb_build_object('ok', false, 'unpaid', to_jsonb(unpaid)); end if;
  select (public.person_of(nullif(p ->> 'token', '')::uuid)).id into who;
  select coalesce(array_agg(distinct stick_number), '{}') into stks from public.orders where id = any(ids) and stick_number is not null;
  update public.orders set phase = 'done', completed_at = at_, completed_by = who,
         bar_done_at = coalesce(bar_done_at, at_), kitchen_done_at = coalesce(kitchen_done_at, at_)
   where id = any(ids) and phase = 'open';
  -- the stick goes back to the home pot unless another open order still holds it
  update public.sticks s set state = 'home', table_id = null
   where s.number = any(stks) and not exists (select 1 from public.orders o where o.stick_number = s.number and o.phase = 'open');
  return jsonb_build_object('ok', true);
end $$;

-- p = { order_ids:[...], restore:{ stick, table_id } }  Reopens every order on the number; tickets return to the screens.
create or replace function public.undo_complete(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ids uuid[]; stk int := nullif(p #>> '{restore,stick}', '')::int; tid uuid := nullif(p #>> '{restore,table_id}', '')::uuid;
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  ids := array(select jsonb_array_elements_text(coalesce(p -> 'order_ids', '[]'))::uuid);
  update public.orders o set phase = 'open', completed_at = null, completed_by = null,
         bar_done_at = case when exists (select 1 from public.order_items i where i.order_id = o.id and i.station = 'bar') then null else bar_done_at end,
         kitchen_done_at = case when exists (select 1 from public.order_items i where i.order_id = o.id and i.station = 'kitchen') then null else kitchen_done_at end
   where id = any(ids) and phase = 'done';
  if stk is not null then
    update public.sticks set state = case when tid is null then 'waiting' else 'table' end, table_id = tid where number = stk;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ═════════════════════════ placing a stick on a table ═════════════════════════
-- p = { stick, table_id }  table_id null sends it back to the waiting pot. One stick per table.
create or replace function public.place_stick(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare stk int := (p ->> 'stick')::int; tid uuid := nullif(p ->> 'table_id', '')::uuid;
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  if tid is not null and exists (select 1 from public.sticks where table_id = tid and number <> stk) then
    return jsonb_build_object('ok', false, 'occupied', true);
  end if;
  insert into public.sticks (number) values (stk) on conflict (number) do nothing;
  update public.sticks set state = case when tid is null then 'waiting' else 'table' end, table_id = tid where number = stk;
  return jsonb_build_object('ok', true);
end $$;

-- ═════════════════════════ stop / change after send (the POS person only) ═════════════════════════
-- p = { alert_id, order_id, order_item_id, kind:'stop'|'change', text, already_made }
-- Strikes the line through (kept, not deleted) and pins an alert at the top of that station's queue.
-- The alert clears itself (ticket_alerts.clears_at). Nothing for the cooks to tap.
create or replace function public.stop_item(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare iid uuid := (p ->> 'order_item_id')::uuid; st text; n int; kind text := coalesce(p ->> 'kind', 'stop');
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  select station into st from public.order_items where id = iid;
  if st is null or st = 'none' then return jsonb_build_object('ok', false); end if;
  if kind = 'stop' then update public.order_items set stopped_at = coalesce(stopped_at, now()) where id = iid; end if;
  insert into public.ticket_alerts (id, order_id, order_item_id, station, kind, text, already_made)
  values ((p ->> 'alert_id')::uuid, (p ->> 'order_id')::uuid, iid, st, kind, nullif(p ->> 'text', ''),
          coalesce((p ->> 'already_made')::boolean, false))
  on conflict (id) do nothing;
  return jsonb_build_object('ok', true);
end $$;

-- Cancel a whole sent order (POS person, money involved): stops every line and closes it.
create or replace function public.cancel_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare oid uuid := (p ->> 'order_id')::uuid; i record; at_ timestamptz := coalesce((p ->> 'at')::timestamptz, now());
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  for i in select id, station from public.order_items where order_id = oid and station in ('bar', 'kitchen') and stopped_at is null loop
    update public.order_items set stopped_at = at_ where id = i.id;
    insert into public.ticket_alerts (id, order_id, order_item_id, station, kind, text)
    values (gen_random_uuid(), oid, i.id, i.station, 'stop', null);
  end loop;
  update public.orders set status = 'void', phase = 'done', completed_at = at_,
         bar_done_at = coalesce(bar_done_at, at_), kitchen_done_at = coalesce(kitchen_done_at, at_)
   where id = oid;
  update public.sticks s set state = 'home', table_id = null
   where s.number = (select stick_number from public.orders where id = oid)
     and not exists (select 1 from public.orders o where o.stick_number = s.number and o.phase = 'open');
  return jsonb_build_object('ok', true);
end $$;

-- ═════════════════════════ the live floor (registers and the manager's map poll this) ═════════════════════════
create or replace function public.floor_state() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.is_pos() then jsonb_build_object(
    'now', now(),
    'tables', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'label', t.label, 'area', t.area, 'x', t.x, 'y', t.y,
                 'w', t.w, 'h', t.h, 'picnic', t.picnic) order by t.label), '[]') from public.tables t where t.active),
    'sticks', (select coalesce(jsonb_agg(jsonb_build_object('number', s.number, 'state', s.state, 'table_id', s.table_id) order by s.number), '[]') from public.sticks s),
    'open', (select coalesce(jsonb_agg(f order by f.created_at), '[]') from (
        select o.id, o.number, o.customer_name as name, o.order_type as type, o.source, o.stick_number as stick, o.status, o.total, o.diets,
               o.created_at, o.pickup_at,
               (select string_agg(i.qty || ' ' || i.name, ' · ' order by i.name) from public.order_items i where i.order_id = o.id and i.stopped_at is null) as items
          from public.orders o where o.phase = 'open' and o.status <> 'void') f),
    'done', (select coalesce(jsonb_agg(f order by f.completed_at desc), '[]') from (
        select o.id, o.number, o.customer_name as name, o.order_type as type, o.stick_number as stick, o.total, o.completed_at, o.created_at,
               t.id as table_id
          from public.orders o left join public.sticks s on s.number = o.stick_number left join public.tables t on t.id = s.table_id
         where o.phase = 'done' and o.status <> 'void' and o.completed_at > now() - interval '40 minutes'
         order by o.completed_at desc limit 30) f),
    'lights', (select coalesce(jsonb_object_agg(g.id, g.light), '{}') from public.ingredients g where g.active),
    'dish_state', public.dish_state()
  ) end;
$$;

-- ═════════════════════════ tickets: kitchen and bar, read only ═════════════════════════
-- One card per piece (an add-on is its own card, at the back of the queue, linked to the original). A card stays while its
-- number is open and for 10 minutes after the number completes (Undo inside that window brings it back as it was).
-- Chips resolve to names and icons in the phone's language; a chip made by a diet carries the diet's honest wording.
create or replace function public.tickets2_build(p_station text, p_lang text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'now', now(),
    'alerts', (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'kind', a.kind, 'text', a.text, 'made', a.already_made,
                 'stick', o.stick_number, 'name', o.customer_name, 'item', i.name, 'clears_at', a.clears_at, 'created_at', a.created_at)
                 order by a.created_at), '[]')
               from public.ticket_alerts a join public.orders o on o.id = a.order_id left join public.order_items i on i.id = a.order_item_id
              where a.station = p_station and a.clears_at > now()),
    'tickets', (select coalesce(jsonb_agg(c order by c.created_at), '[]') from (
      select op.id, op.kind, op.created_at, o.id as order_id, o.number, o.customer_name as name, o.order_type as type, o.source,
             o.stick_number as stick, o.diets, o.note,
             (select oo.stick_number from public.order_pieces pp join public.orders oo on oo.id = pp.order_id where pp.id = op.parent_id) as parent_stick,
             (select count(*) from public.order_pieces ad where ad.parent_id = op.id) as addons_waiting,
             (select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'qty', i.qty,
                'name', coalesce(it.name ->> p_lang, it.name ->> 'en', i.name), 'note', i.note, 'stopped', i.stopped_at is not null,
                'chips', (select coalesce(jsonb_agg(jsonb_build_object('type', ch ->> 'type',
                           'ing', jsonb_build_object('name', coalesce(g.name ->> p_lang, g.name ->> 'en'), 'icon', g.icon),
                           'with', case when w.id is null then null else jsonb_build_object('name', coalesce(w.name ->> p_lang, w.name ->> 'en'), 'icon', w.icon) end,
                           'diet', coalesce(d.claim ->> p_lang, d.claim ->> 'en'))), '[]')
                         from jsonb_array_elements(i.chips) ch
                         left join public.ingredients g on g.id = nullif(ch ->> 'ingredient_id', '')::uuid
                         left join public.ingredients w on w.id = nullif(ch ->> 'with_id', '')::uuid
                         left join public.diets d on d.key = ch ->> 'diet')) order by i.id), '[]')
                from public.order_items i left join public.items it on it.id = i.item_id where i.piece_id = op.id) as items
        from public.order_pieces op join public.orders o on o.id = op.order_id
       where op.station = p_station and o.status <> 'void'
         and (o.phase = 'open' or o.completed_at > now() - interval '10 minutes')) c)
  );
$$;

-- Phones: the kitchen or bar enters the 6-digit ticket code once (same code as v1.2).
create or replace function public.tickets2_feed(p_code text, p_station text, p_lang text default 'en') returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if p_station not in ('bar', 'kitchen') then return jsonb_build_object('ok', false); end if;
  if not public.tickets_ok(p_code) then return jsonb_build_object('ok', false); end if;
  return jsonb_build_object('ok', true) || public.tickets2_build(p_station, coalesce(nullif(p_lang, ''), 'en'));
end $$;

-- Popups on the map (a signed-in device): same cards, no code.
create or replace function public.tickets2_pos(p_station text, p_lang text default 'en') returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  return jsonb_build_object('ok', true) || public.tickets2_build(p_station, coalesce(nullif(p_lang, ''), 'en'));
end $$;

-- ═════════════════════════ API permissions ═════════════════════════
revoke execute on function public.sync_order2(jsonb)             from public, anon;
revoke execute on function public.pay_orders(jsonb)              from public, anon;
revoke execute on function public.complete_number(jsonb)         from public, anon;
revoke execute on function public.undo_complete(jsonb)           from public, anon;
revoke execute on function public.place_stick(jsonb)             from public, anon;
revoke execute on function public.stop_item(jsonb)               from public, anon;
revoke execute on function public.cancel_order(jsonb)            from public, anon;
revoke execute on function public.floor_state()                  from public, anon;
revoke execute on function public.tickets2_build(text, text)     from public, anon, authenticated;
revoke execute on function public.tickets2_feed(text, text, text) from public;
revoke execute on function public.tickets2_pos(text, text)       from public, anon;
grant  execute on function public.sync_order2(jsonb)             to authenticated;
grant  execute on function public.pay_orders(jsonb)              to authenticated;
grant  execute on function public.complete_number(jsonb)         to authenticated;
grant  execute on function public.undo_complete(jsonb)           to authenticated;
grant  execute on function public.place_stick(jsonb)             to authenticated;
grant  execute on function public.stop_item(jsonb)              to authenticated;
grant  execute on function public.cancel_order(jsonb)            to authenticated;
grant  execute on function public.floor_state()                  to authenticated;
grant  execute on function public.tickets2_feed(text, text, text) to anon, authenticated;
grant  execute on function public.tickets2_pos(text, text)       to authenticated;
