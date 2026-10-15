-- 012 · Manager "day in review" and Josie's payroll. Both are role-checked by the shift token.
-- Station averages only; nothing here ever shows one person's speed. Payroll is Josie only; staff never see pay or margins.

-- Day in review (manager and Josie). p_day null = today (Honduras). Wait = first ring-up to the number completing.
create or replace function public.day_review(p_token uuid, p_day date default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me public.people := public.need_role(p_token, 'manager'); d date := coalesce(p_day, public.hn_now()::date); r jsonb;
begin
  with o as (
    select * from public.orders where (created_at at time zone 'America/Tegucigalpa')::date = d and status <> 'void'
  ), buckets as (
    select floor(extract(epoch from ((created_at at time zone 'America/Tegucigalpa')::time)) / 900)::int as b, count(*) n from o group by 1
  )
  select jsonb_build_object(
    'day', d,
    'sales', coalesce((select sum(total) from o where status = 'paid'), 0),
    'orders', (select count(*) from o), 'online', (select count(*) from o where source = 'online'),
    'avg_wait', (select round(avg(extract(epoch from (completed_at - created_at)) / 60)::numeric, 0) from o where completed_at is not null),
    'bar_wait', (select round(avg(extract(epoch from (completed_at - created_at)) / 60)::numeric, 0) from o where completed_at is not null and exists (select 1 from public.order_items i where i.order_id = o.id and i.station = 'bar')),
    'kitchen_wait', (select round(avg(extract(epoch from (completed_at - created_at)) / 60)::numeric, 0) from o where completed_at is not null and exists (select 1 from public.order_items i where i.order_id = o.id and i.station = 'kitchen')),
    'busiest', (select to_char(time '00:00' + b * interval '15 minutes', 'FMHH12:MI') from buckets order by n desc, b limit 1),
    'buckets', (select coalesce(jsonb_object_agg(b, n), '{}') from buckets),
    'loved', (select coalesce(jsonb_agg(x order by x.qty desc), '[]') from (
        select i.item_id, coalesce(it.name ->> 'en', i.name) as name, sum(i.qty)::int as qty
          from public.order_items i join o on o.id = i.order_id left join public.items it on it.id = i.item_id
         group by 1, 2 order by 3 desc limit 5) x),
    'low', (select coalesce(jsonb_agg(jsonb_build_object('ingredient_id', l.ingredient_id, 'name', g.name ->> 'en', 'icon', g.icon, 'light', l.light,
              'at', to_char(l.at at time zone 'America/Tegucigalpa', 'FMHH12:MI')) order by l.at), '[]')
              from (select distinct on (ingredient_id) * from public.ingredient_log
                     where light <> 'green' and (at at time zone 'America/Tegucigalpa')::date = d order by ingredient_id, at) l
              join public.ingredients g on g.id = l.ingredient_id)
  ) into r;
  return r;
end $$;

-- Payroll (Josie only). Hours come from sign-in/sign-out shifts. p_start/p_end = the pay period.
create or replace function public.payroll_view(p_token uuid, p_start date, p_end date) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me public.people := public.need_role(p_token, 'josie'); pid uuid; r jsonb;
begin
  select id into pid from public.payroll_periods where starts_on = p_start and ends_on = p_end;
  if pid is null then insert into public.payroll_periods (starts_on, ends_on) values (p_start, p_end) returning id into pid; end if;
  insert into public.payroll_lines (period_id, person_id, hours, rate, amount)
  select pid, p.id, 0, coalesce(p.rate, 0), 0 from public.people p where p.active and p.role <> 'josie' and p.rate is not null
  on conflict (period_id, person_id) do nothing;
  -- hours and amounts refresh until the line is marked paid
  update public.payroll_lines l set
      rate   = coalesce((select p.rate from public.people p where p.id = l.person_id), l.rate),
      hours  = (select coalesce(round(sum(extract(epoch from (coalesce(s.out_at, now()) - s.in_at)) / 3600)::numeric, 1), 0) from public.shifts s
                 where s.person_id = l.person_id and (s.in_at at time zone 'America/Tegucigalpa')::date between p_start and p_end)
   where l.period_id = pid and l.paid_at is null;
  update public.payroll_lines set amount = round(hours * rate, 0) where period_id = pid and paid_at is null;
  select jsonb_build_object('period_id', pid, 'start', p_start, 'end', p_end,
    'to_pay', coalesce((select sum(amount) from public.payroll_lines where period_id = pid and paid_at is null), 0),
    'lines', coalesce((select jsonb_agg(jsonb_build_object('person_id', l.person_id, 'name', p.name, 'hours', l.hours, 'rate', l.rate, 'amount', l.amount,
                         'method', l.method, 'paid', l.paid_at is not null) order by p.name)
                         from public.payroll_lines l join public.people p on p.id = l.person_id where l.period_id = pid), '[]')) into r;
  return r;
end $$;

-- Mark one person paid by cash or transfer; method null = Undo.
create or replace function public.payroll_mark(p_token uuid, p_period uuid, p_person uuid, p_method text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.people := public.need_role(p_token, 'josie');
begin
  if p_method is not null and p_method not in ('cash', 'transfer') then raise exception 'bad method'; end if;
  update public.payroll_lines set method = p_method, paid_at = case when p_method is null then null else now() end
   where period_id = p_period and person_id = p_person;
end $$;

revoke execute on function public.day_review(uuid, date)                  from public, anon;
revoke execute on function public.payroll_view(uuid, date, date)          from public, anon;
revoke execute on function public.payroll_mark(uuid, uuid, uuid, text)    from public, anon;
grant  execute on function public.day_review(uuid, date)                  to authenticated;
grant  execute on function public.payroll_view(uuid, date, date)          to authenticated;
grant  execute on function public.payroll_mark(uuid, uuid, uuid, text)    to authenticated;
