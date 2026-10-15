-- 015 · Pastries are handed out from the bar: their lines go on the bar ticket. Applied live.
update public.categories set station = 'bar' where name->>'en' = 'Pastries' and station <> 'bar';

-- A check that finds the light unchanged ("still plenty") now counts: it refreshes light_set_at (when it was last looked at) and logs nothing.
-- The quiet-time prompts use light_set_at to decide what is due.
create or replace function public.set_light(p_token uuid, p_ingredient uuid, p_light text) returns void
language plpgsql security definer set search_path = public as $$
declare old text;
begin
  perform public.need_role(p_token, 'staff');
  if p_light not in ('green','amber','red') then raise exception 'bad light'; end if;
  select light into old from public.ingredients where id = p_ingredient;
  update public.ingredients set light = p_light, light_set_at = now() where id = p_ingredient;
  if old is distinct from p_light then insert into public.ingredient_log (ingredient_id, light) values (p_ingredient, p_light); end if;
end $$;
