-- 017 · Each dish can carry its own icon name from the art kit (used for pastries Josie adds herself). Applied live.
alter table public.items add column if not exists icon text;
