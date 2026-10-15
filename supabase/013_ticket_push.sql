-- 013 · Push alerts for the new tickets (kitchen and bar phones). Same phones, same code, same push_subs as before.
-- The text is built here so it matches the ticket on the screen: stick first, chips written out (no bacon, tomato added, bacon → tempeh),
-- an add-on says ADD-ON, and a stop says STOP. No Ready, no Seen: a phone only ever hears about new work.

alter table public.ticket_alerts add column if not exists pushed_at timestamptz;

-- one phone alert for one order and one station, in the phone's language
create or replace function public.push_card(p_order uuid, p_station text, p_lang text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare o public.orders; es boolean := p_lang = 'es'; title text; body text; addon boolean;
begin
  select * into o from public.orders where id = p_order;
  if o.id is null then return null; end if;
  addon := exists (select 1 from public.order_pieces where order_id = p_order and station = p_station and kind = 'addon');
  if o.stick_number is not null then title := (case when es then 'Palito ' else 'Stick ' end) || o.stick_number;
  else title := coalesce(nullif(o.customer_name, ''), o.number); end if;
  title := (case when addon then (case when es then 'EXTRA · ' else 'ADD-ON · ' end) else '' end) || title ||
           ' · ' || case when o.source = 'online' then (case when es then 'En línea' else 'Online' end) || (case when o.order_type = 'togo' then (case when es then ' · Para llevar' else ' · To go' end) else '' end)
                         when o.order_type = 'togo' then (case when es then 'Para llevar' else 'To go' end)
                         else (case when es then 'Aquí' else 'For here' end) end;
  select string_agg(l, E'\n' order by ord) into body from (
    select i.id::text as ord, i.qty || '× ' || coalesce(it.name ->> p_lang, it.name ->> 'en', i.name) ||
      coalesce((select ' · ' || string_agg(
          case ch ->> 'type'
            when 'no'   then (case when es then 'sin ' else 'no ' end) || lower(coalesce(g.name ->> p_lang, g.name ->> 'en', ''))
            when 'add'  then '+ ' || lower(coalesce(g.name ->> p_lang, g.name ->> 'en', ''))
            when 'swap' then lower(coalesce(g.name ->> p_lang, g.name ->> 'en', '')) || ' → ' || lower(coalesce(w.name ->> p_lang, w.name ->> 'en', ''))
            else lower(coalesce(g.name ->> p_lang, g.name ->> 'en', '')) end, ' · ')
        from jsonb_array_elements(i.chips) ch
        left join public.ingredients g on g.id = nullif(ch ->> 'ingredient_id', '')::uuid
        left join public.ingredients w on w.id = nullif(ch ->> 'with_id', '')::uuid), '') as l
    from public.order_items i left join public.items it on it.id = i.item_id
    join public.order_pieces op on op.id = i.piece_id
   where i.order_id = p_order and op.station = p_station and i.stopped_at is null) x;
  if body is null then return null; end if;
  if o.note is not null and o.note <> '' then body := body || E'\n' || o.note; end if;
  return jsonb_build_object('title', title, 'body', body, 'tag', p_order || ':' || p_station, 'url', '/pos/tickets/#o=' || p_order);
end $$;

-- a stop or change after send
create or replace function public.push_alert_card(p_alert uuid, p_lang text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare a public.ticket_alerts; o public.orders; nm text; es boolean := p_lang = 'es'; who text; msg text;
begin
  select * into a from public.ticket_alerts where id = p_alert;
  if a.id is null then return null; end if;
  select * into o from public.orders where id = a.order_id;
  select coalesce(it.name ->> p_lang, it.name ->> 'en', i.name) into nm from public.order_items i left join public.items it on it.id = i.item_id where i.id = a.order_item_id;
  who := case when o.stick_number is not null then (case when es then 'Palito ' else 'Stick ' end) || o.stick_number else coalesce(nullif(o.customer_name, ''), o.number) end;
  msg := coalesce(a.text, case when a.kind = 'stop' then (case when es then 'Quítalo. Si ya está hecho, avisa en el mostrador.' else 'Take it off. If it is made, tell the counter.' end) else '' end);
  return jsonb_build_object('title', (case when a.kind = 'stop' then (case when es then 'PARAR · ' else 'STOP · ' end) else (case when es then 'CAMBIO · ' else 'CHANGED · ' end) end) || who,
    'body', trim(both E'\n ' from coalesce(nm, '') || E'\n' || msg), 'tag', 'alert:' || a.id, 'url', '/pos/tickets/');
end $$;

revoke execute on function public.push_card(uuid, text, text)   from public, anon, authenticated;
revoke execute on function public.push_alert_card(uuid, text)   from public, anon, authenticated;

-- a stop or change buzzes that station's phones too
create or replace function public.alerts_push() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.push_subs where station = new.station) then
    perform net.http_post(url := 'https://tuthebxguxvogmiowhcx.supabase.co/functions/v1/kitchen-push',
      body := jsonb_build_object('alert_id', new.id), headers := '{"Content-Type":"application/json"}'::jsonb);
  end if;
  return null;
end $$;
revoke execute on function public.alerts_push() from public, anon, authenticated;
drop trigger if exists alerts_push on public.ticket_alerts;
create constraint trigger alerts_push after insert on public.ticket_alerts
  deferrable initially deferred for each row execute function public.alerts_push();

-- the phone page needs the push key; hand it out with the feed
create or replace function public.tickets2_feed(p_code text, p_station text, p_lang text default 'en') returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if p_station not in ('bar', 'kitchen') then return jsonb_build_object('ok', false); end if;
  if not public.tickets_ok(p_code) then return jsonb_build_object('ok', false); end if;
  return jsonb_build_object('ok', true, 'vapid', (select public_key from public.push_keys where id = 1)) || public.tickets2_build(p_station, coalesce(nullif(p_lang, ''), 'en'));
end $$;
