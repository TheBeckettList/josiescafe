/* Josie's POS — runs in any browser, including old iPads (iOS 9+).
   Plain ES5, no build step. Offline-first: the menu and staff are kept on the device,
   and every paid order is saved on the device first, then uploaded when there is internet. */
(function (w, d, JC) {
  'use strict';

  var APP_VERSION = '1.1.0';
  var app = d.getElementById('app');

  /* ───────────────────────── state ───────────────────────── */
  var S = {
    view: 'boot',
    session: JC.get('pos.session', null),            // {access_token, refresh_token, expires_at, email}
    device: JC.get('pos.device', null),              // {code:'A', mode:'register'|'kitchen'|'bar', lang:'en'|'es'}
    data: JC.get('pos.data', { categories: [], items: [], staff: [], settings: null, fx: [] }),
    staff: JC.get('pos.staff', null),                // {id, name, role}
    queue: JC.get('pos.queue', []),                  // orders waiting to upload
    orders: JC.get('pos.orders', []),                // this device's recent orders (for receipts)
    cart: JC.get('pos.cart', { name: '', lines: [] }),
    cat: null,
    pin: '', pinStaff: null, pinMsg: '',
    pay: null,
    last: null,                                      // last completed order (Done screen)
    online: false, syncing: false, syncErr: '',
    showTicket: false,
    manage: { tab: 'site', cat: null },
    station: { tickets: [], loaded: false, err: '' },
    web: { list: JC.get('pos.web', []), err: '' },   // online orders waiting to be picked up and paid
    report: null
  };

  function save(k) {
    var map = { session: 'pos.session', device: 'pos.device', data: 'pos.data', staff: 'pos.staff',
      queue: 'pos.queue', orders: 'pos.orders', cart: 'pos.cart' };
    JC.set(map[k], S[k]);
  }

  /* ───────────────────────── helpers ───────────────────────── */
  var esc = JC.esc, money = JC.money, r2 = JC.round2;
  function $(id) { return d.getElementById(id); }
  function dlang() { return (S.device && S.device.lang) || 'en'; }
  function nm(obj) { return JC.tr(obj, dlang()); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) { if (list[i].id === id) { return list[i]; } } return null; }
  function settings() { return S.data.settings || { tax_rate: 0.15, prices_include_tax: true, usd_fee: 1, hours: {} }; }
  function rate() { return JC.usdRate(settings(), S.data.fx); }
  function activeCats() {
    var out = [], i;
    for (i = 0; i < S.data.categories.length; i++) { if (S.data.categories[i].active) { out.push(S.data.categories[i]); } }
    out.sort(function (a, b) { return a.sort - b.sort; });
    return out;
  }
  function itemsIn(catId, includeInactive) {
    var out = [], i, it;
    for (i = 0; i < S.data.items.length; i++) {
      it = S.data.items[i];
      if (it.category_id === catId && (includeInactive || it.active)) { out.push(it); }
    }
    out.sort(function (a, b) { return a.sort - b.sort; });
    return out;
  }
  function togoFor(item) {
    if (item.togo_charge !== null && item.togo_charge !== undefined && item.togo_charge !== '') { return Number(item.togo_charge); }
    var c = byId(S.data.categories, item.category_id);
    return c ? Number(c.togo_charge || 0) : 0;
  }
  function stationFor(item) { var c = byId(S.data.categories, item.category_id); return c ? c.station : 'kitchen'; }
  function timeStr(iso) {
    var t = iso ? new Date(iso) : new Date();
    var h = t.getHours(), m = ('0' + t.getMinutes()).slice(-2), ap = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return h + ':' + m + ' ' + ap;
  }
  function closestAct(el) {
    while (el && el !== app && el !== d.body) {
      if (el.getAttribute && el.getAttribute('data-act')) { return el; }
      el = el.parentNode;
    }
    return null;
  }
  function icon(name) {
    var p = {
      wifiOff: '<path d="M2 8.8a15 15 0 0 1 20 0"/><path d="M5 12.6a10 10 0 0 1 14 0"/><path d="M8.5 16.3a5 5 0 0 1 7 0"/><path d="M3 3l18 18"/>',
      check: '<path d="M5 12l5 5L20 7"/>',
      back: '<path d="M15 18l-6-6 6-6"/>',
      x: '<path d="M6 6l12 12M18 6L6 18"/>',
      cup: '<path d="M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/>',
      bag: '<path d="M5 8h14l-1.5 12h-11z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
      up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
      sync: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>'
    }[name] || '';
    return '<svg class="ic" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  /* ───────────────────────── auth & API ───────────────────────── */
  function storeSession(r) {
    S.session = {
      access_token: r.access_token, refresh_token: r.refresh_token,
      expires_at: Date.now() + (Number(r.expires_in || 3600) - 60) * 1000,
      email: (r.user && r.user.email) || (S.session && S.session.email) || ''
    };
    save('session');
  }
  function withToken(cb) {
    if (!S.session) { cb('signed-out'); return; }
    if (Date.now() < S.session.expires_at) { cb(null, S.session.access_token); return; }
    JC.auth('token?grant_type=refresh_token', { refresh_token: S.session.refresh_token }, function (err, r, status) {
      if (err) {
        if (status === 400 || status === 401) { S.syncErr = 'Device sign-in expired. A manager needs to sign this device in again.'; }
        cb(err); return;
      }
      storeSession(r);
      cb(null, S.session.access_token);
    });
  }
  function api(method, path, body, cb, headers) {
    withToken(function (e, tok) {
      if (e) { cb(e); return; }
      JC.rest(method, path, body, tok, function (err, data, status) {
        S.online = status > 0;
        cb(err, data, status);
      }, headers);
    });
  }

  /* ───────────────────────── data ───────────────────────── */
  function loadData(cb) {
    var parts = {
      categories: 'categories?select=*&order=sort.asc',
      items: 'items?select=*&order=sort.asc',
      staff: 'staff?select=id,name,pin,role,active&order=name.asc',
      settings: 'settings?select=*',
      fx: 'fx_rates?select=day,bank_buy,bank_sell&order=day.desc&limit=10'
    };
    var keys = ['categories', 'items', 'staff', 'settings', 'fx'], pending = keys.length, fresh = {}, failed = false;
    keys.forEach(function (k) {
      api('GET', parts[k], null, function (err, data) {
        if (err) { failed = true; } else { fresh[k] = k === 'settings' ? (data && data[0]) : data; }
        pending -= 1;
        if (pending) { return; }
        if (!failed) {
          S.data = fresh;
          save('data');
          if (S.cat && !byId(S.data.categories, S.cat)) { S.cat = null; }
        }
        if (cb) { cb(failed); }
      });
    });
  }

  /* ───────────────────────── sync loop ───────────────────────── */
  function syncNext() {
    if (S.syncing || !S.queue.length || !S.session) { return; }
    S.syncing = true;
    var job = S.queue[0];
    api('POST', job.kind === 'online' ? 'rpc/pay_online_order' : 'rpc/sync_order', { p: job }, function (err, data, status) {
      S.syncing = false;
      if (!err) {
        S.queue.shift(); save('queue');
        markSynced(job.order.id);
        S.syncErr = '';
        paintStatus();
        syncNext();
        return;
      }
      if (status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429) {
        // The server refused this order's data: move it to the back so others still upload.
        job.failures = (job.failures || 0) + 1;
        S.syncErr = 'An order could not upload (' + status + '). It is kept on this device.';
        if (S.queue.length > 1) { S.queue.push(S.queue.shift()); }
        save('queue');
      }
      paintStatus();
    });
  }
  function markSynced(id) {
    for (var i = 0; i < S.orders.length; i++) { if (S.orders[i].order.id === id) { S.orders[i].synced = true; } }
    save('orders');
  }
  function ping() {
    // Cheap check whether Supabase is reachable.
    JC.rest('GET', 'settings?select=id', null, null, function (err, data, status) {
      var was = S.online;
      S.online = status > 0;
      if (S.online !== was) { paintStatus(); }
      if (S.online) { syncNext(); }
    });
  }

  /* ───────────────────────── online orders (josiescafe.com/order) ───────────────────────── */
  function webPoll() {
    if (!S.session || !S.device || S.device.mode !== 'register') { return; }
    api('GET', 'orders?select=id,number,customer_name,customer_phone,note,order_type,total,togo_total,pickup_at,created_at,bar_done_at,kitchen_done_at,' +
      'order_items(item_id,name,qty,unit_price,togo_charge,note,station)&source=eq.online&status=eq.open&order=pickup_at.asc', null, function (err, data) {
      if (err) { S.web.err = S.online ? 'Couldn’t load online orders.' : 'Offline · showing the last online orders.'; }
      else {
        var paying = {}, i;
        for (i = 0; i < S.queue.length; i++) { if (S.queue[i].kind === 'online') { paying[S.queue[i].order.id] = true; } }
        S.web.err = ''; S.web.list = (data || []).filter(function (o) { return !paying[o.id]; }); save('web');
      }
      if (S.view === 'web' || (S.view === 'register' && !S.showTicket)) { render(); }
    });
  }
  function webCount() { return S.web.list.length; }
  function vWeb() {
    var h = header('Online orders', 'back') + '<div class="list-wrap"><p class="muted">Ordered on josiescafe.com. They pay here when they pick up. ' +
      'Tickets show on the kitchen and bar screens 20 minutes before pick-up.</p>';
    if (S.web.err) { h += '<p class="msg">' + esc(S.web.err) + '</p>'; }
    if (!S.web.list.length) { h += '<div class="card"><p class="muted">No online orders waiting.</p></div>'; }
    S.web.list.forEach(function (o) {
      var ready = o.bar_done_at && o.kitchen_done_at, pick = new Date(o.pickup_at), today = JC.today(),
        pd = pick.getFullYear() + '-' + ('0' + (pick.getMonth() + 1)).slice(-2) + '-' + ('0' + pick.getDate()).slice(-2);
      h += '<div class="card web' + (ready ? ' ready' : '') + '"><div class="row"><b class="num">' + esc(o.number) + '</b><span class="grow"><b>' + esc(o.customer_name || '') + '</b>' +
        '<small>Pick up ' + (pd === today ? '' : pd + ' ') + timeStr(o.pickup_at) + ' · ' + (o.order_type === 'togo' ? 'To go' : 'For here') + ' · ' + esc(o.customer_phone || '') + '</small></span>' +
        '<span class="pill ' + (ready ? 'ok' : 'warn') + '">' + (ready ? 'Ready' : 'Not ready') + '</span><span class="amt">' + money(o.total) + '</span></div><ul class="wl">';
      (o.order_items || []).forEach(function (i) { h += '<li>' + i.qty + ' × ' + esc(i.name) + (i.note ? ' <em>' + esc(i.note) + '</em>' : '') + '</li>'; });
      h += '</ul>' + (o.note ? '<p class="wnote">“' + esc(o.note) + '”</p>' : '') + '<div class="row">' +
        '<button class="btn primary" data-act="webpay" data-arg="' + o.id + '">Take payment</button><span class="grow"></span>' +
        (S.staff && S.staff.role === 'manager' ? '<button class="btn soft" data-act="webvoid" data-arg="' + o.id + '">Cancel order</button>' : '') + '</div></div>';
    });
    return h + '</div>';
  }
  function webPay(id) {
    var o = byId(S.web.list, id);
    if (!o) { return; }
    if (S.cart.lines.length && !w.confirm('Replace the order on the register with ' + o.number + '?')) { return; }
    S.cart = { name: o.customer_name || '', online: { id: o.id, number: o.number }, lines: (o.order_items || []).map(function (i) {
      var it = i.item_id ? byId(S.data.items, i.item_id) : null;
      return { key: JC.uuid(), item_id: i.item_id, label: it ? nm(it.name) : i.name, name: i.name, price: Number(i.unit_price),
        togo: it ? togoFor(it) : Number(i.togo_charge || 0), station: i.station, qty: i.qty, note: i.note || '' };
    }) };
    save('cart');
    startPay();
    S.pay.type = o.order_type; S.pay.step = 'method';
    render();
  }
  function webVoid(id) {
    if (!w.confirm('Cancel this online order? The customer sees that it was cancelled.')) { return; }
    api('PATCH', 'orders?id=eq.' + id, { status: 'void', bar_done_at: new Date().toISOString(), kitchen_done_at: new Date().toISOString() }, function (err) {
      if (err) { w.alert(S.online ? 'Couldn’t cancel. Try again.' : 'Cancelling needs internet.'); return; }
      S.web.list = S.web.list.filter(function (o) { return o.id !== id; }); save('web'); render();
    }, { Prefer: 'return=minimal' });
  }

  /* ───────────────────────── money math ───────────────────────── */
  function totals(cart, type, tip) {
    var st = settings(), sub = 0, togo = 0, i, l, tax, total;
    for (i = 0; i < cart.lines.length; i++) {
      l = cart.lines[i];
      sub += l.price * l.qty;
      if (type === 'togo') { togo += l.togo * l.qty; }
    }
    sub = r2(sub); togo = r2(togo);
    var rateT = Number(st.tax_rate || 0);
    if (st.prices_include_tax) {
      total = r2(sub + togo);
      tax = r2(total - total / (1 + rateT));
    } else {
      tax = r2((sub + togo) * rateT);
      total = r2(sub + togo + tax);
    }
    return { sub: sub, togo: togo, tax: tax, total: total, tip: r2(tip || 0), grand: r2(total + (tip || 0)) };
  }
  function cartCount() { var n = 0, i; for (i = 0; i < S.cart.lines.length; i++) { n += S.cart.lines[i].qty; } return n; }

  function nextNumber() {
    var seq = JC.get('pos.seq', { day: '', n: 0 }), today = JC.today();
    if (seq.day !== today) { seq = { day: today, n: 0 }; }
    seq.n += 1;
    JC.set('pos.seq', seq);
    return (S.device.code || 'A') + seq.n;
  }

  /* ───────────────────────── rendering ───────────────────────── */
  function statusPill() {
    var q = S.queue.length;
    if (!S.online) {
      return '<span class="pill warn">' + icon('wifiOff') + 'Offline' + (q ? ' · ' + q + ' to sync' : '') + '</span>';
    }
    if (q) { return '<span class="pill warn">' + icon('sync') + q + ' to sync</span>'; }
    return '<span class="pill ok">' + icon('check') + 'Online</span>';
  }
  function paintStatus() {
    var el = $('status');
    if (el) { el.innerHTML = statusPill() + (S.syncErr ? '<span class="pill err" data-act="syncinfo">!</span>' : ''); }
  }
  function header(title, back) {
    return '<header class="bar">' +
      (back ? '<button class="btn ghost" data-act="' + back + '">' + icon('back') + '<span>Back</span></button>' :
        '<img class="logo" src="../img/logo.png" alt="Josie\'s" width="36" height="42"><span class="brand">Josie\'s</span>') +
      (title ? '<span class="title">' + esc(title) + '</span>' : '') +
      '<span class="grow"></span><span id="status">' + statusPill() + '</span>' +
      (S.staff ? '<button class="btn ghost who" data-act="menu">' + esc(S.staff.name) + '</button>' : '') +
      '</header>';
  }

  function render() {
    var v = S.view, h = '';
    d.documentElement.className = 'v-' + v;
    if (v === 'boot') { h = '<div class="center"><p>Loading…</p></div>'; }
    else if (v === 'setup') { h = vSetup(); }
    else if (v === 'login') { h = vLogin(); }
    else if (v === 'register') { h = vRegister(); }
    else if (v === 'pay') { h = vPay(); }
    else if (v === 'done') { h = vDone(); }
    else if (v === 'orders') { h = vOrders(); }
    else if (v === 'web') { h = vWeb(); }
    else if (v === 'station') { h = vStation(); }
    else if (v === 'manage') { h = vManage(); }
    else if (v === 'menu') { h = vMenuSheet(); }
    app.innerHTML = h;
  }

  /* ── first-time device setup ── */
  function vSetup() {
    var dev = S.device || { code: 'A', mode: 'register', lang: 'en' };
    return '<div class="center setup"><img src="../img/logo.png" alt="" width="120" height="140">' +
      '<h1>Set up this device</h1>' +
      '<p class="muted">A manager does this once per tablet. It stays signed in, even offline.</p>' +
      '<form id="setupForm" class="card form" autocomplete="on">' +
      '<label>Device email<input id="su_email" type="email" autocapitalize="off" autocorrect="off" value="' + esc((S.session && S.session.email) || 'pos@josiescafe.com') + '"></label>' +
      '<label>Password<input id="su_pass" type="password"></label>' +
      '<div class="row2"><label>Device letter<select id="su_code">' + ['A', 'B', 'C', 'D', 'E', 'F'].map(function (c) {
        return '<option' + (dev.code === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label>' +
      '<label>This device is<select id="su_mode">' +
      opt('register', 'Register (take orders)', dev.mode) + opt('kitchen', 'Kitchen screen', dev.mode) + opt('bar', 'Bar screen', dev.mode) +
      '</select></label></div>' +
      '<label>Item names in<select id="su_lang">' + opt('en', 'English', dev.lang) + opt('es', 'Español', dev.lang) + '</select></label>' +
      '<p id="su_msg" class="msg"></p>' +
      '<button class="btn primary big" type="submit">Sign in device</button></form></div>';
  }
  function opt(v, label, cur) { return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>'; }

  function doSetup() {
    var email = $('su_email').value.replace(/^\s+|\s+$/g, ''), pass = $('su_pass').value;
    S.device = { code: $('su_code').value, mode: $('su_mode').value, lang: $('su_lang').value };
    save('device');
    $('su_msg').innerHTML = 'Signing in…';
    JC.auth('token?grant_type=password', { email: email, password: pass }, function (err, r, status) {
      if (err) {
        $('su_msg').innerHTML = status === 0 ? 'No internet. Device sign-in needs internet once.' : 'That email and password didn’t work.';
        return;
      }
      storeSession(r);
      S.syncErr = '';
      $('su_msg').innerHTML = 'Loading menu…';
      loadData(function (failed) {
        if (failed) { $('su_msg').innerHTML = 'Signed in, but this email isn’t allowed into the POS. Ask Richard to add it.'; return; }
        go(S.device.mode === 'register' ? 'login' : 'station');
      });
    });
  }

  /* ── staff PIN login ── */
  function vLogin() {
    var staff = S.data.staff.filter(function (s) { return s.active; }), dots = '', i;
    for (i = 0; i < 4; i++) { dots += '<span class="pdot' + (i < S.pin.length ? ' on' : '') + '"></span>'; }
    return '<div class="login">' +
      '<div class="who-col"><img src="../img/logo.png" alt="Josie\'s Cafe" width="150" height="175"><h1>Who’s working?</h1>' +
      '<div class="staff-grid">' + staff.map(function (s) {
        return '<button class="staff' + (S.pinStaff === s.id ? ' sel' : '') + '" data-act="pickstaff" data-arg="' + s.id + '">' +
          '<span class="av">' + esc(s.name.charAt(0).toUpperCase()) + '</span><span>' + esc(s.name) + '</span></button>';
      }).join('') + (staff.length ? '' : '<p class="muted">No staff yet. A manager adds staff in the Supabase table or in Manage.</p>') + '</div></div>' +
      '<div class="pad-col card"><p class="pinlabel">' + esc(S.pinStaff ? 'Enter PIN for ' + (byId(S.data.staff, S.pinStaff) || {}).name : 'Pick your name') + '</p>' +
      '<div class="dots">' + dots + '</div><p class="msg">' + esc(S.pinMsg) + '</p>' +
      '<div class="pad">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '<'].map(function (k) {
        return '<button class="key' + (k === 'C' || k === '<' ? ' soft' : '') + '" data-act="pin" data-arg="' + k + '">' + (k === '<' ? '⌫' : k === 'C' ? 'Clear' : k) + '</button>';
      }).join('') + '</div><p class="muted tiny">' + statusPill() + ' · v' + APP_VERSION + ' · device ' + esc(S.device.code) + '</p></div></div>';
  }
  function pinKey(k) {
    if (!S.pinStaff) { S.pinMsg = 'Pick your name first'; render(); return; }
    if (k === 'C') { S.pin = ''; } else if (k === '<') { S.pin = S.pin.slice(0, -1); } else if (S.pin.length < 4) { S.pin += k; }
    S.pinMsg = '';
    if (S.pin.length === 4) {
      var s = byId(S.data.staff, S.pinStaff);
      if (s && s.pin === S.pin) {
        S.staff = { id: s.id, name: s.name, role: s.role }; save('staff');
        S.pin = ''; S.pinStaff = null;
        go('register'); return;
      }
      S.pin = ''; S.pinMsg = 'Wrong PIN';
    }
    render();
  }

  /* ── register ── */
  function vRegister() {
    var cats = activeCats(), i, c, items, html;
    if (!S.cat && cats.length) { S.cat = cats[0].id; }
    c = byId(S.data.categories, S.cat);
    items = c ? itemsIn(c.id) : [];
    html = header('', null) + '<div class="reg' + (S.showTicket ? ' show-ticket' : '') + '">' +
      '<nav class="rail">' + cats.map(function (k) {
        return '<button class="cat' + (k.id === S.cat ? ' on' : '') + '" data-act="cat" data-arg="' + k.id + '"><span class="sw" style="background:' + esc(k.color) + '"></span>' + esc(nm(k.name)) + '</button>';
      }).join('') + '<span class="grow"></span><button class="cat soft' + (webCount() ? ' webon' : '') + '" data-act="web">Online orders' + (webCount() ? ' · ' + webCount() : '') + '</button>' +
      '<button class="cat soft" data-act="orders">Recent orders</button></nav>' +
      '<main class="items"><h1>' + esc(c ? nm(c.name) : 'No menu yet') + '</h1><div class="grid">';
    for (i = 0; i < items.length; i++) {
      var it = items[i], cnt = 0, j;
      for (j = 0; j < S.cart.lines.length; j++) { if (S.cart.lines[j].item_id === it.id) { cnt += S.cart.lines[j].qty; } }
      html += '<button class="tile' + (it.available ? '' : ' out') + (cnt ? ' in' : '') + '" data-act="add" data-arg="' + it.id + '"' +
        (it.available ? '' : ' disabled') + ' style="border-top-color:' + esc(c.color) + '">' +
        '<span class="tn">' + esc(nm(it.name)) + '</span>' + (cnt ? '<span class="badge">' + cnt + '</span>' : '') +
        '<span class="tp">' + (it.available ? money(it.price) : 'Sold out') + '</span></button>';
    }
    if (!items.length) { html += '<p class="muted">Nothing here yet. Add items in Manage › Menu.</p>'; }
    html += '</div></main>' + vTicket() + '</div>' +
      '<button class="ticket-toggle" data-act="ticket">Order (' + cartCount() + ') · ' + money(totals(S.cart, 'here').total) + '</button>';
    return html;
  }
  function vTicket() {
    var t = totals(S.cart, 'here'), lines = S.cart.lines, i, l, h;
    h = '<aside class="ticket"><div class="tk-head"><input id="cust" class="cust" placeholder="Customer name" value="' + esc(S.cart.name) + '" autocomplete="off">' +
      '<button class="btn ghost close-ticket" data-act="ticket">' + icon('x') + '</button></div><div class="lines">';
    if (S.cart.online) { h += '<p class="webtag">Online order ' + esc(S.cart.online.number) + ' · paid as ordered</p>'; }
    for (i = 0; i < lines.length; i++) {
      l = lines[i];
      if (S.cart.online) {
        h += '<div class="line"><span class="ln"><b>' + esc(l.label) + '</b>' + (l.note ? '<em>' + esc(l.note) + '</em>' : '') + '</span><span class="q">' + l.qty + '</span><span class="lt">' + money(l.price * l.qty) + '</span></div>';
        continue;
      }
      h += '<div class="line"><button class="ln" data-act="note" data-arg="' + i + '"><b>' + esc(l.label) + '</b>' +
        (l.note ? '<em>' + esc(l.note) + '</em>' : '<small>tap to add a note</small>') + '</button>' +
        '<button class="qb" data-act="dec" data-arg="' + i + '" aria-label="Remove one">−</button><span class="q">' + l.qty + '</span>' +
        '<button class="qb" data-act="inc" data-arg="' + i + '" aria-label="Add one">+</button><span class="lt">' + money(l.price * l.qty) + '</span></div>';
    }
    if (!lines.length) { h += '<p class="muted empty">Tap an item to start</p>'; }
    h += '</div><div class="tk-foot"><div class="tot"><span>Total</span><b>' + money(t.total) + '</b></div>' +
      '<div class="row"><button class="btn soft" data-act="clear">Clear</button>' +
      '<button class="btn primary big grow" data-act="pay"' + (lines.length ? '' : ' disabled') + '>Pay</button></div></div></aside>';
    return h;
  }
  function addItem(id) {
    var it = byId(S.data.items, id), i, l;
    if (!it || !it.available) { return; }
    if (S.cart.online) { w.alert('Finish or clear online order ' + S.cart.online.number + ' first.'); return; }
    for (i = 0; i < S.cart.lines.length; i++) {
      l = S.cart.lines[i];
      if (l.item_id === id && !l.note) { l.qty += 1; save('cart'); render(); return; }
    }
    S.cart.lines.push({ key: JC.uuid(), item_id: it.id, label: nm(it.name), name: JC.tr(it.name, 'en'),
      price: Number(it.price), togo: togoFor(it), station: stationFor(it), qty: 1, note: '' });
    save('cart'); render();
  }

  /* ── pay ── */
  function startPay() {
    if (!S.cart.lines.length) { return; }
    var n = $('cust'); if (n) { S.cart.name = n.value; save('cart'); }
    S.pay = { step: 'type', type: null, method: 'cash_hnl', tip: 0, tipMode: 0, given: null, ref: '' };
    go('pay');
  }
  function vPay() {
    var p = S.pay, t, h, hereT, goT;
    if (p.step === 'type') {
      hereT = totals(S.cart, 'here'); goT = totals(S.cart, 'togo');
      return header('Pay' + (S.cart.name ? ' · ' + S.cart.name : ''), 'back') + '<div class="center"><h1>For here or to go?</h1><div class="choice">' +
        '<button class="bigchoice" data-act="ptype" data-arg="here">' + icon('cup') + '<b>For here</b><span>' + money(hereT.total) + '</span></button>' +
        '<button class="bigchoice" data-act="ptype" data-arg="togo">' + icon('bag') + '<b>To go</b><small>+ ' + money(goT.togo) + ' to-go charges</small><span>' + money(goT.total) + '</span></button>' +
        '</div></div>';
    }
    var cardTip = p.method === 'card' ? tipAmount() : 0;
    t = totals(S.cart, p.type, cardTip);
    h = header('Pay' + (S.cart.name ? ' · ' + S.cart.name : ''), 'back') + '<div class="pay"><section class="card bill">' +
      '<div class="seg">' + segBtn('ptype2', 'here', 'For here', p.type) + segBtn('ptype2', 'togo', 'To go', p.type) + '</div><div class="bl">';
    S.cart.lines.forEach(function (l) { h += '<div class="r"><span>' + l.qty + ' × ' + esc(l.label) + '</span><span>' + money(l.price * l.qty) + '</span></div>'; });
    if (t.togo) { h += '<div class="r accent"><span>To-go charges</span><span>' + money(t.togo) + '</span></div>'; }
    if (!settings().prices_include_tax) { h += '<div class="r muted"><span>ISV</span><span>' + money(t.tax) + '</span></div>'; }
    if (t.tip) { h += '<div class="r accent"><span>Card tip</span><span>' + money(t.tip) + '</span></div>'; }
    h += '</div><div class="tot big"><span>Total</span><b>' + money(t.grand) + '</b></div>' +
      (settings().prices_include_tax ? '<p class="muted tiny right">incl. ISV ' + money(t.tax) + '</p>' : '') + '</section>' +
      '<section class="pay-r"><div class="methods">' + methBtn('cash_hnl', 'Cash · L') + methBtn('cash_usd', 'Cash · $') + methBtn('card', 'Card') + '</div>';
    if (p.method === 'cash_hnl') { h += cashPanel(t, false); }
    else if (p.method === 'cash_usd') { h += cashPanel(t, true); }
    else { h += cardPanel(t); }
    h += '<span class="grow"></span><button class="btn primary big" data-act="complete"' + (canComplete(t) ? '' : ' disabled') + '>Complete order</button></section></div>';
    return h;
  }
  function segBtn(act, v, label, cur) { return '<button class="' + (v === cur ? 'on' : '') + '" data-act="' + act + '" data-arg="' + v + '">' + label + '</button>'; }
  function methBtn(v, label) { return '<button class="meth' + (S.pay.method === v ? ' on' : '') + '" data-act="method" data-arg="' + v + '">' + label + '</button>'; }
  function tipAmount() {
    var p = S.pay, base = totals(S.cart, p.type).total;
    if (p.tipMode === 4) { return r2(p.tip); }
    return r2(Math.round(base * [0, 0.10, 0.15, 0.20][p.tipMode || 0]));
  }
  function cashPanel(t, usd) {
    var p = S.pay, rt = rate(), due, opts, given, change, h;
    if (usd && !rt) { return '<div class="card"><p>No dollar rate yet. Set one in Manage › Money.</p></div>'; }
    due = usd ? Math.ceil(t.total / rt * 100) / 100 : t.total;
    if (usd) { opts = [due, 5, 10, 20, 50, 100].filter(function (v, i) { return i === 0 || v >= due; }).slice(0, 5); }
    else {
      var a = Math.ceil(t.total / 50) * 50, b = Math.ceil(t.total / 100) * 100, c2 = Math.ceil(t.total / 500) * 500;
      opts = [t.total, a, b, c2, 1000].filter(function (v, i, arr) { return (i === 0 || v > t.total) && arr.indexOf(v) === i; }).slice(0, 5);
    }
    given = p.given === null ? null : Number(p.given);
    change = given === null ? null : r2((usd ? given * rt : given) - t.total);
    h = '<div class="card">' + (usd ? '<div class="usd"><span>Due in dollars <small>L ' + rt.toFixed(2) + ' per $1</small></span><b>' + money(due, '$') + '</b></div>' : '') +
      '<p class="lbl">Cash given</p><div class="chips">' + opts.map(function (v, i) {
        return '<button class="chip' + (given === v ? ' on' : '') + '" data-act="given" data-arg="' + v + '">' + (i === 0 ? 'Exact' : money(v, usd ? '$' : 'L ')) + '</button>';
      }).join('') + '</div><label class="other">Other amount (' + (usd ? '$' : 'L') + ')<input id="givenIn" type="number" inputmode="decimal" step="0.01" value="' + (given !== null && opts.indexOf(given) < 0 ? given : '') + '"></label>' +
      '<div class="change' + (change !== null && change < 0 ? ' short' : '') + '"><span>' + (change !== null && change < 0 ? 'Still owed' : 'Change in L') + '</span><b id="changeOut">' +
      (change === null ? '—' : money(Math.abs(change))) + '</b></div><p class="muted tiny">Cash tips go in the jar.</p></div>';
    return h;
  }
  function cardPanel(t) {
    var p = S.pay, base = totals(S.cart, p.type).total;
    return '<div class="card"><p class="lbl">Tip</p><div class="chips">' + ['None', '10%', '15%', '20%', 'Other'].map(function (l, i) {
      var amt = i === 4 ? (p.tipMode === 4 ? money(p.tip) : 'type') : money(Math.round(base * [0, 0.10, 0.15, 0.20][i]));
      return '<button class="chip tip' + (p.tipMode === i ? ' on' : '') + '" data-act="tip" data-arg="' + i + '"><b>' + l + '</b><small>' + amt + '</small></button>';
    }).join('') + '</div></div><div class="card keyin"><p class="lbl">Key this into the Verifone</p><b class="huge">' + money(t.grand) + '</b>' +
      '<label class="other">Approval code from the slip (optional)<input id="cardRef" type="text" inputmode="numeric" value="' + esc(p.ref) + '"></label></div>';
  }
  function canComplete(t) {
    var p = S.pay;
    if (p.method === 'card') { return true; }
    if (p.given === null) { return false; }
    var rt = rate(), val = p.method === 'cash_usd' ? Number(p.given) * (rt || 0) : Number(p.given);
    return val + 0.009 >= t.total;
  }
  function complete() {
    var p = S.pay, refEl = $('cardRef');
    if (refEl) { p.ref = refEl.value; }
    var tip = p.method === 'card' ? tipAmount() : 0, t = totals(S.cart, p.type, tip);
    if (!canComplete(t)) { return; }
    var now = new Date().toISOString(), id = JC.uuid(), rt = rate(), hasBar = false, hasKitchen = false, items = [], given, change;
    S.cart.lines.forEach(function (l) {
      if (l.station === 'bar') { hasBar = true; }
      if (l.station === 'kitchen') { hasKitchen = true; }
      items.push({ id: JC.uuid(), item_id: l.item_id, name: l.name, qty: l.qty, unit_price: l.price,
        togo_charge: p.type === 'togo' ? l.togo : 0, note: l.note, station: l.station });
    });
    given = p.method === 'card' ? t.grand : (p.method === 'cash_usd' ? r2(Number(p.given) * rt) : Number(p.given));
    change = p.method === 'card' ? 0 : r2(given - t.total);
    var web = S.cart.online || null;
    if (web) { id = web.id; hasBar = false; hasKitchen = false; }
    var job = {
      kind: web ? 'online' : 'pos',
      order: { id: id, device: S.device.code, number: web ? web.number : nextNumber(), customer_name: S.cart.name || null, order_type: p.type,
        status: 'paid', subtotal: t.sub, togo_total: t.togo, tax: t.tax, tip: t.tip, total: t.grand,
        staff_name: S.staff ? S.staff.name : null, created_at: now, paid_at: now, has_bar: hasBar, has_kitchen: hasKitchen },
      items: items,
      payments: [{ id: JC.uuid(), method: p.method, amount: t.grand, tip: t.tip,
        usd_amount: p.method === 'cash_usd' ? Number(p.given) : null, usd_rate: p.method === 'cash_usd' ? rt : null,
        card_ref: p.ref || null, created_at: now }]
    };
    S.queue.push(job); save('queue');
    if (web) { S.web.list = S.web.list.filter(function (o) { return o.id !== web.id; }); save('web'); }
    S.orders.unshift({ order: job.order, items: items, payments: job.payments, lines: S.cart.lines.slice(), change: change, synced: false });
    if (S.orders.length > 150) { S.orders.length = 150; }
    save('orders');
    S.last = S.orders[0];
    S.cart = { name: '', lines: [] }; save('cart');
    S.pay = null; S.showTicket = false;
    go('done');
    syncNext();
  }

  /* ── done ── */
  function vDone() {
    var o = S.last, h;
    if (!o) { S.view = 'register'; return vRegister(); }
    h = '<div class="center done"><div class="tick">' + icon('check') + '</div><h1>Order ' + esc(o.order.number) + (o.order.customer_name ? ' · ' + esc(o.order.customer_name) : '') + '</h1>' +
      '<p class="muted">' + (o.order.order_type === 'togo' ? 'To go' : 'For here') + ' · ' + methodLabel(o.payments[0].method) + ' · ' + money(o.order.total) + '</p>';
    if (o.change > 0) { h += '<div class="change big"><span>Change</span><b>' + money(o.change) + '</b></div>'; }
    h += '<p class="muted">' + ((o.order.has_bar || o.order.has_kitchen) ? 'Sent to the ' + [o.order.has_bar ? 'bar' : '', o.order.has_kitchen ? 'kitchen' : ''].filter(Boolean).join(' and ') + (S.online ? '.' : ' as soon as the internet is back.') : '') + '</p>' +
      '<div class="row center-row"><button class="btn soft big" data-act="print" data-arg="' + o.order.id + '">Print receipt</button>' +
      '<button class="btn primary big" data-act="neworder">New order</button></div></div>';
    return h;
  }
  function methodLabel(m) { return m === 'card' ? 'Card' : m === 'cash_usd' ? 'Cash $' : 'Cash L'; }

  /* ── receipt (prints with the browser; thermal printers come with the local hub) ── */
  function printReceipt(id) {
    var o = null, i, st = settings(), r = '';
    for (i = 0; i < S.orders.length; i++) { if (S.orders[i].order.id === id) { o = S.orders[i]; } }
    if (!o) { return; }
    var p = o.payments[0];
    r += '<div class="rc"><h2>' + esc(st.cafe_name || 'Josie\'s Cafe') + '</h2><p>' + esc(st.address || 'Utila, Honduras') + '</p>' +
      '<p>' + new Date(o.order.created_at).toLocaleString() + '</p><p><b>Order ' + esc(o.order.number) + '</b>' +
      (o.order.customer_name ? ' · ' + esc(o.order.customer_name) : '') + ' · ' + (o.order.order_type === 'togo' ? 'To go' : 'For here') + '</p><hr>';
    o.items.forEach(function (it) { r += '<div class="rr"><span>' + it.qty + ' ' + esc(it.name) + '</span><span>' + money(it.unit_price * it.qty) + '</span></div>'; });
    if (o.order.togo_total) { r += '<div class="rr"><span>To-go</span><span>' + money(o.order.togo_total) + '</span></div>'; }
    r += '<hr><div class="rr"><span>ISV ' + Math.round(Number(st.tax_rate || 0) * 100) + '%' + (st.prices_include_tax ? ' (incl.)' : '') + '</span><span>' + money(o.order.tax) + '</span></div>';
    if (o.order.tip) { r += '<div class="rr"><span>Tip</span><span>' + money(o.order.tip) + '</span></div>'; }
    r += '<div class="rr big"><span>Total</span><span>' + money(o.order.total) + '</span></div>' +
      '<div class="rr"><span>' + methodLabel(p.method) + (p.usd_amount ? ' (' + money(p.usd_amount, '$') + ' @ ' + p.usd_rate + ')' : '') + '</span><span></span></div>' +
      (o.change > 0 ? '<div class="rr"><span>Change</span><span>' + money(o.change) + '</span></div>' : '') +
      '<hr><p>Recibo — no es factura fiscal</p><p>¡Gracias! Thank you!</p></div>';
    $('receipt').innerHTML = r;
    w.print();
  }

  /* ── recent orders (this device) ── */
  function vOrders() {
    var h = header('Recent orders', 'back') + '<div class="list-wrap"><div class="card list">';
    if (!S.orders.length) { h += '<p class="muted">No orders on this device yet.</p>'; }
    S.orders.slice(0, 60).forEach(function (o) {
      h += '<div class="lrow"><b class="num">' + esc(o.order.number) + '</b><span class="grow">' + esc(o.order.customer_name || '—') +
        '<small>' + timeStr(o.order.created_at) + ' · ' + (o.order.order_type === 'togo' ? 'To go' : 'Here') + ' · ' + methodLabel(o.payments[0].method) +
        (o.order.status === 'void' ? ' · VOID' : '') + (o.synced ? '' : ' · waiting to sync') + '</small></span><span class="amt">' + money(o.order.total) + '</span>' +
        '<button class="btn soft" data-act="print" data-arg="' + o.order.id + '">Receipt</button>' +
        (S.staff && S.staff.role === 'manager' && o.order.status !== 'void' ? '<button class="btn soft" data-act="void" data-arg="' + o.order.id + '">Void</button>' : '') + '</div>';
    });
    return h + '</div></div>';
  }
  function voidOrder(id) {
    if (!w.confirm('Void this order? Do any refund by hand.')) { return; }
    api('PATCH', 'orders?id=eq.' + id, { status: 'void', bar_done_at: new Date().toISOString(), kitchen_done_at: new Date().toISOString() }, function (err) {
      if (err) { w.alert(S.online ? 'Couldn’t void (is the order uploaded yet?)' : 'Voiding needs internet.'); return; }
      S.orders.forEach(function (o) { if (o.order.id === id) { o.order.status = 'void'; } });
      save('orders'); render();
    });
  }

  /* ── staff menu sheet ── */
  function vMenuSheet() {
    return header('', 'back') + '<div class="center"><h1>' + esc(S.staff ? S.staff.name : '') + '</h1><div class="sheet">' +
      '<button class="btn soft big" data-act="orders">Recent orders</button>' +
      (S.staff && S.staff.role === 'manager' ? '<button class="btn soft big" data-act="manage">Manage (menu, staff, money)</button>' : '') +
      '<button class="btn soft big" data-act="refresh">Refresh menu</button>' +
      '<button class="btn primary big" data-act="logout">Switch staff</button></div>' +
      (S.syncErr ? '<p class="msg">' + esc(S.syncErr) + '</p>' : '') + '</div>';
  }

  /* ───────────────────────── station screens ───────────────────────── */
  var stationTimer = null;
  function stationPoll() {
    var st = S.device.mode, since = new Date(Date.now() - 12 * 3600000).toISOString(),
      col = st === 'bar' ? 'bar_done_at' : 'kitchen_done_at';
    var soon = new Date(Date.now() + 20 * 60000).toISOString();
    api('GET', 'orders?select=id,number,customer_name,order_type,source,pickup_at,created_at,order_items(name,qty,note,station,item_id)' +
      '&status=in.(paid,open)&' + col + '=is.null&created_at=gte.' + encodeURIComponent(new Date(Date.now() - 8 * 86400000).toISOString()) +
      '&and=' + encodeURIComponent('(or(pickup_at.is.null,pickup_at.lte."' + soon + '"),or(source.eq.online,created_at.gte."' + since + '"))') + '&order=created_at.asc', null, function (err, data) {
      S.station.loaded = true;
      if (err) { S.station.err = S.online ? 'Could not load tickets' : 'Offline · showing the last tickets'; }
      else {
        S.station.err = '';
        S.station.tickets = (data || []).map(function (o) {
          o.order_items = (o.order_items || []).filter(function (i) { return i.station === st; });
          return o;
        }).filter(function (o) { return o.order_items.length; }).sort(function (a, b) {
          var x = a.pickup_at ? new Date(a.pickup_at).getTime() - 20 * 60000 : new Date(a.created_at).getTime(),
            y = b.pickup_at ? new Date(b.pickup_at).getTime() - 20 * 60000 : new Date(b.created_at).getTime();
          return x - y;
        });
      }
      if (S.view === 'station') { render(); }
    });
  }
  function vStation() {
    var st = S.device.mode, now = Date.now(), h;
    h = '<header class="bar station-bar"><span class="title big">' + (st === 'bar' ? 'Bar' : 'Kitchen') + '</span><span class="muted">' +
      S.station.tickets.length + ' waiting</span><span class="grow"></span><span id="status">' + statusPill() + '</span>' +
      (S.station.err ? '<span class="pill warn">' + esc(S.station.err) + '</span>' : '') +
      '<button class="btn ghost" data-act="devset">Device</button></header><div class="tickets">';
    S.station.tickets.forEach(function (o) {
      var start = o.pickup_at ? new Date(o.pickup_at).getTime() - 20 * 60000 : new Date(o.created_at).getTime(),
        mins = Math.max(0, Math.floor((now - start) / 60000)), tone = mins >= 15 ? 'late' : mins >= 8 ? 'warm' : 'fresh';
      h += '<article class="tk ' + tone + '"><div class="tkh"><div><b>' + esc(o.customer_name || 'Order ' + o.number) + '</b><small>Order ' + esc(o.number) +
        (o.order_type === 'togo' ? ' · <span class="togo">TO GO</span>' : '') + (o.source === 'online' ? ' · <span class="togo">ONLINE · pick up ' + timeStr(o.pickup_at) + '</span>' : '') + '</small></div><span class="age">' + mins + ' min</span></div><ul>';
      o.order_items.forEach(function (i) {
        var it = i.item_id ? byId(S.data.items, i.item_id) : null;
        h += '<li><b>' + i.qty + ' × ' + esc(it ? nm(it.name) : i.name) + '</b>' + (i.note ? '<em>' + esc(i.note) + '</em>' : '') + '</li>';
      });
      h += '</ul><button class="btn primary big" data-act="bump" data-arg="' + o.id + '">Done</button></article>';
    });
    if (S.station.loaded && !S.station.tickets.length) { h += '<p class="allclear">All caught up</p>'; }
    return h + '</div>';
  }
  function bump(id) {
    var keep = [];
    S.station.tickets.forEach(function (o) { if (o.id !== id) { keep.push(o); } });
    S.station.tickets = keep; render();
    api('POST', 'rpc/bump', { p_order: id, p_station: S.device.mode }, function (err) { if (err) { stationPoll(); } });
  }

  /* ───────────────────────── manage (manager only) ───────────────────────── */
  function vManage() {
    var m = S.manage, h = header('Manage', 'back') + '<div class="manage"><nav class="rail">' +
      [['site', 'Open / closed'], ['menu', 'Menu'], ['staff', 'Staff'], ['money', 'Money & hours'], ['today', 'Today'], ['device', 'This device']].map(function (t) {
        return '<button class="cat' + (m.tab === t[0] ? ' on' : '') + '" data-act="mtab" data-arg="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</nav><main class="mbody">';
    if (!S.online && m.tab !== 'device') { h += '<p class="msg">You’re offline. Changes here need internet.</p>'; }
    if (m.tab === 'site') { h += mSite(); }
    else if (m.tab === 'menu') { h += mMenu(); }
    else if (m.tab === 'staff') { h += mStaff(); }
    else if (m.tab === 'money') { h += mMoney(); }
    else if (m.tab === 'today') { h += mToday(); }
    else { h += mDevice(); }
    return h + '</main></div>';
  }

  function mSite() {
    var st = settings(), today = JC.today(), closed = !!(st.closed_until && today <= st.closed_until), tomorrow = new Date(), h;
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tm = tomorrow.getFullYear() + '-' + ('0' + (tomorrow.getMonth() + 1)).slice(-2) + '-' + ('0' + tomorrow.getDate()).slice(-2);
    h = '<h1>Open / closed</h1><p class="muted">What josiescafe.com says right now. Regular hours are in Money &amp; hours.</p>';
    h += '<div class="card form"><p class="lbl">Right now</p><p class="bigstate ' + (closed ? 'closed' : 'open') + '">' +
      (closed ? (st.closed_until === today ? 'Closed today' : 'Closed through ' + esc(st.closed_until)) : 'Normal hours') + '</p>';
    if (closed) {
      h += (st.closed_note ? '<p>Note on the website: “' + esc(st.closed_note) + '”</p>' : '') +
        '<button class="btn primary big" data-act="reopen">We’re open again</button>';
    } else {
      h += '<label>Note for customers (optional)<input id="s_note" maxlength="90" placeholder="Boat’s late, back tomorrow!"></label>' +
        '<div class="row"><button class="btn primary big" data-act="closetoday">Close for today</button></div>' +
        '<div class="row2" style="margin-top:12px"><label>Or closed through<input id="s_until" type="date" min="' + today + '" value="' + tm + '"></label>' +
        '<label>&nbsp;<button class="btn soft" data-act="closeuntil" style="width:100%">Close through this day</button></label></div>';
    }
    h += '</div><div class="card form"><p class="lbl">Online orders</p><div class="row"><span class="grow">' +
      (st.online_orders === false ? 'Paused. The website says to come to the counter.' : 'On. People can order ahead on josiescafe.com.') + '</span>' +
      '<button class="btn ' + (st.online_orders === false ? 'primary' : 'soft') + '" data-act="weborders">' + (st.online_orders === false ? 'Turn on' : 'Pause') + '</button></div></div>' +
      '<p id="siteMsg" class="msg"></p>';
    return h;
  }
  function saveSite(body) {
    body.updated_at = new Date().toISOString();
    var msg = $('siteMsg'); if (msg) { msg.innerHTML = 'Saving…'; }
    api('PATCH', 'settings?id=eq.1', body, function (err) {
      if (err) { if ($('siteMsg')) { $('siteMsg').innerHTML = 'Couldn’t save (needs internet).'; } return; }
      loadData(function () { render(); });
    }, { Prefer: 'return=minimal' });
  }

  function mMenu() {
    var cats = S.data.categories.slice().sort(function (a, b) { return a.sort - b.sort; }), m = S.manage, h, c;
    if (!m.cat && cats.length) { m.cat = cats[0].id; }
    c = byId(S.data.categories, m.cat);
    h = '<h1>Menu</h1><p class="muted">Changes show on every tablet and on josiescafe.com within a minute.</p><div class="mm"><div class="card mcol"><div class="mhead"><b>Categories</b>' +
      '<button class="btn soft sm" data-act="catnew">+ Add</button></div>';
    cats.forEach(function (k, i) {
      h += '<div class="mrow' + (k.id === m.cat ? ' on' : '') + (k.active ? '' : ' off') + '"><button class="grow lnk" data-act="mcat" data-arg="' + k.id + '"><span class="sw" style="background:' + esc(k.color) + '"></span>' +
        esc(JC.tr(k.name, 'en')) + '<small>' + k.station + (Number(k.togo_charge) ? ' · to-go L ' + k.togo_charge : '') + (k.active ? '' : ' · hidden') + '</small></button>' +
        '<button class="ib" data-act="catmove" data-arg="' + k.id + ':-1"' + (i ? '' : ' disabled') + '>' + icon('up') + '</button>' +
        '<button class="ib" data-act="catmove" data-arg="' + k.id + ':1"' + (i < cats.length - 1 ? '' : ' disabled') + '>' + icon('down') + '</button>' +
        '<button class="btn soft sm" data-act="catedit" data-arg="' + k.id + '">Edit</button></div>';
    });
    h += '</div><div class="card mcol wide"><div class="mhead"><b>' + esc(c ? JC.tr(c.name, 'en') : 'Items') + '</b>' +
      (c ? '<button class="btn soft sm" data-act="itemnew">+ Add item</button>' : '') + '</div>';
    if (c) {
      var list = itemsIn(c.id, true);
      list.forEach(function (it, i) {
        h += '<div class="mrow' + (it.active ? '' : ' off') + '"><span class="grow">' + esc(JC.tr(it.name, 'en')) + '<small>' + money(it.price) +
          (it.togo_charge !== null && it.togo_charge !== undefined ? ' · to-go L ' + it.togo_charge : '') + (it.show_online ? '' : ' · not online') + (it.active ? '' : ' · removed') + '</small></span>' +
          '<button class="chip sm' + (it.available ? '' : ' on') + '" data-act="sold" data-arg="' + it.id + '">' + (it.available ? 'In stock' : 'Sold out') + '</button>' +
          '<button class="ib" data-act="itemmove" data-arg="' + it.id + ':-1"' + (i ? '' : ' disabled') + '>' + icon('up') + '</button>' +
          '<button class="ib" data-act="itemmove" data-arg="' + it.id + ':1"' + (i < list.length - 1 ? '' : ' disabled') + '>' + icon('down') + '</button>' +
          '<button class="btn soft sm" data-act="itemedit" data-arg="' + it.id + '">Edit</button></div>';
      });
      if (!list.length) { h += '<p class="muted">No items yet.</p>'; }
    }
    return h + '</div></div>' + (m.edit ? editor() : '');
  }

  var COLORS = ['#C99A8E', '#F5B5C8', '#E2B4D0', '#F7BFA8', '#EC98AE', '#C77F98', '#F9D7A8', '#B8C9E8', '#BFE0D4'];
  function editor() {
    var e = S.manage.edit, rec = e.rec, h = '<div class="modal"><form class="card form editor" id="editForm"><h2>' + (e.kind === 'cat' ? 'Category' : 'Item') + '</h2>' +
      '<p class="muted tiny">English is required. Other languages are optional: blank ones show English (Flemish shows Dutch).</p><div class="langs">';
    JC.langs.forEach(function (l) {
      if (l.code === 'nl-BE') { return; }
      h += '<label>' + l.label + '<input data-lang="' + l.code + '" value="' + esc((rec.name || {})[l.code] || '') + '"' + (l.code === 'he' ? ' dir="rtl"' : '') + '></label>';
    });
    h += '</div>';
    if (e.kind === 'cat') {
      h += '<div class="row2"><label>Prints to<select id="f_station">' + opt('bar', 'Bar', rec.station) + opt('kitchen', 'Kitchen', rec.station) + opt('none', 'Nowhere', rec.station) + '</select></label>' +
        '<label>To-go charge per item (L)<input id="f_togo" type="number" inputmode="decimal" step="0.01" min="0" value="' + esc(rec.togo_charge) + '"></label></div>' +
        '<p class="lbl">Colour</p><div class="swatches">' + COLORS.map(function (c) {
          return '<button type="button" class="swatch' + (rec.color === c ? ' on' : '') + '" style="background:' + c + '" data-act="color" data-arg="' + c + '" aria-label="Colour ' + c + '"></button>';
        }).join('') + '</div><label class="check"><input id="f_active" type="checkbox"' + (rec.active ? ' checked' : '') + '> Show this category</label>';
    } else {
      h += '<div class="row2"><label>Price (L)<input id="f_price" type="number" inputmode="decimal" step="0.01" min="0" value="' + esc(rec.price) + '"></label>' +
        '<label>To-go charge (L, blank = category’s)<input id="f_togo" type="number" inputmode="decimal" step="0.01" min="0" value="' + (rec.togo_charge === null || rec.togo_charge === undefined ? '' : esc(rec.togo_charge)) + '"></label></div>' +
        '<label>Category<select id="f_cat">' + S.data.categories.map(function (c) { return opt(c.id, JC.tr(c.name, 'en'), rec.category_id); }).join('') + '</select></label>' +
        '<label class="check"><input id="f_online" type="checkbox"' + (rec.show_online ? ' checked' : '') + '> Show on josiescafe.com</label>' +
        '<label class="check"><input id="f_avail" type="checkbox"' + (rec.available ? ' checked' : '') + '> In stock today</label>' +
        '<label class="check"><input id="f_active" type="checkbox"' + (rec.active ? ' checked' : '') + '> On the menu (untick to remove; old orders keep it)</label>';
    }
    return h + '<p id="editMsg" class="msg"></p><div class="row"><button type="button" class="btn soft" data-act="editcancel">Cancel</button>' +
      (rec.id ? '<button type="button" class="btn soft" data-act="editdelete">Delete</button>' : '') +
      '<span class="grow"></span><button class="btn primary big" type="submit">Save</button></div></form></div>';
  }
  function saveEditor() {
    var e = S.manage.edit, rec = e.rec, names = {}, ins = d.querySelectorAll('#editForm [data-lang]'), i, body, path, method;
    for (i = 0; i < ins.length; i++) { var v = ins[i].value.replace(/^\s+|\s+$/g, ''); if (v) { names[ins[i].getAttribute('data-lang')] = v; } }
    if (!names.en) { $('editMsg').innerHTML = 'English name is required.'; return; }
    if (e.kind === 'cat') {
      body = { name: names, station: $('f_station').value, togo_charge: Number($('f_togo').value || 0), color: rec.color || COLORS[0], active: $('f_active').checked };
      if (!rec.id) { body.sort = S.data.categories.length + 1; }
      path = 'categories';
    } else {
      var price = $('f_price').value, tg = $('f_togo').value;
      if (price === '' || isNaN(Number(price))) { $('editMsg').innerHTML = 'Price is required.'; return; }
      body = { name: names, price: Number(price), togo_charge: tg === '' ? null : Number(tg), category_id: $('f_cat').value,
        show_online: $('f_online').checked, available: $('f_avail').checked, active: $('f_active').checked, updated_at: new Date().toISOString() };
      if (!rec.id) { body.sort = itemsIn(body.category_id, true).length + 1; }
      path = 'items';
    }
    method = rec.id ? 'PATCH' : 'POST';
    if (rec.id) { path += '?id=eq.' + rec.id; }
    $('editMsg').innerHTML = 'Saving…';
    api(method, path, body, function (err) {
      if (err) { $('editMsg').innerHTML = S.online ? 'Couldn’t save. Try again.' : 'You’re offline. Menu changes need internet.'; return; }
      S.manage.edit = null;
      loadData(function () { render(); });
    }, { Prefer: 'return=minimal' });
  }
  function deleteEdited() {
    var e = S.manage.edit, rec = e.rec;
    if (!w.confirm('Delete "' + JC.tr(rec.name, 'en') + '" for good?' + (e.kind === 'cat' ? ' All its items are deleted too.' : '') +
      '\n\nTip: unticking "' + (e.kind === 'cat' ? 'Show this category' : 'On the menu') + '" hides it instead.')) { return; }
    api('DELETE', (e.kind === 'cat' ? 'categories' : 'items') + '?id=eq.' + rec.id, null, function (err) {
      if (err) { $('editMsg').innerHTML = 'Couldn’t delete.'; return; }
      S.manage.edit = null; if (e.kind === 'cat') { S.manage.cat = null; }
      loadData(function () { render(); });
    });
  }
  function move(kind, arg) {
    var parts = arg.split(':'), id = parts[0], dir = Number(parts[1]), list, i, a, b, table;
    if (kind === 'cat') { list = S.data.categories.slice().sort(function (x, y) { return x.sort - y.sort; }); table = 'categories'; }
    else { list = itemsIn(byId(S.data.items, id).category_id, true); table = 'items'; }
    for (i = 0; i < list.length; i++) { if (list[i].id === id) { break; } }
    a = list[i]; b = list[i + dir];
    if (!a || !b) { return; }
    // renumber the whole list so sorts stay clean
    list.splice(i, 1); list.splice(i + dir, 0, a);
    var pending = list.length;
    list.forEach(function (rec, idx) {
      rec.sort = idx + 1;
      api('PATCH', table + '?id=eq.' + rec.id, { sort: idx + 1 }, function () { pending -= 1; if (!pending) { save('data'); } }, { Prefer: 'return=minimal' });
    });
    render();
  }
  function toggleSold(id) {
    var it = byId(S.data.items, id); if (!it) { return; }
    it.available = !it.available; save('data'); render();
    api('PATCH', 'items?id=eq.' + id, { available: it.available }, function (err) {
      if (err) { it.available = !it.available; save('data'); render(); w.alert('Needs internet to change.'); }
    }, { Prefer: 'return=minimal' });
  }

  function mStaff() {
    var h = '<h1>Staff</h1><p class="muted">Each person picks their name and types a 4-digit PIN. Managers can open Manage.</p><div class="card list">';
    S.data.staff.forEach(function (s) {
      h += '<div class="mrow' + (s.active ? '' : ' off') + '"><span class="av">' + esc(s.name.charAt(0)) + '</span><span class="grow">' + esc(s.name) +
        '<small>' + s.role + (s.active ? '' : ' · inactive') + '</small></span><button class="btn soft sm" data-act="staffedit" data-arg="' + s.id + '">Edit</button></div>';
    });
    return h + '<div class="row"><button class="btn primary" data-act="staffedit" data-arg="">+ Add staff</button></div></div>';
  }
  function editStaff(id) {
    var s = id ? byId(S.data.staff, id) : { name: '', pin: '', role: 'staff', active: true };
    var name = w.prompt('Name', s.name); if (name === null || !name.replace(/\s/g, '')) { return; }
    var pin = w.prompt('4-digit PIN', s.pin); if (pin === null) { return; }
    if (!/^[0-9]{4}$/.test(pin)) { w.alert('PIN must be exactly 4 digits.'); return; }
    var role = w.confirm('Is ' + name + ' a manager? (OK = manager, Cancel = staff)') ? 'manager' : 'staff';
    var active = id ? w.confirm('Keep ' + name + ' active? (Cancel = deactivate)') : true;
    var body = { name: name, pin: pin, role: role, active: active };
    api(id ? 'PATCH' : 'POST', 'staff' + (id ? '?id=eq.' + id : ''), body, function (err) {
      if (err) { w.alert('Couldn’t save (needs internet).'); return; }
      loadData(function () { render(); });
    }, { Prefer: 'return=minimal' });
  }

  function mMoney() {
    var st = settings(), rt = rate(), day = JC.usdRateDay(S.data.fx), bank = null, i, hrs = st.hours || {}, h;
    for (i = 0; i < S.data.fx.length; i++) { if (S.data.fx[i].day === day) { bank = S.data.fx[i]; } }
    h = '<h1>Money &amp; hours</h1><form id="moneyForm" class="card form"><div class="rate">' +
      '<div><small>Banco Atlántida buys $1</small><b>' + (bank ? 'L ' + Number(bank.bank_buy).toFixed(4) : '—') + '</b><small>' + (day || 'no rate yet') + ' · checked 6am &amp; noon</small></div>' +
      '<div><small>Josie’s rate today</small><b class="accent">' + (rt ? 'L ' + rt.toFixed(2) : '—') + '</b><small>per $1 at the register</small></div></div>' +
      '<div class="row2"><label>Josie’s fee per $1 (L)<input id="m_fee" type="number" step="0.01" min="0" value="' + esc(st.usd_fee) + '"></label>' +
      '<label>Set rate by hand (blank = automatic)<input id="m_manual" type="number" step="0.01" min="0" value="' + (st.usd_rate_manual ? esc(st.usd_rate_manual) : '') + '"></label></div>' +
      '<div class="row2"><label>ISV rate (%)<input id="m_tax" type="number" step="0.01" min="0" value="' + r2(Number(st.tax_rate) * 100) + '"></label>' +
      '<label class="check"><input id="m_incl" type="checkbox"' + (st.prices_include_tax ? ' checked' : '') + '> Menu prices already include ISV</label></div>' +
      '<label>Address on the website and receipts<input id="m_addr" value="' + esc(st.address) + '"></label>' +
      '<p class="lbl">Opening hours (like 7:00-15:00, or closed)</p><div class="hours">';
    [['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun']].forEach(function (dd) {
      h += '<label>' + dd[1] + '<input data-day="' + dd[0] + '" value="' + esc(hrs[dd[0]] || 'closed') + '"></label>';
    });
    return h + '</div><p id="moneyMsg" class="msg"></p><button class="btn primary big" type="submit">Save</button></form>';
  }
  function saveMoney() {
    var hrs = {}, ins = d.querySelectorAll('#moneyForm [data-day]'), i, man = $('m_manual').value;
    for (i = 0; i < ins.length; i++) { hrs[ins[i].getAttribute('data-day')] = ins[i].value.replace(/\s/g, '') || 'closed'; }
    var body = { usd_fee: Number($('m_fee').value || 0), usd_rate_manual: man === '' ? null : Number(man),
      tax_rate: Number($('m_tax').value || 0) / 100, prices_include_tax: $('m_incl').checked, address: $('m_addr').value,
      hours: hrs, updated_at: new Date().toISOString() };
    $('moneyMsg').innerHTML = 'Saving…';
    api('PATCH', 'settings?id=eq.1', body, function (err) {
      if (err) { $('moneyMsg').innerHTML = 'Couldn’t save (needs internet).'; return; }
      loadData(function () { render(); });
    }, { Prefer: 'return=minimal' });
  }

  function mToday() {
    var r = S.report, h = '<h1>Today</h1>';
    if (!r) { loadReport(); return h + '<p class="muted">Loading…</p>'; }
    if (r.err) { h += '<p class="msg">' + esc(r.err) + ' Showing this device only.</p>'; }
    h += '<div class="stats">' + stat('Sales', money(r.total)) + stat('Orders', r.count) + stat('Cash L', money(r.cash_hnl)) +
      stat('Cash $ (in L)', money(r.cash_usd)) + stat('Card', money(r.card)) + stat('Card tips', money(r.tips)) + stat('To-go charges', money(r.togo)) + stat('ISV', money(r.tax)) + '</div>' +
      '<p class="muted">Voided orders are left out. Card total includes card tips.</p><button class="btn soft" data-act="report">Refresh</button>';
    return h;
  }
  function stat(l, v) { return '<div class="card stat"><small>' + l + '</small><b>' + v + '</b></div>'; }
  function loadReport() {
    var start = new Date(); start.setHours(0, 0, 0, 0);
    api('GET', 'orders?select=total,tip,tax,togo_total,status,payments(method,amount)&created_at=gte.' + encodeURIComponent(start.toISOString()), null, function (err, data) {
      var src = data, r = { total: 0, count: 0, cash_hnl: 0, cash_usd: 0, card: 0, tips: 0, togo: 0, tax: 0 };
      if (err) {
        r.err = 'Can’t reach the server.';
        src = S.orders.filter(function (o) { return new Date(o.order.created_at) >= start; })
          .map(function (o) { var x = o.order; x.payments = o.payments; return x; });
      }
      (src || []).forEach(function (o) {
        if (o.status === 'void') { return; }
        r.count += 1; r.total += Number(o.total); r.tips += Number(o.tip || 0); r.togo += Number(o.togo_total || 0); r.tax += Number(o.tax || 0);
        (o.payments || []).forEach(function (p) { r[p.method] += Number(p.amount); });
      });
      S.report = r;
      if (S.view === 'manage' && S.manage.tab === 'today') { render(); }
    });
  }

  function mDevice() {
    var dv = S.device;
    return '<h1>This device</h1><div class="card form"><p>Signed in as <b>' + esc(S.session ? S.session.email : '—') + '</b> · device ' + esc(dv.code) + ' · v' + APP_VERSION + '</p>' +
      '<div class="row2"><label>This device is<select id="d_mode">' + opt('register', 'Register', dv.mode) + opt('kitchen', 'Kitchen screen', dv.mode) + opt('bar', 'Bar screen', dv.mode) + '</select></label>' +
      '<label>Item names in<select id="d_lang">' + opt('en', 'English', dv.lang) + opt('es', 'Español', dv.lang) + '</select></label></div>' +
      '<div class="row"><button class="btn primary" data-act="devsave">Save</button><span class="grow"></span>' +
      '<button class="btn soft" data-act="signout">Sign this device out</button></div>' +
      (S.queue.length ? '<p class="msg">' + S.queue.length + ' order(s) haven’t uploaded yet. Don’t sign out until they have.</p>' : '') + '</div>';
  }

  /* ───────────────────────── navigation ───────────────────────── */
  function go(v) {
    if (stationTimer) { w.clearInterval(stationTimer); stationTimer = null; }
    S.view = v;
    if (v === 'station') { stationPoll(); stationTimer = w.setInterval(stationPoll, 4000); }
    render();
    w.scrollTo(0, 0);
  }

  function onClick(ev) {
    var el = closestAct(ev.target);
    if (!el || el.disabled) { return; }
    var act = el.getAttribute('data-act'), arg = el.getAttribute('data-arg');
    ev.preventDefault();
    switch (act) {
      case 'pickstaff': S.pinStaff = arg; S.pin = ''; S.pinMsg = ''; render(); break;
      case 'pin': pinKey(arg); break;
      case 'cat': S.cat = arg; render(); break;
      case 'add': addItem(arg); break;
      case 'inc': S.cart.lines[+arg].qty += 1; save('cart'); render(); break;
      case 'dec': if (S.cart.lines[+arg].qty > 1) { S.cart.lines[+arg].qty -= 1; } else { S.cart.lines.splice(+arg, 1); } save('cart'); render(); break;
      case 'note': var n = w.prompt('Note for the kitchen/bar (e.g. no onion, oat milk)', S.cart.lines[+arg].note || '');
        if (n !== null) { S.cart.lines[+arg].note = n; save('cart'); render(); } break;
      case 'clear': if (!S.cart.lines.length || w.confirm(S.cart.online ? 'Put online order ' + S.cart.online.number + ' back in the online list?' : 'Clear this order?')) { S.cart = { name: '', lines: [] }; save('cart'); render(); } break;
      case 'ticket': S.showTicket = !S.showTicket; render(); break;
      case 'pay': startPay(); break;
      case 'ptype': S.pay.type = arg; S.pay.step = 'method'; render(); break;
      case 'ptype2': S.pay.type = arg; S.pay.given = null; render(); break;
      case 'method': S.pay.method = arg; S.pay.given = null; render(); break;
      case 'given': S.pay.given = Number(arg); render(); break;
      case 'tip':
        if (+arg === 4) { var tv = w.prompt('Tip amount in lempiras', S.pay.tip || ''); if (tv === null || isNaN(Number(tv))) { break; } S.pay.tip = Number(tv); }
        S.pay.tipMode = +arg; render(); break;
      case 'complete': complete(); break;
      case 'back':
        if (S.view === 'pay' && S.pay && S.pay.step === 'method') { S.pay.step = 'type'; render(); }
        else if (S.view === 'manage' && S.manage.edit) { S.manage.edit = null; render(); }
        else if (S.view === 'pay' && S.cart.online) { S.pay = null; go('register'); }
        else { go(S.device.mode === 'register' ? 'register' : 'station'); }
        break;
      case 'neworder': go('register'); break;
      case 'print': printReceipt(arg); break;
      case 'orders': go('orders'); break;
      case 'web': go('web'); webPoll(); break;
      case 'webpay': webPay(arg); break;
      case 'webvoid': webVoid(arg); break;
      case 'closetoday': saveSite({ closed_until: JC.today(), closed_note: ($('s_note') && $('s_note').value) || '' }); break;
      case 'closeuntil': if ($('s_until') && $('s_until').value) { saveSite({ closed_until: $('s_until').value, closed_note: ($('s_note') && $('s_note').value) || '' }); } break;
      case 'reopen': saveSite({ closed_until: null, closed_note: '' }); break;
      case 'weborders': saveSite({ online_orders: settings().online_orders === false }); break;
      case 'void': voidOrder(arg); break;
      case 'bump': bump(arg); break;
      case 'menu': go('menu'); break;
      case 'manage': S.manage.edit = null; go('manage'); break;
      case 'refresh': loadData(function (f) { w.alert(f ? 'Couldn’t refresh (offline?). Using the saved menu.' : 'Menu updated.'); render(); }); break;
      case 'logout': S.staff = null; save('staff'); go('login'); break;
      case 'syncinfo': w.alert(S.syncErr); break;
      case 'mtab': S.manage.tab = arg; S.manage.edit = null; if (arg === 'today') { S.report = null; } render(); break;
      case 'mcat': S.manage.cat = arg; render(); break;
      case 'catnew': S.manage.edit = { kind: 'cat', rec: { name: {}, station: 'kitchen', togo_charge: 0, color: COLORS[0], active: true } }; render(); break;
      case 'catedit': S.manage.edit = { kind: 'cat', rec: JSON.parse(JSON.stringify(byId(S.data.categories, arg))) }; render(); break;
      case 'itemnew': S.manage.edit = { kind: 'item', rec: { name: {}, price: '', togo_charge: null, category_id: S.manage.cat, show_online: true, available: true, active: true } }; render(); break;
      case 'itemedit': S.manage.edit = { kind: 'item', rec: JSON.parse(JSON.stringify(byId(S.data.items, arg))) }; render(); break;
      case 'color': S.manage.edit.rec.color = arg;
        var sw = d.querySelectorAll('.swatch'); for (var si = 0; si < sw.length; si++) { sw[si].className = 'swatch' + (sw[si].getAttribute('data-arg') === arg ? ' on' : ''); }
        break;
      case 'editcancel': S.manage.edit = null; render(); break;
      case 'editdelete': deleteEdited(); break;
      case 'catmove': move('cat', arg); break;
      case 'itemmove': move('item', arg); break;
      case 'sold': toggleSold(arg); break;
      case 'staffedit': editStaff(arg); break;
      case 'report': S.report = null; render(); break;
      case 'devset': if (w.prompt('Manager PIN') === managerPin()) { S.manage.tab = 'device'; go('manage'); } break;
      case 'devsave': S.device.mode = $('d_mode').value; S.device.lang = $('d_lang').value; save('device');
        go(S.device.mode === 'register' ? (S.staff ? 'register' : 'login') : 'station'); break;
      case 'signout':
        if (S.queue.length && !w.confirm('Orders are still waiting to upload. Sign out anyway? They stay saved on this device.')) { break; }
        S.session = null; S.staff = null; save('session'); save('staff'); go('setup'); break;
    }
  }
  function managerPin() {
    var i; for (i = 0; i < S.data.staff.length; i++) { if (S.data.staff[i].role === 'manager' && S.data.staff[i].active) { return S.data.staff[i].pin; } }
    return '____';
  }
  function onSubmit(ev) {
    ev.preventDefault();
    var id = ev.target.id;
    if (id === 'setupForm') { doSetup(); }
    else if (id === 'editForm') { saveEditor(); }
    else if (id === 'moneyForm') { saveMoney(); }
  }
  function onInput(ev) {
    var el = ev.target;
    if (el.id === 'cust') { S.cart.name = el.value; save('cart'); }
    else if (el.id === 'givenIn') {
      S.pay.given = el.value === '' ? null : Number(el.value);
      var cardTip = 0, t = totals(S.cart, S.pay.type, cardTip), rt = rate(),
        val = S.pay.given === null ? null : (S.pay.method === 'cash_usd' ? S.pay.given * rt : S.pay.given), out = $('changeOut');
      if (out) { out.innerHTML = val === null ? '—' : money(Math.abs(r2(val - t.total))); out.parentNode.className = 'change' + (val !== null && val < t.total ? ' short' : ''); }
      var btn = d.querySelector('[data-act="complete"]'); if (btn) { btn.disabled = !canComplete(t); }
    }
    else if (el.id === 'cardRef') { S.pay.ref = el.value; }
  }

  /* ───────────────────────── start ───────────────────────── */
  function boot() {
    app.addEventListener('click', onClick, false);
    app.addEventListener('submit', onSubmit, true);
    app.addEventListener('input', onInput, false);
    if (!S.session || !S.device) { go('setup'); }
    else if (S.device.mode !== 'register') { go('station'); }
    else { go(S.staff ? 'register' : 'login'); }
    if (S.session) {
      loadData(function (failed) { if (!failed && (S.view === 'login' || S.view === 'register')) { render(); } });
    }
    ping();
    w.setInterval(ping, 8000);
    webPoll();
    w.setInterval(function () { if (S.online && S.view !== 'pay') { webPoll(); } }, 20000);
    w.setInterval(function () { if (S.online && S.session && S.view !== 'pay' && !(S.view === 'manage' && S.manage.edit)) { loadData(); } }, 90000);
    // Keep station ticket ages fresh and show the new day's state.
    if ('serviceWorker' in w.navigator) {
      try { w.navigator.serviceWorker.register('sw.js'); } catch (e) {}
    }
  }
  boot();
}(window, document, window.JC));
