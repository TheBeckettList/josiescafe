-- 007 · Josie's World, step 1: schema + roles + RLS (build handoff Oct 14, 2026)
--
-- ADDITIVE ONLY. Everything v1.2 uses (items, orders, sync_order, tickets_feed, place_online_order…) keeps
-- working untouched. New columns have defaults; new tables are new. Nothing here changes what the live
-- register, website or ticket phones do today. Later steps switch screens over one at a time.
--
-- Words: the handoff's "dishes" are the existing `items` table (one menu, edited once).
--        "paid" is the existing orders.status = 'paid'. "open/done" is the new orders.phase.
--
-- Who may do what (rule: staff never see pay or margins):
--   Devices still sign in with the shared POS login (is_pos). People sign in with a PIN on top of that.
--   A PIN sign-in starts a shift; the shift id is the token every role-checked function below takes.
--   people / shifts / payroll_* have NO policies: they are reachable only through the functions.
--   Role-checked functions: staff (any signed-in person) · manager · josie.

create extension if not exists pgcrypto with schema extensions;

-- ═════════════════════════════ people, shifts (PIN = time clock) ═════════════════════════════
create table if not exists public.people (
  id            uuid primary key default gen_random_uuid(),
  name          text    not null,
  role          text    not null default 'staff' check (role in ('josie','manager','staff')),
  station       text    check (station in ('bar','kitchen','register')),   -- null for josie/manager
  pin_hash      text    not null,
  rate          numeric check (rate >= 0),                                  -- lempiras per hour; josie only
  language      text    not null default 'en' check (language in ('en','es')),
  tutorial_seen boolean not null default false,
  active        boolean not null default true,
  fail_count    int     not null default 0,      -- wrong PINs in a row; 5 locks sign-in for 5 minutes
  locked_until  timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists public.shifts (
  id        uuid primary key default gen_random_uuid(),   -- this is the sign-in token
  person_id uuid not null references public.people(id),
  in_at     timestamptz not null default now(),
  out_at    timestamptz,
  device    text
);
create index if not exists shifts_person on public.shifts (person_id, in_at desc);
create unique index if not exists shifts_one_open on public.shifts (person_id) where out_at is null;

-- From the old shared-PIN staff list: keep the people, hash the PINs. The old "manager" becomes josie
-- (the only top role that existed); rename or demote in the admin gear.
insert into public.people (name, role, pin_hash)
select s.name, case s.role when 'manager' then 'josie' else 'staff' end,
       extensions.crypt(s.pin, extensions.gen_salt('bf'))
from public.staff s
where s.active and not exists (select 1 from public.people);

-- Who is signed in? A shift older than 16 hours counts as forgotten, not as working.
create or replace function public.person_of(p_token uuid) returns public.people
language sql stable security definer set search_path = public as $$
  select p.* from public.shifts s join public.people p on p.id = s.person_id
  where s.id = p_token and s.out_at is null and s.in_at > now() - interval '16 hours' and p.active
    and public.is_pos();
$$;

-- p_min: 'staff' | 'manager' | 'josie'. Raises when the token is not good enough.
create or replace function public.need_role(p_token uuid, p_min text) returns public.people
language plpgsql stable security definer set search_path = public as $$
declare p public.people := public.person_of(p_token);
begin
  if p.id is null then raise exception 'sign in first'; end if;
  if (case p.role when 'josie' then 3 when 'manager' then 2 else 1 end)
     < (case p_min when 'josie' then 3 when 'manager' then 2 else 1 end) then
    raise exception 'not allowed';
  end if;
  return p;
end $$;

-- The name picker on the sign-in screen: names, roles and stations only. No PINs, no pay.
create or replace function public.people_names() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.is_pos() then coalesce((select jsonb_agg(jsonb_build_object(
    'id', id, 'name', name, 'role', role, 'station', station, 'language', language) order by name)
    from public.people where active), '[]') end;
$$;

-- Pick your name, enter your PIN. 5 wrong PINs in a row lock that name for 5 minutes.
create or replace function public.sign_in(p_person uuid, p_pin text, p_device text default null) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare p public.people; sh uuid;
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  select * into p from public.people where id = p_person and active for update;
  if p.id is null then return jsonb_build_object('ok', false); end if;
  if p.locked_until is not null and p.locked_until > now() then
    return jsonb_build_object('ok', false, 'locked', true);
  end if;
  if p_pin !~ '^[0-9]{4}$' or p.pin_hash <> extensions.crypt(p_pin, p.pin_hash) then
    update public.people
       set fail_count   = case when fail_count + 1 >= 5 then 0 else fail_count + 1 end,
           locked_until = case when fail_count + 1 >= 5 then now() + interval '5 minutes' end
     where id = p.id;
    return jsonb_build_object('ok', false);
  end if;
  update public.people set fail_count = 0, locked_until = null where id = p.id;
  -- Already on shift (second device, app reopened): same shift, hours never double.
  select id into sh from public.shifts
   where person_id = p.id and out_at is null and in_at > now() - interval '16 hours';
  if sh is null then
    update public.shifts set out_at = in_at where person_id = p.id and out_at is null;   -- forgotten shift: zero hours
    insert into public.shifts (person_id, device) values (p.id, p_device) returning id into sh;
  end if;
  return jsonb_build_object('ok', true, 'token', sh, 'name', p.name, 'role', p.role, 'station', p.station,
    'language', p.language, 'first_time', not p.tutorial_seen);
end $$;

create or replace function public.sign_out(p_token uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  update public.shifts set out_at = now() where id = p_token and out_at is null;
end $$;

create or replace function public.my_settings(p_token uuid, p_language text default null, p_tutorial_seen boolean default null)
returns void language plpgsql security definer set search_path = public as $$
declare p public.people := public.need_role(p_token, 'staff');
begin
  update public.people set language = coalesce(p_language, language), tutorial_seen = coalesce(p_tutorial_seen, tutorial_seen)
   where id = p.id;
end $$;

-- Staff list. Pay (rate) goes to josie only; managers see names, roles, stations.
create or replace function public.people_list(p_token uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.people := public.need_role(p_token, 'manager');
begin
  return coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'name', x.name, 'role', x.role,
            'station', x.station, 'language', x.language, 'active', x.active)
            || case when p.role = 'josie' then jsonb_build_object('rate', x.rate) else '{}'::jsonb end
            order by x.name) from public.people x), '[]');
