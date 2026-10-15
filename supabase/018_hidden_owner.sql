-- 018 · A hidden owner account. It is not in the name picker, not in Josie's team list, never in payroll.
-- It signs in with a 6-digit PIN (tap the logo 7 times on the sign-in screen). The PIN is set once, through a one-time link:
-- an invite is a random token (only its hash is stored); claim_owner(token, pin) spends it. Applied live.
alter table public.people add column if not exists hidden boolean not null default false;

create table if not exists public.owner_invites (
  token_hash text primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_at    timestamptz
);
alter table public.owner_invites enable row level security;      -- no policies: only the functions below
create table if not exists public.owner_guard (id int primary key default 1 check (id = 1), fails int not null default 0, locked_until timestamptz);
alter table public.owner_guard enable row level security;
insert into public.owner_guard (id) values (1) on conflict do nothing;

-- the sign-in picker and the team list never show the hidden account
create or replace function public.people_names() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.is_pos() then coalesce((select jsonb_agg(jsonb_build_object(
    'id', id, 'name', name, 'role', role, 'station', station, 'language', language) order by name)
    from public.people where active and not hidden), '[]') end;
$$;
create or replace function public.people_list(p_token uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.people := public.need_role(p_token, 'manager');
begin
  return coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'name', x.name, 'role', x.role,
            'station', x.station, 'language', x.language, 'active', x.active)
            || case when p.role = 'josie' then jsonb_build_object('rate', x.rate) else '{}'::jsonb end
            order by x.name) from public.people x where not x.hidden), '[]');
end $$;

-- spend a one-time link: set (or reset) the hidden account's 6-digit PIN. The token is the secret, so this can be called from the link page.
create or replace function public.claim_owner(p_token text, p_pin text, p_name text default 'Owner') returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare h text := encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex'); nm text := coalesce(nullif(trim(p_name), ''), 'Owner');
begin
  if p_pin !~ '^[0-9]{6}$' then raise exception 'PIN must be 6 digits'; end if;
  perform 1 from public.owner_invites where token_hash = h and used_at is null and expires_at > now() for update;
  if not found then return false; end if;
  if exists (select 1 from public.people where hidden) then
    update public.people set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')), active = true, fail_count = 0, locked_until = null, name = nm where hidden;
  else
    insert into public.people (name, role, pin_hash, hidden, language) values (nm, 'josie', extensions.crypt(p_pin, extensions.gen_salt('bf')), true, 'en');
  end if;
  update public.owner_invites set used_at = now() where token_hash = h;
  update public.owner_guard set fails = 0, locked_until = null where id = 1;
  return true;
end $$;
grant execute on function public.claim_owner(text, text, text) to anon, authenticated;

-- sign in with the 6-digit PIN. 5 wrong tries lock it for 10 minutes.
create or replace function public.sign_in_owner(p_pin text, p_device text default null) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare g public.owner_guard; p public.people; sh uuid;
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  select * into g from public.owner_guard where id = 1 for update;
  if g.locked_until is not null and g.locked_until > now() then return jsonb_build_object('ok', false, 'locked', true); end if;
  if p_pin ~ '^[0-9]{6}$' then
    select * into p from public.people where hidden and active and pin_hash = extensions.crypt(p_pin, pin_hash) limit 1;
  end if;
  if p.id is null then
    update public.owner_guard set fails = case when fails + 1 >= 5 then 0 else fails + 1 end, locked_until = case when fails + 1 >= 5 then now() + interval '10 minutes' end where id = 1;
    return jsonb_build_object('ok', false);
  end if;
  update public.owner_guard set fails = 0, locked_until = null where id = 1;
  select id into sh from public.shifts where person_id = p.id and out_at is null and in_at > now() - interval '16 hours';
  if sh is null then
    update public.shifts set out_at = in_at where person_id = p.id and out_at is null;
    insert into public.shifts (person_id, device) values (p.id, p_device) returning id into sh;
  end if;
  return jsonb_build_object('ok', true, 'token', sh, 'id', p.id, 'name', p.name, 'role', p.role, 'station', null, 'language', p.language, 'first_time', false);
end $$;
