-- Josie's Cafe · v1.1 follow-up (applied 2026-10-13): quiet two Supabase security advisor warnings.
-- hn_now: fixed search_path
alter function public.hn_now() set search_path = public;
-- open_at is only used inside place_online_order; it doesn't need to be callable from the API
revoke execute on function public.open_at(timestamp) from public, anon, authenticated;