end $$;

-- Josie: add or change a person. PIN is optional when changing. (People sign in by name + PIN, so PINs may repeat.)
create or replace function public.people_save(p_token uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare me public.people := public.need_role(p_token, 'josie');
        pid uuid := nullif(p ->> 'id', '')::uuid;
        pin text := nullif(p ->> 'pin', '');
begin
  if pin is not null and pin !~ '^[0-9]{4}$' then raise exception 'PIN must be 4 digits'; end if;
  if pid is null then
    if pin is null then raise exception 'new people need a PIN'; end if;
    insert into public.people (name, role, station, pin_hash, rate, language)
    values (p ->> 'name', coalesce(p ->> 'role', 'staff'), nullif(p ->> 'station', ''),
            extensions.crypt(pin, extensions.gen_salt('bf')), nullif(p ->> 'rate', '')::numeric, coalesce(p ->> 'language', 'en'))
    returning id into pid;
  else
    update public.people set
      name     = coalesce(p ->> 'name', name),
      role     = coalesce(p ->> 'role', role),
      station  = case when p ? 'station' then nullif(p ->> 'station', '') else station end,
      rate     = case when p ? 'rate' then nullif(p ->> 'rate', '')::numeric else rate end,
      language = coalesce(p ->> 'language', language),
      active   = coalesce((p ->> 'active')::boolean, active),
      pin_hash = case when pin is null then pin_hash else extensions.crypt(pin, extensions.gen_salt('bf')) end
    where id = pid;
  end if;
  if not exists (select 1 from public.people where active and role = 'josie') then
    raise exception 'there must be one active Josie';
  end if;
  return pid;
end $$;

-- ═════════════════════════════ ingredients, out cascade, swaps, diets ═════════════════════════════
create table if not exists public.ingredients (
  id             uuid primary key default gen_random_uuid(),
  name           jsonb   not null,                          -- {"en":"Bacon","es":"Tocino"}
  icon           text,                                      -- name in the icon kit
  kind           text    not null default 'element' check (kind in ('element','base')),
  light          text    not null default 'green' check (light in ('green','amber','red')),
  inventoried    boolean not null default false,            -- shows in the Inventory popup
  location       text    not null default 'other' check (location in ('grinder','fridge','dry','other')),
  required_check boolean not null default false,            -- coffee beans at the grinder; fridge checks are voluntary
  light_set_at   timestamptz not null default now(),
  active         boolean not null default true
);

-- What each dish is made of. is_core: the ingredient IS the dish (bacon on a BLT), so a diet can't adapt it:
-- the tile reads "bacon is the dish" and can still be added anyway.
-- Marking a dish Out never touches this; marking an ingredient does the cascade.
create table if not exists public.dish_ingredients (
  item_id       uuid not null references public.items(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  is_core       boolean not null default false,
  primary key (item_id, ingredient_id)
);
create index if not exists dish_ingredients_ing on public.dish_ingredients (ingredient_id);

-- Meat and dairy flags drive the one kosher-style warning (chicken with cheese or milk in one dish).
alter table public.ingredients
  add column if not exists meat  boolean not null default false,
  add column if not exists dairy boolean not null default false;

-- Diets: Vegan, Gluten free, Kosher-style. `key` is what orders store. Names stay honest: "Kosher-style" never
-- "Kosher"; gluten free reads "gluten-free ingredients" unless Josie can guarantee no cross-contact.
create table if not exists public.diets (
  id    uuid primary key default gen_random_uuid(),
  key   text unique,
  name  jsonb not null,          -- the toggle on the register
  claim jsonb,                   -- the honest wording shown to guests and on tickets
  sort  int   not null default 0
);
alter table public.diets add column if not exists claim jsonb;
insert into public.diets (key, name, claim, sort) values
  ('vegan',        '{"en":"Vegan","es":"Vegano"}',
                   '{"en":"vegan","es":"vegano"}', 1),
  ('gluten_free',  '{"en":"Gluten free","es":"Sin gluten"}',
                   '{"en":"gluten-free ingredients","es":"ingredientes sin gluten"}', 2),
  ('kosher_style', '{"en":"Kosher-style","es":"Estilo kosher"}',
                   '{"en":"kosher-style","es":"estilo kosher"}', 3)
on conflict (key) do update set claim = excluded.claim;

-- Per ingredient and diet: yes / no. No row = not confirmed yet (Josie fills these in; the register treats
-- an unconfirmed ingredient as fine and the admin gear lists what is still to confirm).
create table if not exists public.diet_marks (
  diet_id       uuid not null references public.diets(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  mark          text not null check (mark in ('yes','no')),
  primary key (diet_id, ingredient_id)
);

-- Swaps. diet_id null = general (what to offer when the element is out of stock).
-- diet_id set = what to offer for that diet; is_default is the one used automatically (one per element and diet).
-- Options are only shown while the alternative's light is green.
create table if not exists public.swaps (
  id             bigint generated always as identity primary key,
  element_id     uuid not null references public.ingredients(id) on delete cascade,
  alternative_id uuid not null references public.ingredients(id) on delete cascade,
  diet_id        uuid references public.diets(id) on delete cascade,
  is_default     boolean not null default false,
  sort           int  not null default 0,
  check (element_id <> alternative_id),
  check (not is_default or diet_id is not null)
);
create unique index if not exists swaps_unique on public.swaps
  (element_id, alternative_id, coalesce(diet_id, '00000000-0000-0000-0000-000000000000'::uuid));
create unique index if not exists swaps_one_default on public.swaps (element_id, diet_id) where is_default;

-- Light changes, kept only so the day in review can say "what ran low". No person is recorded.
create table if not exists public.ingredient_log (
  id            bigint generated always as identity primary key,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  light         text not null,
  at            timestamptz not null default now()
);

-- Favourites: by order quantity, or forced by a manager.
alter table public.items add column if not exists starred boolean not null default false;

-- One tap on an ingredient (staff): the cascade is read, not stored.
create or replace function public.set_light(p_token uuid, p_ingredient uuid, p_light text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.need_role(p_token, 'staff');
  if p_light not in ('green','amber','red') then raise exception 'bad light'; end if;
  update public.ingredients set light = p_light, light_set_at = now() where id = p_ingredient and light <> p_light;
  if found then insert into public.ingredient_log (ingredient_id, light) values (p_ingredient, p_light); end if;
end $$;

-- Dish "Out today" / back (staff). Never touches ingredients.
create or replace function public.set_dish_out(p_token uuid, p_item uuid, p_out boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.need_role(p_token, 'staff');
  update public.items set available = not p_out, updated_at = now() where id = p_item;
end $$;

-- Every dish's state for registers, the website, boards and tickets:
--   out      the dish itself is out today (switched off, or a base is red)
--   missing  elements that are red, each with swap options that are still green
-- Amber never changes a dish. Anyone may read this; it holds names only.
create or replace function public.dish_state() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(i.id, jsonb_build_object(
    'out', (not i.available) or exists (
        select 1 from public.dish_ingredients di join public.ingredients g on g.id = di.ingredient_id
        where di.item_id = i.id and g.kind = 'base' and g.light = 'red'),
    'missing', coalesce((
        select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'swaps', coalesce((
            select jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name) order by s.sort)
            from public.swaps s join public.ingredients a on a.id = s.alternative_id
            where s.element_id = g.id and s.diet_id is null and a.light = 'green' and a.active), '[]')))
        from public.dish_ingredients di join public.ingredients g on g.id = di.ingredient_id
        where di.item_id = i.id and g.kind = 'element' and g.light = 'red'), '[]')
  )), '{}'::jsonb)
  from public.items i where i.active;
