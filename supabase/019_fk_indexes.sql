-- 019 · Indexes on foreign keys the advisor flagged (small tables today; cheap, and they keep joins quick as orders pile up). Applied live.
create index if not exists order_items_piece_id_idx on public.order_items (piece_id);
create index if not exists order_pieces_parent_id_idx on public.order_pieces (parent_id);
create index if not exists orders_completed_by_idx on public.orders (completed_by);
create index if not exists orders_created_by_idx on public.orders (created_by);
create index if not exists sticks_table_id_idx on public.sticks (table_id);
create index if not exists ticket_alerts_order_id_idx on public.ticket_alerts (order_id);
create index if not exists ticket_alerts_order_item_id_idx on public.ticket_alerts (order_item_id);
create index if not exists swaps_alternative_id_idx on public.swaps (alternative_id);
create index if not exists swaps_diet_id_idx on public.swaps (diet_id);
create index if not exists diet_marks_ingredient_id_idx on public.diet_marks (ingredient_id);
create index if not exists ingredient_log_ingredient_id_idx on public.ingredient_log (ingredient_id);
create index if not exists payroll_lines_person_id_idx on public.payroll_lines (person_id);
-- the hidden owner's sign-in is for signed-in devices only
revoke execute on function public.sign_in_owner(text, text) from anon, public;
grant execute on function public.sign_in_owner(text, text) to authenticated;
