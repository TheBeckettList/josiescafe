/* Josie's World · Play · the light engine.
   The play café used to run on a whole Postgres in the browser (about 18 MB). This is the same café in plain JavaScript: a few thousand lines of
   rules in one small file plus a 100 KB snapshot of the menu (play/data.json, made from the real database by tools/play/build.mjs).
   It answers the very same calls the POS and the website make (the REST reads and the rpc functions in supabase/009–021), with the same answers
   and the same error words, so the app cannot tell the difference. The database stays the truth: tools/test/t_engines.js plays the same
   moves against both and compares. Open /play/app/?engine=real to run the real thing in the browser instead.
   Plain ES5 style, modern browsers only. */
(function (w) {
  'use strict';
  function uuid() { return (w.crypto && w.crypto.randomUUID) ? w.crypto.randomUUID() : w.JC.uuid(); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function iso(ms) { return new Date(ms).toISOString(); }
  function bad(msg, status) { var e = new Error(msg); e.status = status || 400; return e; }
  function num(x, dflt) { var n = Number(x); return isNaN(n) || x === null || x === undefined || x === '' ? (dflt === undefined ? 0 : dflt) : n; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function tx(o, lang) { var v; if (!o) { return null; } v = o[lang]; if (v === undefined || v === null) { v = o.en; } return v === undefined ? null : v; }   // like coalesce(o ->> lang, o ->> 'en')

  w.J2SIM = function (snap, persist) {
    var D = clone(snap), KEY = 'jc.playx.sim.v1';
    D.orders = []; D.pieces = []; D.oitems = []; D.payments = []; D.alerts = []; D.ilog = []; D.shifts = []; D.tut = {};
    if (persist) { try { var saved = w.localStorage.getItem(KEY); if (saved) { D = JSON.parse(saved); } } catch (e) {} }
    var saveT = null;
    function save() {
      if (!persist) { return; }
      if (saveT) { return; }
      saveT = w.setTimeout(function () { saveT = null; try { w.localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }, 500);
    }
    function byId(list) { return list.slice().sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; }); }
    function by(list, key, val) { var i; for (i = 0; i < list.length; i++) { if (list[i][key] === val) { return list[i]; } } return null; }
    function item(id) { return by(D.items, 'id', id); }
    function cat(id) { return by(D.categories, 'id', id); }
    function ing(id) { return by(D.ingredients, 'id', id); }
    function order(id) { return by(D.orders, 'id', id); }
    function S() { return D.settings[0]; }
    function stickRow(n, make) { var s = by(D.sticks, 'number', n); if (!s && make) { s = { number: n, state: 'home', table_id: null }; D.sticks.push(s); } return s; }

    /* ───────── time in Honduras (UTC-6, all year) and the weekly hours ───────── */
    function hnNow() { return new Date(Date.now() - 6 * 3600e3); }                  // read with the UTC getters
    function hnDate(d) { return d.toISOString().slice(0, 10); }
    function openAt(d) {
      var s = S(), k, r, m, f, t, mins;
      if (s.closed_until && hnDate(d) <= s.closed_until) { return false; }
      k = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getUTCDay()];
      r = String((s.hours || {})[k] || 'closed').replace(/ /g, '');
      m = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/.exec(r); if (!m) { return false; }
      f = Number(m[1]) * 60 + Number(m[2]); t = Number(m[3]) * 60 + Number(m[4]); mins = d.getUTCHours() * 60 + d.getUTCMinutes();
      return mins >= f && mins < t;
    }
    function gate() {
      var s = S(), d = hnNow(), c = /^(\d{1,2}):(\d{2})/.exec(s.online_cutoff || '23:59');
      if (!s.online_orders) { return 'orders_paused'; }
      if (!openAt(d)) { return 'closed_now'; }
      if ((d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds()) >= Number(c[1]) * 3600 + Number(c[2]) * 60) { return 'after_cutoff'; }
      return null;
    }

    /* ───────── what is out ───────── */
    function dishState() {
      var out = {};
      D.items.forEach(function (i) {
        if (!i.active) { return; }
        var dis = D.dish_ingredients.filter(function (x) { return x.item_id === i.id; }), missing = [], isOut = !i.available;
        dis.forEach(function (di) {
          var g = ing(di.ingredient_id); if (!g) { return; }
          if (g.kind === 'base' && g.light === 'red') { isOut = true; }
          if (g.kind === 'element' && g.light === 'red') {
            missing.push({ id: g.id, name: g.name, swaps: D.swaps.filter(function (s) { return s.element_id === g.id && !s.diet_id; }).sort(function (a, b) { return a.sort - b.sort; })
              .map(function (s) { return ing(s.alternative_id); }).filter(function (a) { return a && a.light === 'green' && a.active; }).map(function (a) { return { id: a.id, name: a.name }; }) });
          }
        });
        out[i.id] = { out: isOut, missing: missing };
      });
      return out;
    }
    function applyStock(oid, sign) {
      var q = {};
      D.oitems.forEach(function (x) { if (x.order_id === oid && x.item_id) { q[x.item_id] = (q[x.item_id] || 0) + x.qty; } });
      Object.keys(q).forEach(function (id) { var i = item(id), c = i && cat(i.category_id); if (c && c.counted) { i.stock = num(i.stock, 0) + sign * q[id]; } });
    }

    /* ───────── people, shifts ───────── */
    function posOnly(authed) { if (!authed) { throw bad('not allowed', 403); } }
    function need(token, minRole) {
      var sh = by(D.shifts, 'id', token), p = sh && !sh.out_at ? by(D.people, 'id', sh.person_id) : null, rank = { josie: 3, manager: 2 };
      if (!p) { throw bad('sign in first'); }
      if ((rank[p.role] || 1) < (rank[minRole] || 1)) { throw bad('not allowed', 403); }
      return p;
    }
    function signIn(a, authed) {
      posOnly(authed);
      var p = by(D.people, 'id', a.p_person), sh, i;
      if (!p || !p.active) { return { ok: false }; }
      if (String(a.p_pin) !== '1234') { return { ok: false }; }
      for (i = 0; i < D.shifts.length; i++) { if (D.shifts[i].person_id === p.id && !D.shifts[i].out_at) { sh = D.shifts[i]; } }
      if (!sh) { sh = { id: uuid(), person_id: p.id, in_at: iso(Date.now()), out_at: null, device: a.p_device || null }; D.shifts.push(sh); }
      return { ok: true, token: sh.id, name: p.name, role: p.role, station: p.station, language: p.language, first_time: !D.tut[p.id] };
    }

    /* ───────── lines, pricing ───────── */
    function priceLines(lines, type) {
      var ds = dishState(), outl = [], sub = 0, togo = 0, n = 0, l, i, it, c, q, ch;
      lines = lines || [];
      for (i = 0; i < lines.length; i++) {
        l = lines[i]; n += 1;
        if (n > 30) { throw bad('too_big'); }
        q = parseInt(l.qty, 10); if (isNaN(q)) { q = 0; }
        if (q < 1 || q > 20) { throw bad('bad_qty'); }
        it = item(l.item_id); c = it && cat(it.category_id);
        if (!it || !it.active || !it.show_online || !it.available || !c || !c.active) { throw bad('item_unavailable'); }
        if (ds[it.id] && ds[it.id].out) { throw bad('item_unavailable'); }
        if (c.counted && num(it.stock, 0) < q) { throw bad('item_unavailable'); }
        ch = (l.chips || []).filter(function (k) { return ['no', 'add', 'swap', 'back'].indexOf(k.type) >= 0 && /^[0-9a-f-]{36}$/.test(k.ingredient_id || ''); }).slice(0, 12)
          .map(function (k) { return { type: k.type, ingredient_id: k.ingredient_id, with_id: k.with_id || null, diet: k.diet || null }; });
        var tg = it.togo_charge !== null && it.togo_charge !== undefined ? num(it.togo_charge) : num(c.togo_charge, 0);
        outl.push({ item_id: it.id, name: tx(it.name, 'en'), qty: q, unit_price: num(it.price), togo: type === 'togo' ? tg : 0,
          note: l.note ? String(l.note).trim().slice(0, 120) || null : null, station: c.station, chips: ch });
        sub += num(it.price) * q; if (type === 'togo') { togo += tg * q; }
      }
      if (!n) { throw bad('empty'); }
      return { lines: outl, sub: sub, togo: togo };
    }
    function totals(pr) {
      var s = S(), rate = num(s.tax_rate, 0), t, tax;
      if (s.prices_include_tax) { t = r2(pr.sub + pr.togo); tax = r2(t - t / (1 + rate)); }
      else { tax = r2((pr.sub + pr.togo) * rate); t = r2(pr.sub + pr.togo + tax); }
      return { total: t, tax: tax };
    }
    function addLines(oid, lines, mode) {
      var pmap = {}, par, add = mode === 'add';
      lines.forEach(function (x) {
        if ((x.station === 'bar' || x.station === 'kitchen') && !pmap[x.station]) {
          var pid = uuid(); par = null;
          if (add) { D.pieces.forEach(function (op) { if (!par && op.order_id === oid && op.station === x.station && op.kind === 'original') { par = op.id; } }); }
          D.pieces.push({ id: pid, order_id: oid, station: x.station, kind: add && par ? 'addon' : 'original', parent_id: add ? par : null, created_at: iso(Date.now()) });
          pmap[x.station] = pid;
        }
        D.oitems.push({ id: uuid(), order_id: oid, item_id: x.item_id, name: x.name, qty: x.qty, unit_price: x.unit_price, togo_charge: x.togo, note: x.note, station: x.station, chips: x.chips, piece_id: pmap[x.station] || null, stopped_at: null });
      });
    }

    /* ───────── the website: one read, one order, a status, an add-on ───────── */
    function siteCatalog(lang) {
      lang = lang || 'en';
      var ds = dishState(), s = S();
      return {
        gate: gate(), hours: s.hours, closed_note: s.closed_note, cutoff: s.online_cutoff, open_now: openAt(hnNow()), closed_until: s.closed_until,
        categories: D.categories.filter(function (c) { return c.active && D.items.some(function (i) { return i.category_id === c.id && i.active && i.show_online; }); }).sort(function (a, b) { return a.sort - b.sort; })
          .map(function (c) { return { id: c.id, name: tx(c.name, lang), en: c.name.en, station: c.station }; }),
        items: D.items.filter(function (i) { var c = cat(i.category_id); return i.active && i.show_online && c && c.active; }).sort(function (a, b) { return a.sort - b.sort; }).map(function (i) {
          var c = cat(i.category_id);
          return { id: i.id, category_id: i.category_id, name: tx(i.name, lang), en: i.name.en, description: tx(i.description, lang), price: i.price,
            togo: i.togo_charge !== null && i.togo_charge !== undefined ? i.togo_charge : num(c.togo_charge, 0), starred: i.starred,
            out: !i.available || !!(ds[i.id] && ds[i.id].out) || (c.counted && num(i.stock, 0) < 1),
            ing: D.dish_ingredients.filter(function (di) { return di.item_id === i.id; }).map(function (di) { return { di: di, g: ing(di.ingredient_id) }; }).filter(function (x) { return x.g && x.g.active; })
              .sort(function (a, b) { return (a.di.is_core === b.di.is_core ? 0 : a.di.is_core ? -1 : 1) || (a.g.name.en < b.g.name.en ? -1 : a.g.name.en > b.g.name.en ? 1 : 0); })
              .map(function (x) { return { id: x.g.id, name: tx(x.g.name, lang), icon: x.g.icon, core: x.di.is_core, out: x.g.light === 'red', meat: x.g.meat, dairy: x.g.dairy }; }) };
        }),
        diets: D.diets.slice().sort(function (a, b) { return a.sort - b.sort; }).map(function (d) { return { id: d.id, key: d.key, name: tx(d.name, lang), claim: tx(d.claim, lang) }; }),
        marks: D.diet_marks.map(function (m) { var d = by(D.diets, 'id', m.diet_id); return { diet: d && d.key, ing: m.ingredient_id, mark: m.mark }; }),
        swaps: D.swaps.slice().sort(function (a, b) { return a.sort - b.sort; }).map(function (x) { var d = by(D.diets, 'id', x.diet_id), a = ing(x.alternative_id); return { el: x.element_id, alt: x.alternative_id, diet: d ? d.key : null, def: x.is_default, name: tx(a.name, lang), icon: a.icon, ok: a.light === 'green' && a.active }; })
      };
    }
    function placeOnline(p) {
      var g = gate(), id = p.id, name, type, note, pr, t, bar = false, kit = false, n, num_, now = Date.now(), o;
      if (g) { throw bad(g); }
      if ((o = order(id))) { return { id: o.id, number: o.number, total: o.total }; }
      name = String(p.name || '').trim().slice(0, 40); if (!name) { throw bad('bad_details'); }
      type = p.order_type === 'togo' ? 'togo' : 'here';
      note = p.note ? String(p.note).trim().slice(0, 240) || null : null;
      if (D.orders.filter(function (x) { return x.source === 'online' && x.phase === 'open' && Date.parse(x.created_at) > now - 3 * 3600e3; }).length >= 15) { throw bad('too_many'); }
      pr = priceLines(p.lines, type); t = totals(pr);
      pr.lines.forEach(function (x) { if (x.station === 'bar') { bar = true; } else if (x.station === 'kitchen') { kit = true; } });
      n = D.orders.filter(function (x) { return x.source === 'online' && hnDate(new Date(Date.parse(x.created_at) - 6 * 3600e3)) === hnDate(hnNow()); }).length + 1;
      num_ = 'W' + n;
      D.orders.push({ id: id, device: 'web', number: num_, customer_name: name, note: note, order_type: type, source: 'online', status: 'open', subtotal: r2(pr.sub), togo_total: r2(pr.togo), tax: t.tax, tip: 0, total: t.total,
        created_at: iso(now), pickup_at: null, bar_done_at: bar ? null : iso(now), kitchen_done_at: kit ? null : iso(now), diets: p.diets || [], phase: 'open', stick_number: null, staff_name: null, paid_at: null, completed_at: null });
      addLines(id, pr.lines, 'new'); applyStock(id, -1);
      return { id: id, number: num_, total: t.total };
    }
    function orderStatus(id, lang) {
      var o = order(id); if (!o || o.source !== 'online') { return null; }
      lang = lang || 'en';
      return { name: o.customer_name, type: o.order_type, total: o.total, paid: o.status === 'paid',
        state: o.status === 'void' ? 'cancelled' : o.phase === 'done' ? 'picked_up' : 'making',
        can_add: o.phase === 'open' && o.status === 'open' && !gate(), gate: gate(),
        items: byId(D.oitems.filter(function (i) { return i.order_id === id; })).map(function (i) {
          var it = item(i.item_id);
          return { station: i.station, qty: i.qty, name: it ? (it.name[lang] || it.name.en || i.name) : i.name, stopped: !!i.stopped_at,
            chips: (i.chips || []).map(function (c) { var g = ing(c.ingredient_id), ww = ing(c.with_id); return { type: c.type, ing: g ? tx(g.name, lang) : null, icon: g ? g.icon : null, 'with': ww ? tx(ww.name, lang) : null, with_icon: ww ? ww.icon : null }; }) };
        }) };
    }
    function addToOnline(p) {
      var o = order(p.order_id), pr, t;
      if (!o || o.source !== 'online') { throw bad('not_found'); }
      if (o.phase !== 'open' || o.status !== 'open') { throw bad('locked'); }
      if (gate()) { throw bad(gate()); }
      pr = priceLines(p.lines, o.order_type); t = totals(pr);
      addLines(o.id, pr.lines, 'add');
      pr.lines.forEach(function (x) { if (x.station === 'bar') { o.bar_done_at = null; } if (x.station === 'kitchen') { o.kitchen_done_at = null; } });
      o.subtotal = r2(o.subtotal + pr.sub); o.togo_total = r2(o.togo_total + pr.togo); o.tax = r2(o.tax + t.tax); o.total = r2(o.total + t.total);
      pr.lines.forEach(function (x) { var i = item(x.item_id), c = i && cat(i.category_id); if (c && c.counted) { i.stock = num(i.stock, 0) - x.qty; } });
      return { ok: true, total: o.total };
    }

    /* ───────── the register: sync, pay, complete, undo, sticks, stop, cancel ───────── */
    function addPayment(oid, x) {
      if (by(D.payments, 'id', x.id)) { return false; }
      D.payments.push({ id: x.id, order_id: oid, method: x.method, amount: num(x.amount), tip: num(x.tip), usd_amount: x.usd_amount === undefined ? null : x.usd_amount, usd_rate: x.usd_rate === undefined ? null : x.usd_rate, card_ref: x.card_ref || null, created_at: x.created_at || iso(Date.now()) });
      return true;
    }
    function sync(p) {
      var o = p.order || {}, oid = o.id, stk = o.stick_number === null || o.stick_number === undefined || o.stick_number === '' ? null : parseInt(o.stick_number, 10), made = o.created_at || iso(Date.now());
      if (stk !== null) { stickRow(stk, true); }
      if (order(oid)) { return { ok: true, dup: true }; }
      D.orders.push({ id: oid, device: o.device, number: o.number, customer_name: o.customer_name || null, order_type: o.order_type || 'here', source: 'pos', status: o.status || 'paid',
        subtotal: num(o.subtotal), togo_total: num(o.togo_total), tax: num(o.tax), tip: num(o.tip), total: num(o.total), staff_name: o.staff_name || null, created_at: made, paid_at: o.paid_at || null,
        bar_done_at: o.has_bar ? null : made, kitchen_done_at: o.has_kitchen ? null : made, stick_number: stk, diets: o.diets || [], note: o.note || null, phase: 'open', completed_at: null, pickup_at: null });
      if (stk !== null) { var sr = stickRow(stk); if (sr.state === 'home') { sr.state = 'waiting'; } }
      (p.pieces || []).forEach(function (pc) {
        var kind = pc.kind || 'original', par = null;
        if (kind === 'addon') {
          D.pieces.slice().sort(function (a, b) { return Date.parse(a.created_at) - Date.parse(b.created_at); }).forEach(function (op) {
            var oo = order(op.order_id);
            if (!par && op.kind === 'original' && op.station === pc.station && oo && oo.stick_number === stk && stk !== null && oo.phase === 'open' && oo.id !== oid) { par = op.id; }
          });
          if (!par) { kind = 'original'; }
        }
        if (!by(D.pieces, 'id', pc.id)) { D.pieces.push({ id: pc.id, order_id: oid, station: pc.station, kind: kind, parent_id: par, created_at: made }); }
      });
      (p.items || []).forEach(function (i) {
        if (by(D.oitems, 'id', i.id)) { return; }
        D.oitems.push({ id: i.id, order_id: oid, item_id: i.item_id || null, name: i.name, qty: parseInt(i.qty, 10), unit_price: num(i.unit_price), togo_charge: num(i.togo_charge), note: i.note || null, station: i.station || 'kitchen', chips: i.chips || [], piece_id: i.piece_id || null, stopped_at: null });
      });
      applyStock(oid, -1);
      (p.payments || []).forEach(function (x) { addPayment(oid, x); });
      return { ok: true };
    }
    function payOrders(p) {
      var paid = 0;
      (p.payments || []).forEach(function (x) {
        var o = order(x.order_id); if (!o || o.status !== 'open') { return; }
        if (addPayment(o.id, x)) { o.status = 'paid'; o.paid_at = o.paid_at || x.created_at || iso(Date.now()); o.tip = num(o.tip) + num(x.tip); o.total = num(o.total) + num(x.tip); paid += 1; }
      });
      return { ok: true, paid: paid };
    }
    function homeIfFree(stks) {
      stks.forEach(function (n) { var s = stickRow(n); if (s && !D.orders.some(function (o) { return o.stick_number === n && o.phase === 'open'; })) { s.state = 'home'; s.table_id = null; } });
    }
    function complete(p, authed) {
      var ids = p.order_ids || [], at = p.at || iso(Date.now()), unpaid = D.orders.filter(function (o) { return ids.indexOf(o.id) >= 0 && o.phase === 'open' && o.status !== 'paid'; }).map(function (o) { return o.id; }), stks = [];
      if (unpaid.length) { return { ok: false, unpaid: unpaid }; }
      D.orders.forEach(function (o) {
        if (ids.indexOf(o.id) < 0) { return; }
        if (o.stick_number !== null && stks.indexOf(o.stick_number) < 0) { stks.push(o.stick_number); }
        if (o.phase === 'open') { o.phase = 'done'; o.completed_at = at; o.bar_done_at = o.bar_done_at || at; o.kitchen_done_at = o.kitchen_done_at || at; }
      });
      homeIfFree(stks);
      return { ok: true };
    }
    function undo(p) {
      var ids = p.order_ids || [], rs = p.restore || {}, stk = rs.stick === undefined || rs.stick === null || rs.stick === '' ? null : parseInt(rs.stick, 10), tid = rs.table_id || null;
      D.orders.forEach(function (o) {
        if (ids.indexOf(o.id) < 0 || o.phase !== 'done') { return; }
        o.phase = 'open'; o.completed_at = null;
        if (D.oitems.some(function (i) { return i.order_id === o.id && i.station === 'bar'; })) { o.bar_done_at = null; }
        if (D.oitems.some(function (i) { return i.order_id === o.id && i.station === 'kitchen'; })) { o.kitchen_done_at = null; }
      });
      if (stk !== null) { var s = stickRow(stk); if (s) { s.state = tid ? 'table' : 'waiting'; s.table_id = tid; } }
      return { ok: true };
    }
    function placeStick(p) {
      var stk = parseInt(p.stick, 10), tid = p.table_id || null;
      if (tid && D.sticks.some(function (s) { return s.table_id === tid && s.number !== stk; })) { return { ok: false, occupied: true }; }
      var s = stickRow(stk, true); s.state = tid ? 'table' : 'waiting'; s.table_id = tid;
      return { ok: true };
    }
    function alertRow(a) { a.created_at = iso(Date.now()); a.clears_at = iso(Date.now() + 60000); D.alerts.push(a); }
    function stopItem(p) {
      var i = by(D.oitems, 'id', p.order_item_id), kind = p.kind || 'stop';
      if (!i || !i.station || i.station === 'none') { return { ok: false }; }
      if (kind === 'stop' && !i.stopped_at) { i.stopped_at = iso(Date.now()); }
      if (!by(D.alerts, 'id', p.alert_id)) { alertRow({ id: p.alert_id, order_id: p.order_id, order_item_id: i.id, station: i.station, kind: kind, text: p.text || null, already_made: !!p.already_made }); }
      return { ok: true };
    }
    function cancel(p) {
      var o = order(p.order_id), at = p.at || iso(Date.now());
      if (!o) { return { ok: true }; }
      D.oitems.forEach(function (i) {
        if (i.order_id === o.id && (i.station === 'bar' || i.station === 'kitchen') && !i.stopped_at) { i.stopped_at = at; alertRow({ id: uuid(), order_id: o.id, order_item_id: i.id, station: i.station, kind: 'stop', text: null, already_made: false }); }
      });
      var wasVoid = o.status === 'void';
      o.status = 'void'; o.phase = 'done'; o.completed_at = at; o.bar_done_at = o.bar_done_at || at; o.kitchen_done_at = o.kitchen_done_at || at;
      if (!wasVoid) { applyStock(o.id, 1); }
      if (o.stick_number !== null) { homeIfFree([o.stick_number]); }
      return { ok: true };
    }

    /* ───────── the map and the phones ───────── */
    function itemsLabel(oid) {
      return D.oitems.filter(function (i) { return i.order_id === oid && !i.stopped_at; }).sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; }).map(function (i) { return i.qty + ' ' + i.name; }).join(' · ') || null;
    }
    function floorState() {
      var open = D.orders.filter(function (o) { return o.phase === 'open' && o.status !== 'void'; }).sort(function (a, b) { return Date.parse(a.created_at) - Date.parse(b.created_at); }).map(function (o) {
        return { id: o.id, number: o.number, name: o.customer_name, type: o.order_type, source: o.source, stick: o.stick_number, status: o.status, total: o.total, diets: o.diets, created_at: o.created_at, pickup_at: o.pickup_at,
          items: itemsLabel(o.id), lines: byId(D.oitems.filter(function (i) { return i.order_id === o.id; })).map(function (i) { return { id: i.id, qty: i.qty, name: i.name, station: i.station, stopped: !!i.stopped_at }; }) };
      });
      var cut = Date.now() - 40 * 60000;
      var done = D.orders.filter(function (o) { return o.phase === 'done' && o.status !== 'void' && Date.parse(o.completed_at) > cut; }).sort(function (a, b) { return Date.parse(b.completed_at) - Date.parse(a.completed_at); }).slice(0, 30).map(function (o) {
        var s = o.stick_number === null ? null : stickRow(o.stick_number);
        return { id: o.id, number: o.number, name: o.customer_name, type: o.order_type, stick: o.stick_number, total: o.total, completed_at: o.completed_at, created_at: o.created_at, table_id: s ? s.table_id : null };
      });
      var lights = {}; D.ingredients.forEach(function (g) { if (g.active) { lights[g.id] = g.light; } });
      return { now: iso(Date.now()),
        tables: D.tables.filter(function (t) { return t.active; }).sort(function (a, b) { return a.label < b.label ? -1 : a.label > b.label ? 1 : 0; }).map(function (t) { return { id: t.id, label: t.label, area: t.area, x: t.x, y: t.y, w: t.w, h: t.h, picnic: t.picnic }; }),
        sticks: D.sticks.slice().sort(function (a, b) { return a.number - b.number; }).map(function (s) { return { number: s.number, state: s.state, table_id: s.table_id }; }),
        open: open, done: done, lights: lights, dish_state: dishState() };
    }
    function ticketsBuild(station, lang) {
      var now = Date.now(), tickets, alerts;
      alerts = D.alerts.filter(function (a) { return a.station === station && Date.parse(a.clears_at) > now; }).sort(function (a, b) { return Date.parse(a.created_at) - Date.parse(b.created_at); }).map(function (a) {
        var o = order(a.order_id), i = by(D.oitems, 'id', a.order_item_id);
        return { id: a.id, kind: a.kind, text: a.text, made: a.already_made, stick: o ? o.stick_number : null, name: o ? o.customer_name : null, item: i ? i.name : null, clears_at: a.clears_at, created_at: a.created_at };
      });
      tickets = D.pieces.filter(function (op) {
        var o = order(op.order_id);
        return op.station === station && o && o.status !== 'void' && (o.phase === 'open' || Date.parse(o.completed_at) > now - 10 * 60000);
      }).sort(function (a, b) { return Date.parse(a.created_at) - Date.parse(b.created_at); }).map(function (op) {
        var o = order(op.order_id), par = op.parent_id ? by(D.pieces, 'id', op.parent_id) : null, parO = par ? order(par.order_id) : null;
        return { id: op.id, kind: op.kind, created_at: op.created_at, order_id: o.id, number: o.number, name: o.customer_name, type: o.order_type, source: o.source, stick: o.stick_number, diets: o.diets, note: o.note,
          parent_stick: parO ? parO.stick_number : null, addons_waiting: D.pieces.filter(function (x) { return x.parent_id === op.id; }).length,
          items: byId(D.oitems.filter(function (i) { return i.piece_id === op.id; })).map(function (i) {
            var it = item(i.item_id);
            return { id: i.id, qty: i.qty, name: it ? (it.name[lang] || it.name.en || i.name) : i.name, en: i.name, note: i.note, stopped: !!i.stopped_at,
              chips: (i.chips || []).map(function (ch) {
                var g = ing(ch.ingredient_id), ww = ing(ch.with_id), dt = ch.diet ? by(D.diets, 'key', ch.diet) : null;
                return { type: ch.type, ing: { name: g ? (g.name[lang] || g.name.en) : null, icon: g ? g.icon : null }, 'with': ww ? { name: ww.name[lang] || ww.name.en, icon: ww.icon } : null, diet: dt ? (dt.claim[lang] || dt.claim.en) : null };
              }) };
          }) };
      });
      return { now: iso(now), alerts: alerts, tickets: tickets };
    }
    /* what the phone is told: same words as push_card / push_alert_card in supabase/013 */
    function pushCard(oid, station, lang) {
      var o = order(oid), es = lang === 'es', addon, title, lines, body, items;
      if (!o) { return null; }
      addon = D.pieces.some(function (p) { return p.order_id === oid && p.station === station && p.kind === 'addon'; });
      title = o.stick_number !== null ? (es ? 'Palito ' : 'Stick ') + o.stick_number : (o.customer_name || o.number);
      title = (addon ? (es ? 'EXTRA · ' : 'ADD-ON · ') : '') + title + ' · ' + (o.source === 'online' ? (es ? 'En línea' : 'Online') + (o.order_type === 'togo' ? (es ? ' · Para llevar' : ' · To go') : '') : o.order_type === 'togo' ? (es ? 'Para llevar' : 'To go') : (es ? 'Aquí' : 'For here'));
      items = D.oitems.filter(function (i) { var op = by(D.pieces, 'id', i.piece_id); return i.order_id === oid && op && op.station === station && !i.stopped_at; }).sort(function (a, b) { return a.id < b.id ? -1 : 1; });
      lines = items.map(function (i) {
        var it = item(i.item_id), parts = (i.chips || []).map(function (ch) {
          var g = ing(ch.ingredient_id), ww = ing(ch.with_id), gn = g ? (g.name[lang] || g.name.en || '').toLowerCase() : '', wn = ww ? (ww.name[lang] || ww.name.en || '').toLowerCase() : '';
          return ch.type === 'no' ? (es ? 'sin ' : 'no ') + gn : ch.type === 'add' ? '+ ' + gn : ch.type === 'swap' ? gn + ' → ' + wn : gn;
        });
        return i.qty + '× ' + (it ? (it.name[lang] || it.name.en) : i.name) + (parts.length ? ' · ' + parts.join(' · ') : '');
      });
      if (!lines.length) { return null; }
      body = lines.join('\n'); if (o.note) { body += '\n' + o.note; }
      return { title: title, body: body, tag: oid + ':' + station, url: '/pos/tickets/#o=' + oid };
    }
    function alertCard(aid, lang) {
      var a = by(D.alerts, 'id', aid), o, i, it, nm, es = lang === 'es', who, msg;
      if (!a) { return null; }
      o = order(a.order_id); i = by(D.oitems, 'id', a.order_item_id); it = i && item(i.item_id); nm = i ? (it ? (it.name[lang] || it.name.en) : i.name) : '';
      who = o.stick_number !== null ? (es ? 'Palito ' : 'Stick ') + o.stick_number : (o.customer_name || o.number);
      msg = a.text || (a.kind === 'stop' ? (es ? 'Quítalo. Si ya está hecho, avisa en el mostrador.' : 'Take it off. If it is made, tell the counter.') : '');
      return { station: a.station, card: { title: (a.kind === 'stop' ? (es ? 'PARAR · ' : 'STOP · ') : (es ? 'CAMBIO · ' : 'CHANGED · ')) + who, body: (nm + '\n' + msg).replace(/^[\n ]+|[\n ]+$/g, ''), tag: 'alert:' + a.id, url: '/pos/tickets/' } };
    }

    /* ───────── the manager's day in review (look only) ───────── */
    function dayReview() {
      var today = hnDate(hnNow()), os = D.orders.filter(function (o) { return hnDate(new Date(Date.parse(o.created_at) - 6 * 3600e3)) === today && o.status !== 'void'; });
      function avgWait(list) {
        var d = list.filter(function (o) { return o.completed_at; }); if (!d.length) { return null; }
        return Math.round(d.reduce(function (a, o) { return a + (Date.parse(o.completed_at) - Date.parse(o.created_at)) / 60000; }, 0) / d.length);
      }
      function hasSt(o, st) { return D.oitems.some(function (i) { return i.order_id === o.id && i.station === st; }); }
      var buckets = {}, best = null, q = {}, loved;
      os.forEach(function (o) { var l = new Date(Date.parse(o.created_at) - 6 * 3600e3), b = Math.floor((l.getUTCHours() * 3600 + l.getUTCMinutes() * 60 + l.getUTCSeconds()) / 900); buckets[b] = (buckets[b] || 0) + 1; });
      Object.keys(buckets).forEach(function (b) { if (best === null || buckets[b] > buckets[best] || (buckets[b] === buckets[best] && Number(b) < Number(best))) { best = b; } });
      D.oitems.forEach(function (i) { if (os.some(function (o) { return o.id === i.order_id; })) { var it = item(i.item_id), k = i.item_id + '|' + (it ? it.name.en : i.name); q[k] = (q[k] || 0) + i.qty; } });
      loved = Object.keys(q).map(function (k) { return { item_id: k.split('|')[0] || null, name: k.slice(k.indexOf('|') + 1), qty: q[k] }; }).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 5);
      var seen = {}, low = D.ilog.filter(function (l) { return hnDate(new Date(Date.parse(l.at) - 6 * 3600e3)) === today && l.light !== 'green'; }).filter(function (l) { if (seen[l.ingredient_id]) { return false; } seen[l.ingredient_id] = 1; return true; }).map(function (l) {
        var g = ing(l.ingredient_id), t = new Date(Date.parse(l.at) - 6 * 3600e3), h = t.getUTCHours() % 12 || 12;
        return { ingredient_id: l.ingredient_id, name: g.name.en, icon: g.icon, light: l.light, at: h + ':' + ('0' + t.getUTCMinutes()).slice(-2) };
      });
      var bh = best === null ? null : (function () { var m = Number(best) * 15, h = Math.floor(m / 60) % 12 || 12; return h + ':' + ('0' + (m % 60)).slice(-2); }());
      return { day: today, sales: os.filter(function (o) { return o.status === 'paid'; }).reduce(function (a, o) { return a + num(o.total); }, 0), orders: os.length, online: os.filter(function (o) { return o.source === 'online'; }).length,
        avg_wait: avgWait(os), bar_wait: avgWait(os.filter(function (o) { return hasSt(o, 'bar'); })), kitchen_wait: avgWait(os.filter(function (o) { return hasSt(o, 'kitchen'); })), busiest: bh, buckets: buckets, loved: loved, low: low };
    }

    /* ───────── the rpc table ───────── */
    var RPC = {
      sign_in: function (a, au) { return signIn(a, au); },
      sign_out: function (a, au) { posOnly(au); var s = by(D.shifts, 'id', a.p_token); if (s && !s.out_at) { s.out_at = iso(Date.now()); } return null; },
      people_names: function (a, au) { posOnly(au); return D.people.filter(function (p) { return p.active && !p.hidden; }).sort(function (x, y) { return x.name < y.name ? -1 : 1; }).map(function (p) { return { id: p.id, name: p.name, role: p.role, station: p.station, language: p.language }; }); },
      my_settings: function (a, au) { posOnly(au); var p = need(a.p_token, 'staff'); if (a.p_language) { p.language = a.p_language; } if (a.p_tutorial_seen !== undefined && a.p_tutorial_seen !== null) { D.tut[p.id] = !!a.p_tutorial_seen; } return null; },
      floor_state: function (a, au) { posOnly(au); return floorState(); },
      tickets2_pos: function (a, au) { posOnly(au); var r = ticketsBuild(a.p_station, a.p_lang || 'en'); r.ok = true; return r; },
      tickets_phones: function (a, au) { posOnly(au); return []; },
      sync_order2: function (a, au) { posOnly(au); return sync(a.p); },
      pay_orders: function (a, au) { posOnly(au); return payOrders(a.p); },
      complete_number: function (a, au) { posOnly(au); return complete(a.p); },
      undo_complete: function (a, au) { posOnly(au); return undo(a.p); },
      place_stick: function (a, au) { posOnly(au); return placeStick(a.p); },
      stop_item: function (a, au) { posOnly(au); return stopItem(a.p); },
      cancel_order: function (a, au) { posOnly(au); return cancel(a.p); },
      set_light: function (a, au) {
        posOnly(au); need(a.p_token, 'staff');
        if (['green', 'amber', 'red'].indexOf(a.p_light) < 0) { throw bad('bad light'); }
        var g = ing(a.p_ingredient); if (g && g.light !== a.p_light) { D.ilog.push({ ingredient_id: g.id, light: a.p_light, at: iso(Date.now()) }); }
        if (g) { g.light = a.p_light; g.light_set_at = iso(Date.now()); }
        return null;
      },
      set_dish_out: function (a, au) { posOnly(au); need(a.p_token, 'staff'); var i = item(a.p_item); if (i) { i.available = !a.p_out; } return null; },
      day_review: function (a, au) { posOnly(au); need(a.p_token, 'manager'); return dayReview(); },
      site_catalog: function (a) { return siteCatalog(a.p_lang); },
      online_gate: function () { return gate(); },
      place_online_order2: function (a) { return placeOnline(a.p); },
      order_status2: function (a) { return orderStatus(a.p_id, a.p_lang); },
      add_to_online_order2: function (a) { return addToOnline(a.p); }
    };
    var VOIDS = ['sign_out', 'my_settings', 'set_light', 'set_dish_out'];

    /* ───────── plain table reads (the app's own menu loads) and the one write that is allowed: counting pastries ───────── */
    var TABLES = { categories: 'categories', items: 'items', settings: 'settings', fx_rates: 'fx', ingredients: 'ingredients', dish_ingredients: 'dish_ingredients', swaps: 'swaps', diets: 'diets', diet_marks: 'diet_marks', ticket_link: 'ticket_link', tables: 'tables', sticks: 'sticks' };
    function match(row, query) {
      return Object.keys(query).every(function (k) {
        if (['select', 'order', 'limit', 'offset'].indexOf(k) >= 0) { return true; }
        var m = /^(eq|neq|gt|gte|lt|lte|is|in)\.(.*)$/.exec(query[k]), v = row[k], s = v === null || v === undefined ? null : String(v), a;
        if (!m) { return true; }
        a = m[2];
        switch (m[1]) {
          case 'eq': return s === a;
          case 'neq': return s !== a;
          case 'is': return a === 'null' ? s === null : a === 'true' ? v === true : v === false;
          case 'in': return a.replace(/^\(|\)$/g, '').split(',').indexOf(s) >= 0;
          case 'gt': return v > (isNaN(Number(a)) ? a : Number(a));
          case 'gte': return v >= (isNaN(Number(a)) ? a : Number(a));
          case 'lt': return v < (isNaN(Number(a)) ? a : Number(a));
          default: return v <= (isNaN(Number(a)) ? a : Number(a));
        }
      });
    }
    function select(table, query) {
      var rows = D[TABLES[table]].filter(function (r) { return match(r, query); }), cols = (query.select || '*').split(',').map(function (c) { return c.trim(); });
      if (query.order) {
        var os = query.order.split(',').map(function (o) { var p = o.split('.'); return { k: p[0], d: p[1] === 'desc' ? -1 : 1 }; });
        rows = rows.slice().sort(function (a, b) { var i, x, y; for (i = 0; i < os.length; i++) { x = a[os[i].k]; y = b[os[i].k]; if (x < y) { return -os[i].d; } if (x > y) { return os[i].d; } } return 0; });
      }
      if (query.limit) { rows = rows.slice(0, parseInt(query.limit, 10)); }
      return clone(rows.map(function (r) { if (cols.indexOf('*') >= 0) { return r; } var o = {}; cols.forEach(function (c) { o[c] = r[c]; }); return o; }));
    }

    function fail(e) { var st = e.status || 400; return { status: st, json: { message: e.message, code: st === 403 ? '42501' : 'P0001' } }; }
    var E = {
      kind: 'sim',
      /* handle(method, path, query, body, authed) -> { status, json } */
      handle: function (method, path, query, body, authed) {
        var m;
        try {
          if ((m = /^\/rest\/v1\/rpc\/([a-z0-9_]+)$/.exec(path)) && method === 'POST') {
            if (!RPC[m[1]]) { return { status: 404, json: { message: 'no function ' + m[1], code: '42883' } }; }
            var out = RPC[m[1]](body || {}, authed); save();
            return VOIDS.indexOf(m[1]) >= 0 ? { status: 204, json: null } : { status: 200, json: out === undefined ? null : out };
          }
          if ((m = /^\/rest\/v1\/([a-z0-9_]+)$/.exec(path)) && TABLES[m[1]]) {
            if (method === 'GET') { return { status: 200, json: select(m[1], query || {}) }; }
            if (method === 'PATCH') {
              D[TABLES[m[1]]].filter(function (r) { return match(r, query || {}); }).forEach(function (r) { Object.keys(body || {}).forEach(function (k) { r[k] = body[k]; }); }); save();
              return { status: 204, json: null };
            }
          }
        } catch (e) { return fail(e); }
        return { status: 404, json: { message: 'not handled in play mode: ' + method + ' ' + path } };
      },
      pushCard: function (oid, station) { return Promise.resolve(pushCard(oid, station, 'en')); },
      alertCard: function (aid) { return Promise.resolve(alertCard(aid, 'en')); },

      /* the few questions the scenarios and the landing ask about the café (the real engine answers the same ones from SQL) */
      menu: function () { return Promise.resolve(D.items.filter(function (i) { return i.active; }).map(function (i) { var c = cat(i.category_id); return { id: i.id, n: i.name.en, price: i.price, station: c.station, counted: !!c.counted }; })); },
      tables: function () { return Promise.resolve(D.tables.slice().sort(function (a, b) { return a.label < b.label ? -1 : 1; }).map(function (t) { return { id: t.id, label: t.label }; })); },
      ingredientIds: function () { var o = {}; D.ingredients.forEach(function (g) { o[g.name.en] = g.id; }); return Promise.resolve(o); },
      personId: function (name) { var p = by(D.people, 'name', name); return Promise.resolve(p ? p.id : null); },
      orderTotal: function (id) { var o = order(id); return Promise.resolve(o ? num(o.total) : 0); },
      payments: function (id) { var l = D.payments.filter(function (x) { return x.order_id === id; }); return Promise.resolve({ c: l.length, s: l.reduce(function (a, x) { return a + num(x.amount); }, 0) }); },
      waiting: function () { return Promise.resolve(D.sticks.filter(function (s) { return s.state === 'waiting'; }).length); },
      setOnline: function (on) { S().online_orders = !!on; save(); return Promise.resolve(); },
      reset: function () { try { w.localStorage.removeItem(KEY); } catch (e) {} },
      flush: function () { if (persist) { try { w.localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} } }
    };
    return E;
  };
}(window));
