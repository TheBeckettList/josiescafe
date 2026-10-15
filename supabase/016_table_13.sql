-- 016 · Table 13: the two chairs with the little round table between them, out on the deck by the door. Applied live.
insert into public.tables (label, area, x, y, w, h, picnic, active)
select '13', 'outside', 24.51, 28.06, 0, 0, false, true where not exists (select 1 from public.tables where label = '13');
