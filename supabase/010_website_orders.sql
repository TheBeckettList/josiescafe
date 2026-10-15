-- 010 · Website ordering for Josie's World (v2). Additive: the v1.1 functions (place_online_order, online_order_status,
-- pay_online_order) stay for the old pages and the old register.
--
-- Rules from the notes:
--   * The guest is a NAME. No phone, no pickup time, no order number shown to them. Pay at the counter only.
--   * No online orders after the cutoff (settings.online_cutoff, 2:00 pm); the cafe stays open until 2:30.
--   * Guests can only ADD to an order, and only before it is paid. Cancel/change is verbal, done at the register.
--   * After sending they see the bar and kitchen with their own items: "Making it" until pickup, then "Picked up".
--   * Prices, to-go charges and tax are worked out here, never trusted from the browser. A dish that is out today
--     (switched off, or a base ran out) can't be ordered; an element that ran out is fine (the chips say "no bacon").

-- Shared by place and add: checks every line and prices it. p_lines = [{item_id, qty, note, chips[]}]
create or replace function public.price_lines(p_lines jsonb, p_type text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  l jsonb; it record; ds jsonb := public.dish_state(); outl jsonb := '[]'; sub numeric := 0; togo numeric := 0; n int := 0; q int; ch jsonb;
begin
  for l in select * from jsonb_array_elements(coalesce(p_lines, '[]')) loop
    n := n + 1;
    if n > 30 then raise exception 'too_big'; end if;
    q := coalesce((l ->> 'qty')::int, 0);
    if q not between 1 and 20 then raise exception 'bad_qty'; end if;
    select i.id, i.name ->> 'en' as nm, i.price, coalesce(i.togo_charge, c.togo_charge, 0) as tg, c.station, c.counted, i.stock
      into it
      from public.items i join public.categories c on c.id = i.category_id
     where i.id = (l ->> 'item_id')::uuid and i.active and i.show_online and i.available and c.active
       for update of i;
    if not found then raise exception 'item_unavailable'; end if;
    if coalesce((ds -> (it.id)::text ->> 'out')::boolean, false) then raise exception 'item_unavailable'; end if;
    if it.counted and coalesce(it.stock, 0) < q then raise exception 'item_unavailable'; end if;
    select coalesce(jsonb_agg(z.c2), '[]') into ch from (
      select jsonb_build_object('type', k ->> 'type', 'ingredient_id', k ->> 'ingredient_id',
                                'with_id', k ->> 'with_id', 'diet', k ->> 'diet') as c2
        from jsonb_array_elements(coalesce(l -> 'chips', '[]')) k
       where k ->> 'type' in ('no', 'add', 'swap', 'back') and coalesce(k ->> 'ingredient_id', '') ~ '^[0-9a-f-]{36}$'
       limit 12) z;
    outl := outl || jsonb_build_array(jsonb_build_object('item_id', it.id, 'name', it.nm, 'qty', q, 'unit_price', it.price,
      'togo', case when p_type = 'togo' then it.tg else 0 end,
      'note', nullif(left(btrim(coalesce(l ->> 'note', '')), 120), ''), 'station', it.station, 'chips', ch));
    sub := sub + it.price * q;
    if p_type = 'togo' then togo := togo + it.tg * q; end if;
  end loop;
  if n = 0 then raise exception 'empty'; end if;
  return jsonb_build_object('lines', outl, 'sub', sub, 'togo', togo);
end $$;

-- Is the website taking orders right now? (open, on and before the cutoff). Returns the reason when it isn't.
create or replace function public.online_gate() returns text
language plpgsql stable security definer set search_path = public as $$
declare s public.settings;
begin
  select * into s from public.settings where id = 1;
  if not s.online_orders then return 'orders_paused'; end if;
  if not public.open_at(public.hn_now()) then return 'closed_now'; end if;
  if public.hn_now()::time >= s.online_cutoff then return 'after_cutoff'; end if;
  return null;
end $$;

-- p = { id, name, order_type, diets[], note, lines:[{item_id, qty, note, chips[]}] }  ->  { id, number, total }
create or replace function public.place_online_order2(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.settings; gate text; v_id uuid := (p ->> 'id')::uuid; v_type text; v_name text; v_note text;
  pr jsonb; x jsonb; v_sub numeric; v_togo numeric; v_tax numeric; v_total numeric; v_rate numeric;
  v_bar boolean := false; v_kit boolean := false; v_n int; v_num text; pid uuid; pmap jsonb := '{}';
begin
  select * into s from public.settings where id = 1;
  gate := public.online_gate();
  if gate is not null then raise exception '%', gate; end if;
  if exists (select 1 from public.orders where id = v_id) then
    return (select jsonb_build_object('id', id, 'number', number, 'total', total) from public.orders where id = v_id);
  end if;
  v_name := left(btrim(coalesce(p ->> 'name', '')), 40);
  if v_name = '' then raise exception 'bad_details'; end if;
  v_type := case when p ->> 'order_type' = 'togo' then 'togo' else 'here' end;
  v_note := nullif(left(btrim(coalesce(p ->> 'note', '')), 240), '');
  if (select count(*) from public.orders where source = 'online' and phase = 'open' and created_at > now() - interval '3 hours') >= 15 then
    raise exception 'too_many';
  end if;

  pr := public.price_lines(p -> 'lines', v_type);
  v_sub := (pr ->> 'sub')::numeric; v_togo := (pr ->> 'togo')::numeric;
  v_rate := coalesce(s.tax_rate, 0);
  if s.prices_include_tax then
    v_total := round(v_sub + v_togo, 2); v_tax := round(v_total - v_total / (1 + v_rate), 2);
  else
    v_tax := round((v_sub + v_togo) * v_rate, 2); v_total := round(v_sub + v_togo + v_tax, 2);
  end if;
  for x in select * from jsonb_array_elements(pr -> 'lines') loop
    if x ->> 'station' = 'bar' then v_bar := true; elsif x ->> 'station' = 'kitchen' then v_kit := true; end if;
  end loop;

  select count(*) + 1 into v_n from public.orders where source = 'online' and (created_at at time zone 'America/Tegucigalpa')::date = public.hn_now()::date;
  v_num := 'W' || v_n;

  insert into public.orders (id, device, number, customer_name, note, order_type, source, status, subtotal, togo_total, tax, tip, total,
    created_at, bar_done_at, kitchen_done_at, diets, phase)
  values (v_id, 'web', v_num, v_name, v_note, v_type, 'online', 'open', round(v_sub, 2), round(v_togo, 2), v_tax, 0, v_total,
    now(), case when v_bar then null else now() end, case when v_kit then null else now() end,
    coalesce(array(select jsonb_array_elements_text(coalesce(p -> 'diets', '[]'))), '{}'), 'open');

  for x in select * from jsonb_array_elements(pr -> 'lines') loop
    if x ->> 'station' in ('bar', 'kitchen') and not (pmap ? (x ->> 'station')) then
      pid := gen_random_uuid();
      insert into public.order_pieces (id, order_id, station, kind) values (pid, v_id, x ->> 'station', 'original');
      pmap := pmap || jsonb_build_object(x ->> 'station', pid);
    end if;
    insert into public.order_items (id, order_id, item_id, name, qty, unit_price, togo_charge, note, station, chips, piece_id)
    values (gen_random_uuid(), v_id, (x ->> 'item_id')::uuid, x ->> 'name', (x ->> 'qty')::int, (x ->> 'unit_price')::numeric,
            (x ->> 'togo')::numeric, x ->> 'note', x ->> 'station', x -> 'chips', nullif(pmap ->> (x ->> 'station'), '')::uuid);
  end loop;
  perform public.apply_stock(v_id, -1);
  return jsonb_build_object('id', v_id, 'number', v_num, 'total', v_total);
end $$;

-- The guest's own order, by its unguessable id. They see the bar and the kitchen with their items, never a number.
create or replace function public.order_status2(p_id uuid, p_lang text default 'en') returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'name', o.customer_name, 'type', o.order_type, 'total', o.total, 'paid', o.status = 'paid',
    'state', case when o.status = 'void' then 'cancelled' when o.phase = 'done' then 'picked_up' else 'making' end,
    'can_add', o.phase = 'open' and o.status = 'open' and public.online_gate() is null,
    'gate', public.online_gate(),
    'items', (select coalesce(jsonb_agg(jsonb_build_object('station', i.station, 'qty', i.qty,
                'name', coalesce(it.name ->> p_lang, it.name ->> 'en', i.name), 'stopped', i.stopped_at is not null,
                'chips', (select coalesce(jsonb_agg(jsonb_build_object('type', ch ->> 'type',
                           'ing', coalesce(g.name ->> p_lang, g.name ->> 'en'), 'icon', g.icon,
                           'with', coalesce(w.name ->> p_lang, w.name ->> 'en'), 'with_icon', w.icon)), '[]')
                         from jsonb_array_elements(i.chips) ch
                         left join public.ingredients g on g.id = nullif(ch ->> 'ingredient_id', '')::uuid
                         left join public.ingredients w on w.id = nullif(ch ->> 'with_id', '')::uuid)) order by i.id), '[]')
               from public.order_items i left join public.items it on it.id = i.item_id where i.order_id = o.id))
  from public.orders o where o.id = p_id and o.source = 'online';
$$;

-- Guests can only add. p = { order_id, lines:[...] }. Each station gets its own add-on piece at the back of its queue.
create or replace function public.add_to_online_order2(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.settings; o public.orders; pr jsonb; x jsonb; v_rate numeric; add_total numeric; add_tax numeric; pid uuid; par uuid; pmap jsonb := '{}';
begin
  select * into s from public.settings where id = 1;
  select * into o from public.orders where id = (p ->> 'order_id')::uuid and source = 'online' for update;
  if o.id is null then raise exception 'not_found'; end if;
  if o.phase <> 'open' or o.status <> 'open' then raise exception 'locked'; end if;
  if public.online_gate() is not null then raise exception '%', public.online_gate(); end if;
  pr := public.price_lines(p -> 'lines', o.order_type);
  v_rate := coalesce(s.tax_rate, 0);
  if s.prices_include_tax then
    add_total := round((pr ->> 'sub')::numeric + (pr ->> 'togo')::numeric, 2); add_tax := round(add_total - add_total / (1 + v_rate), 2);
  else
    add_tax := round(((pr ->> 'sub')::numeric + (pr ->> 'togo')::numeric) * v_rate, 2);
    add_total := round((pr ->> 'sub')::numeric + (pr ->> 'togo')::numeric + add_tax, 2);
  end if;
  for x in select * from jsonb_array_elements(pr -> 'lines') loop
    if x ->> 'station' in ('bar', 'kitchen') and not (pmap ? (x ->> 'station')) then
      pid := gen_random_uuid();
      select op.id into par from public.order_pieces op where op.order_id = o.id and op.station = x ->> 'station' and op.kind = 'original';
      insert into public.order_pieces (id, order_id, station, kind, parent_id)
      values (pid, o.id, x ->> 'station', case when par is null then 'original' else 'addon' end, par);
      pmap := pmap || jsonb_build_object(x ->> 'station', pid);
    end if;
    insert into public.order_items (id, order_id, item_id, name, qty, unit_price, togo_charge, note, station, chips, piece_id)
    values (gen_random_uuid(), o.id, (x ->> 'item_id')::uuid, x ->> 'name', (x ->> 'qty')::int, (x ->> 'unit_price')::numeric,
            (x ->> 'togo')::numeric, x ->> 'note', x ->> 'station', x -> 'chips', nullif(pmap ->> (x ->> 'station'), '')::uuid);
    if x ->> 'station' = 'bar' then update public.orders set bar_done_at = null where id = o.id; end if;
    if x ->> 'station' = 'kitchen' then update public.orders set kitchen_done_at = null where id = o.id; end if;
  end loop;
  update public.orders set subtotal = subtotal + round((pr ->> 'sub')::numeric, 2), togo_total = togo_total + round((pr ->> 'togo')::numeric, 2),
         tax = tax + add_tax, total = total + add_total where id = o.id;
  -- counted items for just the new lines
  update public.items i set stock = coalesce(i.stock, 0) - z.q
    from (select (e ->> 'item_id')::uuid as item_id, sum((e ->> 'qty')::int) as q from jsonb_array_elements(pr -> 'lines') e group by 1) z,
         public.categories c
   where i.id = z.item_id and c.id = i.category_id and c.counted;
  return jsonb_build_object('ok', true, 'total', o.total + add_total);
end $$;

revoke execute on function public.price_lines(jsonb, text)          from public, anon, authenticated;
revoke execute on function public.online_gate()                     from public;
revoke execute on function public.place_online_order2(jsonb)        from public;
revoke execute on function public.order_status2(uuid, text)         from public;
revoke execute on function public.add_to_online_order2(jsonb)       from public;
grant  execute on function public.online_gate()                     to anon, authenticated;
grant  execute on function public.place_online_order2(jsonb)        to anon, authenticated;
grant  execute on function public.order_status2(uuid, text)         to anon, authenticated;
grant  execute on function public.add_to_online_order2(jsonb)       to anon, authenticated;