$$;

-- Josie's admin gear: one document in, upserted. Keys are all optional:
--   ingredients[], dish_ingredients[{item_id, rows[]}], swaps[{element_id, diet_id, rows[]}], diet_marks[]
--   (shapes are noted inline below)
create or replace function public.catalog_write(p_token uuid, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare x jsonb;
begin
  perform public.need_role(p_token, 'josie');
  for x in select * from jsonb_array_elements(coalesce(p -> 'ingredients', '[]')) loop
    insert into public.ingredients (id, name, icon, kind, inventoried, location, required_check, active, meat, dairy)
    values (coalesce(nullif(x ->> 'id', '')::uuid, gen_random_uuid()), x -> 'name', x ->> 'icon',
            coalesce(x ->> 'kind', 'element'), coalesce((x ->> 'inventoried')::boolean, false),
            coalesce(x ->> 'location', 'other'), coalesce((x ->> 'required_check')::boolean, false),
            coalesce((x ->> 'active')::boolean, true),
            coalesce((x ->> 'meat')::boolean, false), coalesce((x ->> 'dairy')::boolean, false))
    on conflict (id) do update set name = excluded.name, icon = excluded.icon, kind = excluded.kind,
      inventoried = excluded.inventoried, location = excluded.location, required_check = excluded.required_check,
      active = excluded.active, meat = excluded.meat, dairy = excluded.dairy;
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p -> 'dish_ingredients', '[]')) loop
    -- {item_id, rows:[{ingredient_id, is_core}]} replaces that dish's list
    delete from public.dish_ingredients where item_id = (x ->> 'item_id')::uuid;
    insert into public.dish_ingredients (item_id, ingredient_id, is_core)
    select (x ->> 'item_id')::uuid, (r ->> 'ingredient_id')::uuid, coalesce((r ->> 'is_core')::boolean, false)
    from jsonb_array_elements(x -> 'rows') r;
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p -> 'swaps', '[]')) loop
    -- {element_id, diet_id|null, rows:[{alternative_id, is_default}]} replaces that element's list for that diet
    delete from public.swaps where element_id = (x ->> 'element_id')::uuid
      and diet_id is not distinct from nullif(x ->> 'diet_id', '')::uuid;
    insert into public.swaps (element_id, alternative_id, diet_id, is_default, sort)
    select (x ->> 'element_id')::uuid, (r.value ->> 'alternative_id')::uuid, nullif(x ->> 'diet_id', '')::uuid,
           coalesce((r.value ->> 'is_default')::boolean, false), r.ordinality::int
    from jsonb_array_elements(x -> 'rows') with ordinality r(value, ordinality);
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p -> 'diet_marks', '[]')) loop
    -- {diet_id, ingredient_id, mark:'yes'|'no'|''}  (empty mark = back to "not confirmed")
    delete from public.diet_marks where diet_id = (x ->> 'diet_id')::uuid and ingredient_id = (x ->> 'ingredient_id')::uuid;
    if coalesce(x ->> 'mark', '') <> '' then
      insert into public.diet_marks (diet_id, ingredient_id, mark)
      values ((x ->> 'diet_id')::uuid, (x ->> 'ingredient_id')::uuid, x ->> 'mark');
    end if;
  end loop;
