/* Josie's World · Play mode. A pretend café that lives in your own browser: the real app runs against a real (tiny) Postgres
   that is downloaded once, loaded with the menu, five people (PIN 1234) and a few orders. Nothing leaves your device; nothing here is real money.
   Loaded by /play/app/ (a copy of the POS page, built by tools/play/build.mjs, that loads this after api.js and before the app), so it can preset the session and swap the network call. The real /pos/ knows nothing about it. Modern browsers only. */
(function (w, d) {
  'use strict';
  var JC = w.JC, base = (JC.cfg.url || '').replace(/\/$/, ''), db = null, voidFns = null, ready = null, VER = 'v3';
  var me = d.currentScript, GUEST_ONLY = !!(me && /[?&]guest=1/.test(me.src));   // the stand-alone customer link: just the guest website, its own café in memory
  w.J2PLAY = { on: true };
  /* no service worker in the sandbox: the app asks for one, the answer is nothing */
  try { Object.defineProperty(w.navigator, 'serviceWorker', { value: { register: function () { return Promise.resolve(); } }, configurable: true }); } catch (e) {}

  /* Containment: everything the app stores in play mode lives under its own prefix, so the real café's tablet sign-in,
     menu cache, queue and people on this same browser are never read or touched. */
  var PREFIX = 'jc.playx.';
  JC.get = function (k, fallback) { try { var v = w.localStorage.getItem(PREFIX + k); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } };
  JC.set = function (k, v) { try { w.localStorage.setItem(PREFIX + k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  JC.del = function (k) { try { w.localStorage.removeItem(PREFIX + k); } catch (e) {} };
  w.J2PLAY.store = { get: JC.get, set: JC.set, del: JC.del };
  function wipeStore() { try { var i, k, drop = []; for (i = 0; i < w.localStorage.length; i++) { k = w.localStorage.key(i); if (k.indexOf(PREFIX) === 0) { drop.push(k); } } for (i = 0; i < drop.length; i++) { w.localStorage.removeItem(drop[i]); } } catch (e) {} }
  /* the app thinks it is signed in on a shared tablet; people sign in with a PIN as always */
  JC.set('pos.session', { access_token: 'sandbox-token', refresh_token: 'play', expires_at: Date.now() + 3e11, email: 'pos@josiescafe.com' });
  if (!JC.get('pos.device', null)) { JC.set('pos.device', { code: 'A', mode: 'register', lang: 'en' }); }

  /* ───────── a little cover while the café is set up ───────── */
  var cover = d.createElement('div');
  cover.id = 'playcover';
  cover.setAttribute('style', 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:200;background:#FDEDF1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Baloo 2,Nunito,sans-serif;color:#5B3843;text-align:center;padding:24px');
  cover.innerHTML = '<img src="/img/josies-wordmark.png" alt="Josie’s" height="96" style="margin-bottom:12px"><b style="font-size:28px">Setting up the play café…</b><span id="playmsg" style="font-weight:700;color:#86606B;margin-top:6px">Nothing here is real. It all stays on your device.</span>';
  function cover_on() { if (!cover.parentNode) { (d.body || d.documentElement).appendChild(cover); } }
  function cover_off() { if (cover.parentNode) { cover.parentNode.removeChild(cover); } }
  if (d.body) { cover_on(); } else { d.addEventListener('DOMContentLoaded', cover_on); }
  function say(t) { var m = d.getElementById('playmsg'); if (m) { m.textContent = t; } }

  /* ───────── the database ───────── */
  function q(v) { return "'" + String(v).replace(/'/g, "''") + "'"; }
  function ident(s) { if (!/^[a-z_][a-z0-9_]*$/i.test(s)) { throw new Error('bad identifier ' + s); } return '"' + s + '"'; }
  function roleSql(authed) {
    return authed ? "set local role authenticated; select set_config('request.jwt.claims', '{\"email\":\"pos@josiescafe.com\"}', true);"
                  : "set local role anon; select set_config('request.jwt.claims', '{}', true);";
  }
  function run(sql, authed) {
    return db.transaction(function (tx) { return tx.exec(roleSql(authed)).then(function () { return tx.query(sql); }); });
  }
  function pgErr(e) {
    var msg = String((e && e.message) || e).replace(/^error:\s*/i, '').split('\n')[0], status = /permission denied|not allowed/.test(msg) ? 403 : 400;
    return { status: status, json: { message: msg, code: status === 403 ? '42501' : 'P0001' } };
  }
  function isVoid(fn) {
    if (voidFns) { return Promise.resolve(voidFns.indexOf(fn) >= 0); }
    return db.query("select string_agg(proname, ',') as s from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and prorettype = 'void'::regtype").then(function (r) {
      voidFns = String(r.rows[0].s || '').split(','); return voidFns.indexOf(fn) >= 0;
    });
  }
  function filters(params) {
    var where = [];
    Object.keys(params).forEach(function (k) {
      if (['select', 'order', 'limit', 'offset'].indexOf(k) >= 0) { return; }
      var v = params[k], m = /^(eq|neq|gt|gte|lt|lte|is|in)\.(.*)$/.exec(v);
      if (!m) { return; }
      var op = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' }[m[1]];
      if (m[1] === 'is') { where.push(ident(k) + ' is ' + (m[2] === 'null' ? 'null' : m[2] === 'true' ? 'true' : 'false')); }
      else if (m[1] === 'in') { where.push(ident(k) + ' in (' + m[2].replace(/^\(|\)$/g, '').split(',').map(q).join(',') + ')'); }
      else { where.push(ident(k) + ' ' + op + ' ' + q(m[2])); }
    });
    return where.length ? ' where ' + where.join(' and ') : '';
  }
  function selectSql(table, params) {
    var cols = (params.select || '*').split(',').map(function (c) { c = c.trim(); return c === '*' ? '*' : ident(c); }).join(', '), order = '', limit = '';
    if (params.order) { order = ' order by ' + params.order.split(',').map(function (o) { var p = o.split('.'); return ident(p[0]) + (p[1] === 'desc' ? ' desc' : ' asc'); }).join(', '); }
    if (params.limit) { limit = ' limit ' + parseInt(params.limit, 10); }
    return "select coalesce(jsonb_agg(t), '[]'::jsonb) as j from (select " + cols + ' from public.' + ident(table) + filters(params) + order + limit + ') t';
  }
  function rpcSql(fn, body, isv) {
    var args = Object.keys(body || {}).map(function (k) {
      var v = body[k];
      return ident(k) + ' := ' + (v === null ? 'null' : (typeof v === 'object') ? q(JSON.stringify(v)) : q(String(v)));
    }).join(', '), call = 'public.' + ident(fn) + '(' + args + ')';
    return isv ? 'select ' + call + " as j, 'null' as n" : 'select to_jsonb(' + call + ') as j';
  }
  /* The play café is a look-around: counting and ordering work, but nothing about the café itself can be changed.
     Anything that would edit the menu, prices, hours, ingredients, people or pay is turned away. */
  var BLOCKED_RPC = ['catalog_write', 'people_save', 'payroll_mark', 'payroll_view', 'tickets_new_code', 'people_list'];
  function readOnly(method, path, body) {
    var m = /^\/rest\/v1\/rpc\/([a-z0-9_]+)$/.exec(path);
    if (m) { return BLOCKED_RPC.indexOf(m[1]) >= 0; }
    if (/^\/rest\/v1\/[a-z0-9_]+$/.test(path) && method !== 'GET') {
      var ks = Object.keys(body || {});
      return !(method === 'PATCH' && /\/items$/.test(path) && ks.length === 1 && ks[0] === 'stock');   // counting pastries is fine
    }
    return false;
  }
  /* handle(method, path, query, body, authed) -> Promise<{status, json}> */
  function handle(method, path, query, body, authed) {
    var m;
    if (readOnly(method, path, body)) { blockedToast(); return Promise.resolve({ status: 403, json: { message: 'Edits are off in the play café', code: 'play' } }); }
    if ((m = /^\/auth\/v1\/token/.exec(path))) { return Promise.resolve({ status: 200, json: { access_token: 'sandbox-token', refresh_token: 'play', expires_in: 3e9, user: { email: 'pos@josiescafe.com' } } }); }
    if ((m = /^\/rest\/v1\/rpc\/([a-z0-9_]+)$/.exec(path)) && method === 'POST') {
      return isVoid(m[1]).then(function (isv) {
        return run(rpcSql(m[1], body, isv), authed).then(function (r) { return isv ? { status: 204, json: null } : { status: 200, json: r.rows[0].j }; });
      }).catch(function (e) { return pgErr(e); });
    }
    if ((m = /^\/rest\/v1\/([a-z0-9_]+)$/.exec(path))) {
      var t = m[1];
      try {
        if (method === 'GET') { return run(selectSql(t, query), authed).then(function (r) { return { status: 200, json: r.rows[0].j }; }).catch(pgErr); }
        if (method === 'PATCH') {
          var ks = Object.keys(body || {}); if (!ks.length) { return Promise.resolve({ status: 204, json: null }); }
          var js = q(JSON.stringify(body)), sql = 'update public.' + ident(t) + ' set ' + ks.map(function (k) { return ident(k) + ' = (jsonb_populate_record(null::public.' + ident(t) + ', ' + js + ')).' + ident(k); }).join(', ') + filters(query);
          return run(sql, authed).then(function () { return { status: 204, json: null }; }).catch(pgErr);
        }
        if (method === 'POST') {
          var rows = body instanceof Array ? body : [body], cols = Object.keys(rows[0] || {}).map(ident).join(', ');
          return run('insert into public.' + ident(t) + ' (' + cols + ') select ' + cols + ' from jsonb_populate_recordset(null::public.' + ident(t) + ', ' + q(JSON.stringify(rows)) + ')', authed)
            .then(function () { return { status: 204, json: null }; }).catch(pgErr);
        }
      } catch (e) { return Promise.resolve(pgErr(e)); }
    }
    return Promise.resolve({ status: 404, json: { message: 'not handled in play mode: ' + method + ' ' + path } });
  }

  /* the app's one network call: Supabase goes to the local database, everything else goes where it was going */
  var realHttp = JC.http;
  JC.http = function (method, url, bodyIn, headers, cb) {
    if (String(url).indexOf(base) !== 0) { return realHttp.apply(JC, arguments); }
    var u = String(url).slice(base.length), qi = u.indexOf('?'), path = qi < 0 ? u : u.slice(0, qi), query = {}, body = bodyIn;
    if (qi >= 0) { u.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) { query[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); } }); }
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }
    var authed = !!(headers && headers.Authorization);
    ready.then(function () { return handle(method, path, query, body, authed).then(function (r) { if (r.status >= 200 && r.status < 300) { afterWrite(path, body, r.json); } return r; }); }).then(function (r) {
      if (r.status >= 400 && w.console) { w.console.warn('play: ' + method + ' ' + path + ' -> ' + r.status + ' ' + JSON.stringify(r.json)); }
      w.setTimeout(function () { if (r.status >= 200 && r.status < 300) { cb(null, r.json, r.status); } else { cb({ status: r.status, data: r.json }, r.json, r.status); } }, 0);
    });
  };
  w.J2PLAY.handle = handle; w.J2PLAY.http = JC.http;
  w.J2PLAY.ready = function () { return ready; };

  /* ───────── a moment in the café: two sticks on tables, an add-on, an online order ───────── */
  function rpc(fn, body, authed) { return handle('POST', '/rest/v1/rpc/' + fn, {}, body, authed !== false).then(function (r) { if (r.status >= 300) { throw new Error(fn + ': ' + JSON.stringify(r.json)); } return r.json; }); }
  function one(sql) { return db.query(sql).then(function (r) { var row = r.rows[0]; return row ? row[Object.keys(row)[0]] : null; }); }
  var PASTRIES = "update items set active = true, price = 60, stock = 6 where name->>'en' in ('Brownie','Key lime pie','Croissant'); update items set active = true, price = 55, stock = 4 where name->>'en' = 'Cinnamon roll'";
  function seedFloor() {
    var names = {}, ids = {}, ings = {}, tbls = {}, u = function (n) { return '00000000-0000-0000-0000-0000000000' + ('0' + n).slice(-2); }, now = new Date().toISOString();
    function ago(m) { return new Date(Date.now() - m * 60000).toISOString(); }
    return db.query("select id, name->>'en' as n from items where active").then(function (r) { r.rows.forEach(function (x) { ids[x.n] = x.id; }); })
      .then(function () { return db.query("select id, name->>'en' as n from ingredients"); }).then(function (r) { r.rows.forEach(function (x) { ings[x.n] = x.id; }); })
      .then(function () { return db.query('select id, label from tables'); }).then(function (r) { r.rows.forEach(function (x) { tbls[x.label] = x.id; }); })
      .then(function () {
        return rpc('sync_order2', { p: { order: { id: u(1), device: 'A', number: '4', customer_name: 'Ana', order_type: 'here', status: 'paid', subtotal: 330, total: 330, tax: 43, staff_name: 'Rosa', created_at: ago(6), paid_at: ago(5), has_bar: false, has_kitchen: true, stick_number: 4 },
          pieces: [{ id: u(11), station: 'kitchen', kind: 'original' }],
          items: [{ id: u(21), item_id: ids['Full plate'], name: 'Full plate', qty: 1, unit_price: 185, station: 'kitchen', piece_id: u(11), chips: [{ type: 'no', ingredient_id: ings['Bacon'], diet: 'kosher_style' }] },
                  { id: u(22), item_id: ids['Avocado toast'], name: 'Avocado toast', qty: 1, unit_price: 145, station: 'kitchen', piece_id: u(11), chips: [{ type: 'no', ingredient_id: ings['Egg'] }, { type: 'add', ingredient_id: ings['Tomato'] }] }],
          payments: [{ id: u(31), method: 'cash_hnl', amount: 330 }] } });
      })
      .then(function () { return rpc('place_stick', { p: { stick: 4, table_id: tbls['3'] } }); })
      .then(function () {
        return rpc('sync_order2', { p: { order: { id: u(2), device: 'A', number: '9', customer_name: 'Luis', order_type: 'here', status: 'open', total: 140, created_at: ago(2), has_bar: true, has_kitchen: false, stick_number: 9 },
          pieces: [{ id: u(12), station: 'bar', kind: 'original' }],
          items: [{ id: u(23), item_id: ids['Iced latte'], name: 'Iced latte', qty: 1, unit_price: 75, station: 'bar', piece_id: u(12), chips: [] }, { id: u(24), item_id: ids['Latte'], name: 'Latte', qty: 1, unit_price: 65, station: 'bar', piece_id: u(12), chips: [] }] } });
      })
      .then(function () { return rpc('place_stick', { p: { stick: 9, table_id: tbls['5'] } }); })
      .then(function () {
        return rpc('sync_order2', { p: { order: { id: u(4), device: 'A', number: '7', customer_name: 'Marta', order_type: 'here', status: 'paid', total: 150, created_at: now, paid_at: now, has_bar: false, has_kitchen: true, stick_number: 7 },
          pieces: [{ id: u(14), station: 'kitchen', kind: 'original' }], items: [{ id: u(26), item_id: ids['Josie bagel'], name: 'Josie bagel', qty: 1, unit_price: 150, station: 'kitchen', piece_id: u(14), chips: [] }], payments: [{ id: u(32), method: 'cash_hnl', amount: 150 }] } });
      })
      .then(function () { return rpc('place_stick', { p: { stick: 7, table_id: null } }); })
      .then(function () {
        return rpc('place_online_order2', { p: { id: '00000000-0000-0000-0000-0000000000f1', name: 'Sam', order_type: 'togo', lines: [{ item_id: ids['Iced latte'], qty: 2 }, { item_id: ids['Josie bagel'], qty: 1 }] } }, false);
      })
      .then(function () { return db.exec("update items set active = true, price = 60, stock = 6 where name->>'en' in ('Brownie','Key lime pie','Croissant'); update items set price = 55, stock = 4 where name->>'en' = 'Cinnamon roll'; update items set active = true, price = 55, stock = 4 where name->>'en' = 'Cinnamon roll'"); });
  }

  /* ───────── gentle messages instead of dialogs, and the admin corners hidden ───────── */
  var toastEl = null, toastT = null, lastBlock = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = d.createElement('div'); toastEl.setAttribute('style', 'position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:150;max-width:min(420px,calc(100vw - 32px));background:#5B3843;color:#fff;font:800 16px/1.3 Nunito,system-ui,sans-serif;padding:12px 18px;border-radius:20px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.3);transition:opacity .25s'); (d.body || d.documentElement).appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.style.opacity = '1'; w.clearTimeout(toastT); toastT = w.setTimeout(function () { toastEl.style.opacity = '0'; }, 3200);
  }
  function blockedToast() { lastBlock = Date.now(); toast('Edits are turned off in the play café. This is where Josie would change it.'); }
  w.alert = function (m) { if (Date.now() - lastBlock < 1500) { return; } toast(String(m || '')); };
  w.confirm = function () { return true; };
  var css = d.createElement('style');
  css.textContent = '.mpayroll,.mteam,.mphones,.sgopen{display:none!important}';
  (d.head || d.documentElement).appendChild(css);

  /* ───────── the pretend kitchen and bar phone: a banner for every order that is pushed ───────── */
  var phoneEl = null, phoneList = null, pushed = {};
  function ensurePhone() {
    if (phoneEl) { return; }
    var st = d.createElement('style');
    st.textContent = '@keyframes ph-in{from{transform:translateY(-14px);opacity:0}to{transform:none;opacity:1}}@keyframes ph-buzz{0%,100%{transform:none}15%{transform:translateX(-4px) rotate(-1deg)}30%{transform:translateX(4px) rotate(1deg)}45%{transform:translateX(-3px)}60%{transform:translateX(3px)}}' +
      '#playphone.buzz{animation:ph-buzz .5s}#playphone .nt{animation:ph-in .35s}';
    d.head.appendChild(st);
    phoneEl = d.createElement('div'); phoneEl.id = 'playphone';
    phoneEl.setAttribute('style', 'position:fixed;right:18px;bottom:64px;z-index:83;width:236px;height:430px;border-radius:38px;background:#1D1417;padding:9px;box-shadow:0 18px 44px rgba(0,0,0,.4);font-family:Nunito,system-ui,sans-serif');
    phoneEl.innerHTML = '<div style="position:relative;height:100%;border-radius:30px;overflow:hidden;background:linear-gradient(170deg,#F7C6D6,#E58AA9 60%,#B55573);color:#fff">' +
      '<div style="position:absolute;left:50%;top:7px;width:70px;height:18px;margin-left:-35px;border-radius:12px;background:#1D1417"></div>' +
      '<div style="padding:34px 14px 0;text-align:center"><b style="font:800 44px/1 Baloo 2,Nunito,sans-serif" id="phclock"></b><div style="font-weight:800;font-size:13px;opacity:.9;margin-top:2px">Kitchen and bar phone</div></div>' +
      '<div id="phlist" style="padding:10px 10px 0;height:290px;overflow:hidden"></div>' +
      '<button type="button" id="phx" aria-label="Close" style="position:absolute;right:10px;top:8px;width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.35);color:#fff;font-size:18px;line-height:24px">&times;</button></div>';
    d.body.appendChild(phoneEl); phoneList = d.getElementById('phlist');
    d.getElementById('phx').addEventListener('click', function () { phoneEl.style.display = 'none'; });
    clock(); w.setInterval(clock, 20000);
  }
  function placePhone() { if (phoneEl) { phoneEl.style.right = (d.getElementById('playguest') && w.innerWidth > 760) ? '424px' : '18px'; } }
  function clock() { var c = d.getElementById('phclock'); if (c) { var n = new Date(); c.textContent = n.getHours() % 12 || 12; c.textContent += ':' + ('0' + n.getMinutes()).slice(-2); } }
  function esc2(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function banner(station, card) {
    if (GUEST_ONLY) { return; }
    ensurePhone(); phoneEl.style.display = ''; placePhone();
    var n = d.createElement('div'); n.className = 'nt';
    n.setAttribute('style', 'background:rgba(255,255,255,.93);color:#3A2A30;border-radius:18px;padding:9px 11px;margin-bottom:8px;box-shadow:0 4px 12px rgba(0,0,0,.18)');
    n.innerHTML = '<div style="display:flex;align-items:center;font-size:11px;font-weight:800;color:#86606B;letter-spacing:.04em"><span style="display:inline-block;width:16px;height:16px;border-radius:5px;background:#B55573;color:#fff;text-align:center;line-height:16px;margin-right:6px;font-size:11px">J</span>JOSIE’S · ' + station.toUpperCase() + '<span style="margin-left:auto">now</span></div>' +
      '<div style="font:800 14px/1.2 Nunito,system-ui,sans-serif;margin-top:4px">' + esc2(card.title) + '</div><div style="font-weight:700;font-size:12.5px;line-height:1.3;white-space:pre-line;margin-top:2px;color:#5B4750">' + esc2(card.body) + '</div>';
    phoneList.insertBefore(n, phoneList.firstChild);
    while (phoneList.children.length > 4) { phoneList.removeChild(phoneList.lastChild); }
    phoneEl.classList.remove('buzz'); void phoneEl.offsetWidth; phoneEl.classList.add('buzz');
  }
  /* what the real server would push: the same text, from the same database function */
  function pushFor(orderId) {
    ['kitchen', 'bar'].forEach(function (st) {
      db.query('select public.push_card($1::uuid, $2, $3) as c', [orderId, st, 'en']).then(function (r) {
        var c = r.rows[0] && r.rows[0].c; if (!c) { return; }
        var key = orderId + ':' + st + ':' + c.title + ':' + c.body.length; if (pushed[key]) { return; } pushed[key] = 1;
        banner(st, c);
      }).catch(function () {});
    });
  }
  /* a guest's order walks itself through the café: the cashier takes payment, then it is picked up, five seconds apart */
  function walkOrder(id) {
    w.setTimeout(function () {
      one("select total from orders where id = '" + id + "'").then(function (tot) {
        return rpc('pay_orders', { p: { payments: [{ id: JC.uuid(), order_id: id, method: 'cash_hnl', amount: Number(tot || 0) }] } });
      }).catch(function () {});
    }, 5000);
    w.setTimeout(function () { rpc('complete_number', { p: { order_ids: [id], at: new Date().toISOString() } }).catch(function () {}); }, 10000);
  }
  function afterWrite(path, body, out) {
    var m = /^\/rest\/v1\/rpc\/([a-z0-9_]+)$/.exec(path); if (!m) { return; }
    var fn = m[1], p = (body && body.p) || {};
    if (fn === 'sync_order2' && p.order && p.order.id) { pushFor(p.order.id); }
    else if (fn === 'place_online_order2' && p.id) { pushFor(p.id); walkOrder(p.id); }
    else if (fn === 'add_to_online_order' && (p.id || p.order_id)) { pushFor(p.id || p.order_id); }
    else if (fn === 'stop_item' && p.alert_id) {
      db.query('select a.station, public.push_alert_card(a.id, $2) as c from public.ticket_alerts a where a.id = $1::uuid', [p.alert_id, 'en']).then(function (r) { var x = r.rows[0]; if (x && x.c) { banner(x.station, x.c); } }).catch(function () {});
    }
  }

  /* for the scenarios: call the same functions the POS calls (with the push banners), and ask the café's database things */
  w.J2PLAY.call = function (fn, body, authed) {
    return handle('POST', '/rest/v1/rpc/' + fn, {}, body || {}, authed !== false).then(function (r) {
      if (r.status >= 300) { throw new Error(fn + ': ' + JSON.stringify(r.json)); }
      afterWrite('/rest/v1/rpc/' + fn, body || {}, r.json); return r.json;
    });
  };
  w.J2PLAY.q = function (sql, params) { return db.query(sql, params || []).then(function (r) { return r.rows; }); };
  w.J2PLAY.switchTo = function (name) { switchTo(name); };
  w.J2PLAY.seed = seedFloor;
  /* ───────── boot ───────── */
  function deleteIdb() { return new Promise(function (res) { try { var r = w.indexedDB.deleteDatabase('/pglite/josies-play-' + VER); r.onsuccess = r.onerror = r.onblocked = function () { res(); }; } catch (e) { res(); } }); }
  function boot() {
    var fresh = false;
    try { fresh = GUEST_ONLY || !w.localStorage.getItem('jc.play.seeded.' + VER); } catch (e) {}
    say('Loading the little database…');
    return (fresh ? deleteIdb() : Promise.resolve()).then(function () {
      return Promise.all([import('./vendor/index.js'), fresh ? w.fetch('/play/db.tar.gz').then(function (r) { return r.blob(); }) : Promise.resolve(null)]);
    }).then(function (x) {
      var opts = { relaxedDurability: true }; if (x[1]) { opts.loadDataDir = x[1]; }
      return x[0].PGlite.create(GUEST_ONLY ? 'memory://' : 'idb://josies-play-' + VER, opts);
    }).then(function (inst) {
      db = inst;
      if (GUEST_ONLY) { return db.exec(PASTRIES); }
      return fresh ? (say('Putting a few guests in the café…'), seedFloor().then(function () { try { w.localStorage.setItem('jc.play.seeded.' + VER, '1'); } catch (e) {} })) : null;
    });
  }
  ready = boot().then(function () { cover_off(); if (!GUEST_ONLY) { bar(); } }).catch(function (e) { say('Play mode could not start here (' + String(e && e.message || e).slice(0, 90) + '). Try a newer browser.'); throw e; });

  /* ───────── the little bar: who you are, switch, start over ───────── */
  var WHO = [['Rosa', 'Rosa · register'], ['Beto', 'Beto · bar'], ['Lupe', 'Lupe · kitchen'], ['Josie', 'Josie · owner (look only)']];
  function bar() {
    var el = d.createElement('div'), open = false;
    el.id = 'playbar';
    el.setAttribute('style', 'position:fixed;left:10px;bottom:10px;z-index:85;font-family:Baloo 2,Nunito,sans-serif');
    function draw() {
      var h = '';
      if (open) {
        h += '<div style="background:#fff;border-radius:22px;padding:12px;margin-bottom:8px;box-shadow:0 0 0 3px #F5B5C8,0 12px 30px rgba(142,63,89,.3);min-width:230px"><b style="display:block;color:#5B3843;font-size:17px;margin-bottom:6px">Play as…</b>';
        WHO.forEach(function (x) { h += '<button type="button" data-who="' + x[0] + '" style="display:block;width:100%;text-align:left;padding:9px 12px;margin:3px 0;border-radius:14px;background:#FDEDF1;color:#B55573;font-weight:800;font-size:16px">' + x[1] + '</button>'; });
        h += '<button type="button" data-guest style="display:block;width:100%;text-align:left;padding:9px 12px;margin:3px 0;border-radius:14px;background:#FDEDF1;color:#B55573;font-weight:800;font-size:16px">Guest website ↗</button>';
        h += '<button type="button" data-reset style="display:block;width:100%;text-align:left;padding:9px 12px;margin:8px 0 0;border-radius:14px;background:#fff;color:#86606B;font-weight:800;font-size:14px;box-shadow:inset 0 0 0 2px #F5D3DE">Start the café over</button></div>';
      }
      h += '<button type="button" data-toggle style="padding:9px 16px;border-radius:22px;background:#B55573;color:#fff;font-weight:800;font-size:15px;box-shadow:0 4px 14px rgba(142,63,89,.35)">▶ Play mode</button>';
      el.innerHTML = h;
    }
    el.addEventListener('click', function (e) {
      var t = e.target; while (t && t !== el && !(t.getAttribute && (t.getAttribute('data-who') || t.hasAttribute('data-toggle') || t.hasAttribute('data-reset') || t.hasAttribute('data-guest')))) { t = t.parentNode; }
      if (!t || t === el) { return; }
      if (t.hasAttribute('data-toggle')) { open = !open; draw(); return; }
      if (t.hasAttribute('data-guest')) { open = false; draw(); guestPanel(); return; }
      if (t.hasAttribute('data-reset')) {
        if (!w.confirm('Start the play café over? Everything you did goes away.')) { return; }
        try { w.localStorage.removeItem('jc.play.seeded.' + VER); } catch (er) {} wipeStore();
        db.close().then(deleteIdb).then(function () { w.location.reload(); }); return;
      }
      open = false; draw(); switchTo(t.getAttribute('data-who'));
    });
    d.body.appendChild(el); draw();
  }
  /* the guest website in a phone-sized window, talking to the very same café: order there, watch it arrive at the bar and kitchen */
  function guestPanel() {
    var old = d.getElementById('playguest'), wide = w.innerWidth > 760, el;
    if (old) { old.parentNode.removeChild(old); return; }
    el = d.createElement('div'); el.id = 'playguest';
    el.setAttribute('style', 'position:fixed;z-index:84;' + (wide ? 'right:18px;bottom:14px;width:390px;height:min(780px,calc(100vh - 40px))' : 'left:0;right:0;bottom:0;top:0'));
    el.innerHTML = '<div style="position:absolute;left:0;top:0;right:0;bottom:0;background:#fff;overflow:hidden;box-shadow:0 0 0 4px #F5B5C8,0 20px 50px rgba(142,63,89,.4);border-radius:' + (wide ? '26px' : '0') + '"><iframe src="/play/guest/" title="Guest website" style="border:0;width:100%;height:100%"></iframe></div>' +
      '<button type="button" aria-label="Close" style="position:absolute;right:' + (wide ? '-10px' : '8px') + ';top:' + (wide ? '-10px' : '8px') + ';z-index:2;width:36px;height:36px;border-radius:50%;background:#B55573;color:#fff;font-size:24px;line-height:34px;box-shadow:0 3px 10px rgba(0,0,0,.3)">&times;</button>';
    el.lastChild.addEventListener('click', function () { el.parentNode.removeChild(el); });
    d.body.appendChild(el); placePhone();
    el.lastChild.addEventListener('click', function () { w.setTimeout(placePhone, 0); });
  }
  /* picking a person types the PIN for them: everyone here is 1234 */
  function autopin() { ['1', '2', '3', '4'].forEach(function (k, ix) { w.setTimeout(function () { var kb = d.querySelector('.key[data-arg="' + k + '"]'); if (kb) { kb.click(); } }, 260 + ix * 70); }); }
  d.addEventListener('click', function (e) { var t = e.target; while (t && t !== d.body) { if (t.classList && t.classList.contains('person')) { autopin(); return; } t = t.parentNode; } }, false);
  function switchTo(name) {
    var J = w.J2; if (!J) { return; }
    function tryPick(n) {
      var btns = d.querySelectorAll('.person'), i, hitBtn = null;
      for (i = 0; i < btns.length; i++) { if ((btns[i].textContent || '').indexOf(name) >= 0) { hitBtn = btns[i]; } }
      if (hitBtn) { hitBtn.click(); }
      else if (n < 25) { w.setTimeout(function () { tryPick(n + 1); }, 120); }
    }
    if (J.S && J.S.person) { J.signOut(); J.S.tab = 'pos'; if (J.S.ui) { J.S.ui.popup = null; J.S.ui.flip = false; J.S.ui.viewAs = null; J.S.ui.tour = null; J.S.ui.setup = null; } }
    w.setTimeout(function () { tryPick(0); }, 250);
  }
}(window, document));
