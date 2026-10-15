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
await db.exec('vacuum; checkpoint;').catch(() => {});
const blob = await db.dumpDataDir('gzip');
const out = path.join(root, 'play', 'db.tar.gz'); fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(await blob.arrayBuffer()));
console.log('wrote', out, fs.statSync(out).size, 'bytes');
await db.close();