end $$;

-- ═════════════════════════════ the floor: tables and sticks ═════════════════════════════
-- A stick lives in the home pot, the waiting pot, or on a table. The number belongs to the stick.
create table if not exists public.tables (
  id    uuid primary key default gen_random_uuid(),
  label text    not null,
  area  text    not null default 'inside' check (area in ('inside','deck','outside','schoolhouse','bar')),
  x     numeric not null default 0,           -- map position, 0..100
  y     numeric not null default 0,
  seats int,
  active boolean not null default true
);
create table if not exists public.sticks (
  number   int primary key check (number > 0),
  state    text not null default 'home' check (state in ('home','waiting','table')),
  table_id uuid references public.tables(id) on delete set null,
  check ((state = 'table') = (table_id is not null))
);

-- ═════════════════════════════ orders: stick, phase, add-on pieces, alerts ═════════════════════════════
-- phase is the ONLY status: open until the number completes (stick back / number complete / picked up).
-- A stick number can hold several orders, so stick_number is not unique.
alter table public.orders
  add column if not exists stick_number  int references public.sticks(number),
  add column if not exists phase         text not null default 'open' check (phase in ('open','done')),
  add column if not exists completed_at  timestamptz,
  add column if not exists completed_by  uuid references public.people(id),
  add column if not exists created_by    uuid references public.people(id),
  add column if not exists diets         text[] not null default '{}';   -- diet toggles on this order, e.g. {vegan,kosher_style}
