#!/bin/bash
# Fresh local Postgres with every migration applied (001..016), for testing the apps against the real server logic.
# usage: tools/test/setup-db.sh      (needs the postgres 16 server binaries and root, as in the cloud sandbox)
set -e
D=/var/tmp/pgt
su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D $D/data stop" >/dev/null 2>&1 || true
rm -rf $D; mkdir -p $D; chown postgres $D
su postgres -c "/usr/lib/postgresql/16/bin/initdb -D $D/data -A trust" >/dev/null
su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D $D/data -o '-p 5499 -k $D' -l $D/log start" >/dev/null
sleep 2
export PGOPTIONS="-c client_min_messages=warning"
P="psql -h $D -p 5499 -U postgres -q -v ON_ERROR_STOP=1"
$P -d postgres -c "create database t" -c "create role anon nologin" -c "create role authenticated nologin"
$P -d t <<'SQL'
create schema auth; create function auth.jwt() returns jsonb language sql as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
create schema net; create function net.http_get(url text) returns bigint language sql as $$ select 1::bigint $$;
create function net.http_post(url text, body jsonb default null, headers jsonb default null) returns bigint language sql as $$ select 1::bigint $$;
create table net._http_response(id bigint, status_code int, content text);
create schema cron; create function cron.schedule(a text,b text,c text) returns bigint language sql as $$ select 1::bigint $$;
create schema extensions;
SQL
R="$(cd "$(dirname "$0")/../.." && pwd)/supabase"
sed 's/create extension if not exists pg_net with schema extensions;//;s/create extension if not exists pg_cron;//' $R/001_schema.sql > /tmp/001_local.sql
for f in /tmp/001_local.sql $R/002_seed_menu.sql $R/003_online_orders.sql $R/004_tighten_online_functions.sql $R/005_real_menu.sql \
         $R/006_ticket_phones_and_pastries.sql $R/007_josies_world_schema.sql $R/008_draft_ingredients.sql $R/009_order_flow.sql $R/010_website_orders.sql $R/011_site_catalog.sql $R/012_manager_payroll.sql $R/013_ticket_push.sql $R/014_pastry_bank.sql $R/015_pastries_to_bar_and_checks.sql $R/016_table_13.sql $R/017_item_icon.sql $R/018_hidden_owner.sql $R/019_fk_indexes.sql $R/020_site_open_now.sql; do
  $P -d t -f $f >/dev/null || { echo "FAILED: $f"; exit 1; }
done
# open all hours so the website gate is testable any time; staff get known PINs
$P -d t <<'SQL'
update settings set hours='{"mon":"0:00-23:59","tue":"0:00-23:59","wed":"0:00-23:59","thu":"0:00-23:59","fri":"0:00-23:59","sat":"0:00-23:59","sun":"0:00-23:59"}', online_cutoff='23:58', online_orders=true, closed_until=null where id=1;
update people set pin_hash = extensions.crypt('1234', extensions.gen_salt('bf'));
SQL
echo "local db ready on socket $D port 5499 (db t)"
