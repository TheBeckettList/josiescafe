-- Play mode: a café that is always open, four people with the PIN 1234. No wages: the play café is a look-around.
update public.settings set hours = '{"mon":"0:00-23:59","tue":"0:00-23:59","wed":"0:00-23:59","thu":"0:00-23:59","fri":"0:00-23:59","sat":"0:00-23:59","sun":"0:00-23:59"}',
  online_cutoff = '23:58', online_orders = true, closed_until = null;
delete from public.shifts; delete from public.people;
insert into public.people (name, role, station, pin_hash, rate, language) values
  ('Josie', 'josie', null, extensions.crypt('1234', extensions.gen_salt('bf')), null, 'en'),
  ('Rosa', 'staff', 'register', extensions.crypt('1234', extensions.gen_salt('bf')), null, 'en'),
  ('Beto', 'staff', 'bar', extensions.crypt('1234', extensions.gen_salt('bf')), null, 'en'),
  ('Lupe', 'staff', 'kitchen', extensions.crypt('1234', extensions.gen_salt('bf')), null, 'en');
