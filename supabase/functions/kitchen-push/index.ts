// kitchen-push · sends "new ticket" alerts to the kitchen and bar phones (josiescafe.com/pos/tickets).
//
// Called by the database (orders_push trigger) with {order_id} when an order with bar or kitchen items arrives,
// and by a phone with {test: endpoint, code} right after it turns alerts on.
// It needs no secret from the caller: an order is only ever alerted once (orders.pushed_at), only while it's
// under 30 minutes old, and a test alert needs the ticket code plus a phone that already signed up.
import postgres from 'npm:postgres@3.4.5';
import { generateVapid, sendPush } from './webpush.js';

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false, max: 2 });
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const WORDS: Record<string, Record<string, string>> = {
  es: { here: 'Para aquí', togo: 'PARA LLEVAR', online: 'En línea', pickup: 'recoge', note: 'Nota', testT: '✓ Avisos activados', testB: 'Así te llegará cada ticket nuevo.' },
  en: { here: 'For here', togo: 'TO GO', online: 'Online', pickup: 'pickup', note: 'Note', testT: '✓ Alerts are on', testB: 'This is how every new ticket will show up.' },
};
const w = (lang: string, k: string) => (WORDS[lang] || WORDS.es)[k];
const clock = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/Tegucigalpa', hour: 'numeric', minute: '2-digit' }).format(new Date(iso)).toLowerCase();

async function vapidKeys() {
  let rows = await sql`select public_key, private_jwk from public.push_keys where id = 1`;
  if (!rows.length) {
    const k = await generateVapid();
    await sql`insert into public.push_keys (id, public_key, private_jwk) values (1, ${k.publicKey}, ${sql.json(k.jwk)}) on conflict (id) do nothing`;
    rows = await sql`select public_key, private_jwk from public.push_keys where id = 1`;
  }
  return { publicKey: rows[0].public_key as string, jwk: rows[0].private_jwk as JsonWebKey };
}

type Sub = { endpoint: string; p256dh: string; auth: string; station: string; lang: string };
async function deliver(subs: Sub[], build: (s: Sub) => unknown, topic?: string) {
  const vapid = await vapidKeys();
  const results = await Promise.all(subs.map(async (s) => {
    try {
      const status = await sendPush(s, build(s), vapid, { topic });
      if (status === 404 || status === 410) await sql`delete from public.push_subs where endpoint = ${s.endpoint}`;
      else if (status >= 200 && status < 300) await sql`update public.push_subs set last_ok_at = now() where endpoint = ${s.endpoint}`;
      return status;
    } catch (e) {
      console.error('push failed', String(e));
      return 0;
    }
  }));
  return results;
}

async function orderAlert(orderId: string) {
  const claimed = await sql`
    update public.orders set pushed_at = now()
     where id = ${orderId} and pushed_at is null and status <> 'void' and created_at > now() - interval '30 minutes'
     returning id, number, customer_name, order_type, source, pickup_at, note, bar_done_at, kitchen_done_at`;
  if (!claimed.length) return { skipped: true };
  const o = claimed[0];
  const items = await sql`
    select oi.qty, oi.note, oi.station, oi.name, it.name as names
      from public.order_items oi left join public.items it on it.id = oi.item_id
     where oi.order_id = ${orderId} and oi.station in ('kitchen', 'bar') order by oi.id`;
  const stations = ['kitchen', 'bar'].filter((st) =>
    items.some((i) => i.station === st) && !(st === 'bar' ? o.bar_done_at : o.kitchen_done_at));
  if (!stations.length) return { skipped: true };
  const subs = (await sql`select endpoint, p256dh, auth, station, lang from public.push_subs where station in ${sql(stations)}`) as unknown as Sub[];
  if (!subs.length) return { sent: 0 };

  const statuses = await deliver(subs, (s) => {
    const lang = s.lang === 'en' ? 'en' : 'es';
    const mine = items.filter((i) => i.station === s.station);
    const head = [String(o.number)];
    if (o.source === 'online') head.push(w(lang, 'online') + (o.pickup_at ? ' · ' + w(lang, 'pickup') + ' ' + clock(o.pickup_at) : ''));
    else head.push(o.order_type === 'togo' ? w(lang, 'togo') : w(lang, 'here'));
    if (o.customer_name) head.push(String(o.customer_name));
    if (o.source === 'online' && o.order_type === 'togo') head.push(w(lang, 'togo'));
    const lines = mine.map((i) => {
      const nm = (i.names && (i.names[lang] || i.names.en)) || i.name;
      return `${i.qty}× ${nm}${i.note ? ' → ' + i.note : ''}`;
    });
    if (o.note) lines.push(`${w(lang, 'note')}: ${o.note}`);
    return { title: head.join(' · '), body: lines.join('\n'), tag: `${o.id}:${s.station}`, url: `/pos/tickets/#o=${o.id}` };
  }, String(o.id).replace(/-/g, '').slice(0, 32));
  return { sent: statuses.filter((x) => x >= 200 && x < 300).length, statuses };
}

async function testAlert(endpoint: string, code: string, lang: string) {
  const ok = await sql`select public.tickets_ok(${code}) as ok`;
  if (!ok[0]?.ok) return json({ error: 'bad code' }, 403);
  const subs = (await sql`select endpoint, p256dh, auth, station, lang from public.push_subs where endpoint = ${endpoint}`) as unknown as Sub[];
  if (!subs.length) return json({ error: 'not signed up' }, 404);
  const l = lang === 'en' ? 'en' : 'es';
  const statuses = await deliver(subs, () => ({ title: w(l, 'testT'), body: w(l, 'testB'), tag: 'test', url: '/pos/tickets/' }));
  return json({ statuses });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    if (req.method === 'GET') return json({ vapid: (await vapidKeys()).publicKey });
    const body = await req.json().catch(() => ({}));
    if (body.test) return await testAlert(String(body.test), String(body.code || ''), String(body.lang || 'es'));
    if (body.order_id && /^[0-9a-f-]{36}$/i.test(body.order_id)) return json(await orderAlert(body.order_id));
    if (body.init) return json({ vapid: (await vapidKeys()).publicKey });
    return json({ error: 'nothing to do' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: 'server error' }, 500);
  }
});