create index if not exists orders_stick on public.orders (stick_number) where stick_number is not null;
create index if not exists orders_open  on public.orders (phase, created_at) where phase = 'open';

-- Everything before this migration is already finished business.
update public.orders set phase = 'done', completed_at = coalesce(paid_at, created_at)
 where phase = 'open' and status in ('paid','void') and created_at < now() - interval '1 day';
update public.orders set phase = 'done', completed_at = coalesce(paid_at, created_at)
 where phase = 'open' and status = 'void';

-- Chips on a line, each optionally tagged with the diet that caused it (shown on the ticket and to the guest):
--   {"type":"no","ingredient_id":…,"diet":"kosher_style"}  "no bacon · kosher-style"
--   {"type":"swap","ingredient_id":…,"with_id":…,"diet":…}  "bacon → turkey"
--   {"type":"add",…}  extra   ·   {"type":"back","ingredient_id":…}  non-compliant ingredient put back anyway
alter table public.order_items
  add column if not exists chips      jsonb not null default '[]',
  add column if not exists stopped_at timestamptz;    -- stop/change after send: line is struck through, not deleted

-- One piece per station per send. The first is the original; later sends are add-ons, queued at the back.
create table if not exists public.order_pieces (
  id         uuid primary key,                                 -- made on the device, safe to retry offline
  order_id   uuid not null references public.orders(id) on delete cascade,
  station    text not null check (station in ('bar','kitchen')),
  kind       text not null default 'original' check (kind in ('original','addon')),
  parent_id  uuid references public.order_pieces(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((kind = 'addon') = (parent_id is not null))
);
create unique index if not exists order_pieces_one_original on public.order_pieces (order_id, station) where kind = 'original';
create index if not exists order_pieces_order on public.order_pieces (order_id);
alter table public.order_items add column if not exists piece_id uuid references public.order_pieces(id);

-- Stop / change after send: pinned at the top of the station's queue, clears itself (draining bar + chime).
-- The 60 seconds is a starting point; tune with the cooks. Nobody taps anything.
create table if not exists public.ticket_alerts (
  id            uuid primary key,
  order_id      uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  station       text not null check (station in ('bar','kitchen')),
  kind          text not null check (kind in ('stop','change')),
  text          text,
  already_made  boolean not null default false,       -- true → "tell the counter"
  created_at    timestamptz not null default now(),
  clears_at     timestamptz not null default now() + interval '60 seconds'
);
create index if not exists ticket_alerts_live on public.ticket_alerts (station, clears_at);

-- ═════════════════════════════ hours, cutoff, payroll ═════════════════════════════
-- Hours and "closed today" already live in settings (hours, closed_until). Add the online cutoff.
alter table public.settings add column if not exists online_cutoff time not null default '14:00';
-- Hours per the Oct 14 notes: Mon–Sat 6:15 am–2:30 pm, closed Sunday. (Was Tue–Sat.) Website Open and the
-- 2 pm online cutoff both read these.
update public.settings
   set hours = '{"mon":"6:15-14:30","tue":"6:15-14:30","wed":"6:15-14:30","thu":"6:15-14:30","fri":"6:15-14:30","sat":"6:15-14:30","sun":"closed"}',
       updated_at = now()
 where id = 1;

create table if not exists public.payroll_periods (
  id         uuid primary key default gen_random_uuid(),
  starts_on  date not null,
  ends_on    date not null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create table if not exists public.payroll_lines (
  period_id  uuid not null references public.payroll_periods(id) on delete cascade,
  person_id  uuid not null references public.people(id),
  hours      numeric not null default 0,
  rate       numeric not null,                       -- rate as it was when the period was made
  amount     numeric not null,
  method     text check (method in ('cash','transfer')),
  paid_at    timestamptz,                            -- the paid chip; null again = Undo
  primary key (period_id, person_id)
);

-- ═════════════════════════════ row level security ═════════════════════════════
alter table public.people           enable row level security;   -- no policies: functions only
alter table public.shifts           enable row level security;   -- no policies: the shift id is the token
alter table public.payroll_periods  enable row level security;   -- no policies: josie's functions (step 7)
alter table public.payroll_lines    enable row level security;
alter table public.ingredients      enable row level security;
alter table public.dish_ingredients enable row level security;
alter table public.swaps            enable row level security;
alter table public.diets            enable row level security;
alter table public.diet_marks       enable row level security;
alter table public.ingredient_log   enable row level security;
alter table public.tables           enable row level security;
alter table public.sticks           enable row level security;
alter table public.order_pieces     enable row level security;
alter table public.ticket_alerts    enable row level security;

-- Config: devices read; changes go through the role-checked functions above.
drop policy if exists pos_read on public.ingredients;
create policy pos_read on public.ingredients      for select to authenticated using (public.is_pos());
drop policy if exists pos_read on public.dish_ingredients;
create policy pos_read on public.dish_ingredients for select to authenticated using (public.is_pos());
drop policy if exists pos_read on public.swaps;
create policy pos_read on public.swaps            for select to authenticated using (public.is_pos());
drop policy if exists pos_read on public.diets;
create policy pos_read on public.diets            for select to authenticated using (public.is_pos());
drop policy if exists pos_read on public.diet_marks;
create policy pos_read on public.diet_marks       for select to authenticated using (public.is_pos());
drop policy if exists pos_read on public.tables;
create policy pos_read on public.tables           for select to authenticated using (public.is_pos());
drop policy if exists pos_read on public.ingredient_log;
create policy pos_read on public.ingredient_log   for select to authenticated using (public.is_pos());
-- Floor and orders: the register writes these all day (also from the offline queue).
drop policy if exists pos_all on public.sticks;
create policy pos_all on public.sticks           for all to authenticated using (public.is_pos()) with check (public.is_pos());
drop policy if exists pos_all on public.order_pieces;
create policy pos_all on public.order_pieces     for all to authenticated using (public.is_pos()) with check (public.is_pos());
drop policy if exists pos_all on public.ticket_alerts;
create policy pos_all on public.ticket_alerts    for all to authenticated using (public.is_pos()) with check (public.is_pos());
-- Guests have no table access at all. They reach their own order through its (unguessable) id, in functions.

-- ═════════════════════════════ API permissions ═════════════════════════════
grant select on public.ingredients, public.dish_ingredients, public.swaps, public.diets, public.diet_marks,
  public.tables, public.ingredient_log to authenticated;
grant select, insert, update, delete on public.sticks, public.order_pieces, public.ticket_alerts to authenticated;

revoke execute on function public.person_of(uuid)                      from public, anon, authenticated;
revoke execute on function public.need_role(uuid, text)                from public, anon, authenticated;
revoke execute on function public.people_names()                       from public, anon;
revoke execute on function public.sign_in(uuid, text, text)            from public, anon;
revoke execute on function public.sign_out(uuid)                       from public, anon;
revoke execute on function public.my_settings(uuid, text, boolean)     from public, anon;
revoke execute on function public.people_list(uuid)                    from public, anon;
revoke execute on function public.people_save(uuid, jsonb)             from public, anon;
revoke execute on function public.set_light(uuid, uuid, text)          from public, anon;
revoke execute on function public.set_dish_out(uuid, uuid, boolean)    from public, anon;
revoke execute on function public.catalog_write(uuid, jsonb)           from public, anon;
revoke execute on function public.dish_state()                         from public;
grant  execute on function public.people_names()                       to authenticated;
grant  execute on function public.sign_in(uuid, text, text)            to authenticated;
grant  execute on function public.sign_out(uuid)                       to authenticated;
grant  execute on function public.my_settings(uuid, text, boolean)     to authenticated;
grant  execute on function public.people_list(uuid)                    to authenticated;
grant  execute on function public.people_save(uuid, jsonb)             to authenticated;
grant  execute on function public.set_light(uuid, uuid, text)          to authenticated;
grant  execute on function public.set_dish_out(uuid, uuid, boolean)    to authenticated;
grant  execute on function public.catalog_write(uuid, jsonb)           to authenticated;
grant  execute on function public.dish_state()                         to anon, authenticated;
