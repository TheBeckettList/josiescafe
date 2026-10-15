-- 021 · An order can only be paid once. Found by the Play scenarios: taking the payment twice with two different payment ids counted it twice.
-- A retry of the same payment (same id) was already safe; now a second, different payment for an order that is already paid is ignored too. Applied live.
create or replace function public.pay_orders(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare x jsonb; n int; paid int := 0;
begin
  if not public.is_pos() then raise exception 'not allowed'; end if;
  for x in select * from jsonb_array_elements(coalesce(p -> 'payments', '[]')) loop
    -- already paid (or cancelled): nothing to take
    if not exists (select 1 from public.orders where id = (x ->> 'order_id')::uuid and status = 'open') then continue; end if;
    insert into public.payments (id, order_id, method, amount, tip, usd_amount, usd_rate, card_ref, created_at)
    values ((x ->> 'id')::uuid, (x ->> 'order_id')::uuid, x ->> 'method', (x ->> 'amount')::numeric,
            coalesce((x ->> 'tip')::numeric, 0), (x ->> 'usd_amount')::numeric, (x ->> 'usd_rate')::numeric,
            nullif(x ->> 'card_ref', ''), coalesce((x ->> 'created_at')::timestamptz, now()))
    on conflict (id) do nothing;
    get diagnostics n = row_count;
    if n > 0 then
      update public.orders set status = 'paid', paid_at = coalesce(paid_at, coalesce((x ->> 'created_at')::timestamptz, now())),
             tip = tip + coalesce((x ->> 'tip')::numeric, 0), total = total + coalesce((x ->> 'tip')::numeric, 0)
       where id = (x ->> 'order_id')::uuid and status = 'open';
      paid := paid + 1;
    end if;
  end loop;
  return jsonb_build_object('ok', true, 'paid', paid);
end $$;
