-- Play mode: a café that is always open, five people with the PIN 1234, a few shifts so payroll has numbers.
update public.settings set hours = '{"mon":"0:00-23:59","tue":"0:00-23:59","wed":"0:00-23:59","thu":"0:00-23:59","fri":"0:00-23:59","sat":"0:00-23:59","sun":"0:00-23:59"}',
  online_cutoff = '23:58', online_orders = true, closed_until = null;
delete from public.shifts; delete from public.people;
insert into public.people (name, role, station, pin_hash, rate, language) values
  ('Josie', 'josie', null, extensions.crypt('1234', extensions.gen_salt('bf')), null, 'en'),
  ('Maya', 'manager', null, extensions.crypt('1234', extensions.gen_salt('bf')), 90, 'en'),
  ('Rosa', 'staff', 'register', extensions.crypt('1234', extensions.gen_salt('bf')), 70, 'es'),
  ('Beto', 'staff', 'bar', extensions.crypt('1234', extensions.gen_salt('bf')), 70, 'es'),
  ('Lupe', 'staff', 'kitchen', extensions.crypt('1234', extensions.gen_salt('bf')), 75, 'es');
insert into public.shifts (person_id, in_at, out_at, device)
select p.id, date_trunc('day', now()) - (d || ' days')::interval + interval '12 hours', date_trunc('day', now()) - (d || ' days')::interval + interval '20 hours', 'A'
from public.people p, generate_series(1, 5) d where p.role <> 'josie';
