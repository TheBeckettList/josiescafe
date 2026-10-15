// Builds play/db.tar.gz: a Postgres (PGlite) data directory with every migration applied and a small preset café,
// so the Play mode in the browser opens in about a second. Run: cd tools/play && npm i && node build.mjs
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const here = path.dirname(url.fileURLToPath(import.meta.url)), root = path.join(here, '..', '..'), sup = path.join(root, 'supabase');
const db = new PGlite();
await db.exec(`create role anon nologin; create role authenticated nologin;
create schema auth; create function auth.jwt() returns jsonb language sql as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
create schema net; create function net.http_get(url text) returns bigint language sql as $$ select 1::bigint $$;
create function net.http_post(url text, body jsonb default null, headers jsonb default null) returns bigint language sql as $$ select 1::bigint $$;
create table net._http_response(id bigint, status_code int, content text);
create schema cron; create function cron.schedule(a text,b text,c text) returns bigint language sql as $$ select 1::bigint $$;
create schema extensions;
-- PGlite has no pgcrypto: a stand-in good enough for a demo PIN (salt + md5), same call shape as the real one
create function extensions.gen_salt(t text) returns text language sql as $$ select substr(md5(random()::text || clock_timestamp()::text), 1, 8) $$;
create function extensions.crypt(pw text, salt text) returns text language sql immutable as $$ select substr(salt, 1, 8) || md5(substr(salt, 1, 8) || pw) $$;`);
const files = fs.readdirSync(sup).filter(f => /^\d{3}_.*\.sql$/.test(f)).sort();
for (const f of files) {
  let s = fs.readFileSync(path.join(sup, f), 'utf8');
  s = s.replace('create extension if not exists pgcrypto with schema extensions;', '').replace('create extension if not exists pg_net with schema extensions;', '').replace('create extension if not exists pg_cron;', '');
  try { await db.exec(s); } catch (e) { console.error('FAILED', f, e.message); process.exit(1); }
  console.log('ok', f);
}
const extra = fs.readFileSync(path.join(here, 'preset.sql'), 'utf8');
await db.exec(extra);
// the pretend pastry case, so the light engine's snapshot has it too
await db.exec(`update items set active = true, price = 60, stock = 6 where name->>'en' in ('Brownie','Key lime pie','Croissant'); update items set active = true, price = 55, stock = 4 where name->>'en' = 'Cinnamon roll'`);
// the light engine (play/engine-sim.js) starts from this snapshot of the same café: no database in the browser
const snap = {};
for (const [k, sql] of Object.entries({
  categories: 'select * from categories order by sort', items: 'select * from items order by sort', settings: 'select * from settings',
  fx: 'select day, bank_buy, bank_sell from fx_rates order by day desc limit 10', ingredients: 'select * from ingredients order by id',
  dish_ingredients: 'select * from dish_ingredients', swaps: 'select * from swaps order by sort', diets: 'select * from diets order by sort',
  diet_marks: 'select * from diet_marks', tables: 'select * from tables order by label', sticks: 'select * from sticks order by number',
  people: 'select id, name, role, station, language, active, hidden from people order by name', ticket_link: 'select code from ticket_link'
})) { snap[k] = (await db.query(`select coalesce(jsonb_agg(t), '[]'::jsonb) as j from (${sql}) t`)).rows[0].j; }
fs.writeFileSync(path.join(root, 'play', 'data.json'), JSON.stringify(snap));
console.log('wrote play/data.json', fs.statSync(path.join(root, 'play', 'data.json')).size, 'bytes');
await db.exec('vacuum; checkpoint;').catch(() => {});
const blob = await db.dumpDataDir('gzip');
const out = path.join(root, 'play', 'db.tar.gz'); fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(await blob.arrayBuffer()));
console.log('wrote', out, fs.statSync(out).size, 'bytes');
await db.close();
