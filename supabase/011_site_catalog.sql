-- 011 · One public read for the new website: the open menu, each dish's ingredients, diets and swaps, and whether orders are open.
-- Read only; no prices are trusted back from the browser (place_online_order2 prices everything again).
create or replace function public.site_catalog(p_lang text default 'en') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare ds jsonb := public.dish_state(); lang text := coalesce(nullif(p_lang, ''), 'en'); s public.settings;
begin
  select * into s from public.settings where id = 1;
  return jsonb_build_object(
    'gate', public.online_gate(),
    'hours', s.hours, 'closed_note', s.closed_note, 'cutoff', s.online_cutoff,
    'open_now', public.open_at(public.hn_now()), 'closed_until', s.closed_until,
    'categories', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', coalesce(c.name ->> lang, c.name ->> 'en'), 'en', c.name ->> 'en', 'station', c.station) order by c.sort), '[]')
                     from public.categories c where c.active and exists (select 1 from public.items i where i.category_id = c.id and i.active and i.show_online)),
    'items', (select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'category_id', i.category_id, 'name', coalesce(i.name ->> lang, i.name ->> 'en'), 'en', i.name ->> 'en',
                'description', coalesce(i.description ->> lang, i.description ->> 'en'), 'price', i.price,
                'togo', coalesce(i.togo_charge, c.togo_charge, 0), 'starred', i.starred,
                'out', (not i.available) or coalesce((ds -> (i.id)::text ->> 'out')::boolean, false) or (c.counted and coalesce(i.stock, 0) < 1),
                'ing', (select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'name', coalesce(g.name ->> lang, g.name ->> 'en'), 'icon', g.icon, 'core', di.is_core,
                           'out', g.light = 'red', 'meat', g.meat, 'dairy', g.dairy) order by di.is_core desc, g.name ->> 'en'), '[]')
                          from public.dish_ingredients di join public.ingredients g on g.id = di.ingredient_id where di.item_id = i.id and g.active)) order by i.sort), '[]')
                from public.items i join public.categories c on c.id = i.category_id where i.active and i.show_online and c.active),
    'diets', (select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'key', d.key, 'name', coalesce(d.name ->> lang, d.name ->> 'en'), 'claim', coalesce(d.claim ->> lang, d.claim ->> 'en')) order by d.sort), '[]') from public.diets d),
    'marks', (select coalesce(jsonb_agg(jsonb_build_object('diet', d.key, 'ing', m.ingredient_id, 'mark', m.mark)), '[]') from public.diet_marks m join public.diets d on d.id = m.diet_id),
    'swaps', (select coalesce(jsonb_agg(jsonb_build_object('el', w.element_id, 'alt', w.alternative_id, 'diet', d.key, 'def', w.is_default,
                'name', coalesce(a.name ->> lang, a.name ->> 'en'), 'icon', a.icon, 'ok', a.light = 'green' and a.active) order by w.sort), '[]')
                from public.swaps w left join public.diets d on d.id = w.diet_id join public.ingredients a on a.id = w.alternative_id));
end $$;
revoke execute on function public.site_catalog(text) from public;
grant  execute on function public.site_catalog(text) to anon, authenticated;
