/* Josie's World · core. State, the device session, the offline-first write queue, data, the live floor, PIN sign-in.
   Plain ES5 (old iPads). Nothing here draws anything: screens live in the other files and call J2.changed() to repaint.
   The device sign-in and cached menu are shared with the live /pos/ (same localStorage keys), so a tablet set up there just works here. */
(function (w, d, JC) {
  'use strict';

  var J = w.J2 = w.J2 || {};
  J.VERSION = '2.0.0';

  /* ───────────── state (saved on the device) ───────────── */
  var EMPTY = { categories: [], items: [], settings: null, fx: [], ingredients: [], dish_ingredients: [], swaps: [], diets: [], diet_marks: [], names: [] };
  var KEYS = { session: 'pos.session', device: 'pos.device', data: 'p2.data', person: 'p2.person', queue: 'p2.queue', floor: 'p2.floor',
    cart: 'p2.cart', log: 'p2.log', lang: 'p2.lang', known: 'p2.known', tour: 'p2.tour', tickets: 'p2.tickets' };
  var S = J.S = {
    session: JC.get(KEYS.session, null),
    device: JC.get(KEYS.device, null) || { code: 'A', mode: 'register', lang: 'en' },
    data: JC.get(KEYS.data, EMPTY),
    person: JC.get(KEYS.person, null),             // { id, name, role, station, language, token }
    queue: JC.get(KEYS.queue, []),                 // every write waits here until the server has it
    floor: JC.get(KEYS.floor, null),               // last live floor: tables, sticks, open orders, just done, lights, dish_state
    cart: JC.get(KEYS.cart, null),
    log: JC.get(KEYS.log, []),                     // recent orders made on this device (receipts)
    lang: JC.get(KEYS.lang, null) || 'en',
    known: JC.get(KEYS.known, {}),                 // people who have signed in on this device (for offline sign-in)
    online: false, syncing: false, syncErr: '', backBand: 0,
    view: 'boot', tab: 'pos', ui: {}
  };
  function save(k) { JC.set(KEYS[k], S[k]); }
  J.save = save;

  /* ───────────── small helpers ───────────── */
  J.esc = JC.esc; J.money = JC.money; J.r2 = JC.round2; J.uuid = JC.uuid;
  J.$ = function (id) { return d.getElementById(id); };
  J.byId = function (list, id) { for (var i = 0; i < list.length; i++) { if (list[i].id === id) { return list[i]; } } return null; };
  J.t = function (k) { var s = w.J2STR[S.lang] || w.J2STR.en; return s[k] !== undefined ? s[k] : (w.J2STR.en[k] !== undefined ? w.J2STR.en[k] : k); };
  J.nm = function (obj) { return JC.tr(obj, S.lang); };
  J.setLang = function (l) {
    S.lang = l === 'es' ? 'es' : 'en'; save('lang');
    if (S.person) { S.person.language = S.lang; save('person'); if (S.person.token) { J.call('my_settings', { p_token: S.person.token, p_language: S.lang }, function () {}); } }
    J.changed();
  };
  J.hnNow = function () { var n = new Date(Date.now() - 6 * 3600000); return n; };   // Honduras is UTC-6 all year
  J.clock = function () {
    var t = new Date(), h = t.getHours(), m = ('0' + t.getMinutes()).slice(-2);
    return (h % 12 || 12) + ':' + m;
  };
  J.minsSince = function (iso) { return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000)); };
  J.can = function (what) {
    var r = S.person && S.person.role;
    if (what === 'josie') { return r === 'josie'; }
    if (what === 'manager') { return r === 'josie' || r === 'manager'; }
    return !!r;
  };

  /* ───────────── auth and API (same pattern as the live POS) ───────────── */
  function storeSession(r) {
    S.session = { access_token: r.access_token, refresh_token: r.refresh_token,
      expires_at: Date.now() + (Number(r.expires_in || 3600) - 60) * 1000, email: (r.user && r.user.email) || (S.session && S.session.email) || '' };
    JC.set(KEYS.session, S.session);
  }
  J.deviceSignIn = function (email, pass, cb) {
    JC.auth('token?grant_type=password', { email: email, password: pass }, function (err, r, status) {
      if (err) { cb(err, status); return; }
      storeSession(r); S.syncErr = ''; cb(null);
    });
  };
  function withToken(cb) {
    if (!S.session) { cb('signed-out'); return; }
    if (Date.now() < S.session.expires_at) { cb(null, S.session.access_token); return; }
    JC.auth('token?grant_type=refresh_token', { refresh_token: S.session.refresh_token }, function (err, r, status) {
      if (err) {
        if (status === 400 || status === 401) { S.syncErr = 'Device sign-in expired. A manager needs to sign this device in again.'; }
        cb(err); return;
      }
      storeSession(r); cb(null, S.session.access_token);
    });
  }
  J.api = function (method, path, body, cb, headers) {
    withToken(function (e, tok) {
      if (e) { cb(e); return; }
      JC.rest(method, path, body, tok, function (err, data, status) {
        var was = S.online; S.online = status > 0;
        if (S.online && !was && S.queue.length) { S.backBand = S.queue.length; }
        cb(err, data, status);
      }, headers);
    });
  };
  J.call = function (fn, body, cb) { J.api('POST', 'rpc/' + fn, body || {}, cb || function () {}); };

  /* ───────────── data: menu, ingredients, diets, people names ───────────── */
  var PARTS = {
    categories: 'categories?select=*&order=sort.asc', items: 'items?select=*&order=sort.asc', settings: 'settings?select=*',
    fx: 'fx_rates?select=day,bank_buy,bank_sell&order=day.desc&limit=10', ingredients: 'ingredients?select=*&order=id.asc',
    dish_ingredients: 'dish_ingredients?select=*', swaps: 'swaps?select=*&order=sort.asc', diets: 'diets?select=*&order=sort.asc',
    diet_marks: 'diet_marks?select=*'
  };
  var ix = null;
  function buildIndex() {
    var dt = S.data; ix = { ing: {}, di: {}, marks: {}, swapsBy: {}, dietByKey: {}, itemById: {}, catById: {} };
    var i, r;
    for (i = 0; i < dt.ingredients.length; i++) { ix.ing[dt.ingredients[i].id] = dt.ingredients[i]; }
    for (i = 0; i < dt.items.length; i++) { ix.itemById[dt.items[i].id] = dt.items[i]; }
    for (i = 0; i < dt.categories.length; i++) { ix.catById[dt.categories[i].id] = dt.categories[i]; }
    for (i = 0; i < dt.dish_ingredients.length; i++) { r = dt.dish_ingredients[i]; (ix.di[r.item_id] = ix.di[r.item_id] || []).push(r); }
    for (i = 0; i < dt.diets.length; i++) { ix.dietByKey[dt.diets[i].key] = dt.diets[i]; }
    for (i = 0; i < dt.diet_marks.length; i++) { r = dt.diet_marks[i]; ix.marks[r.diet_id + ':' + r.ingredient_id] = r.mark; }
    for (i = 0; i < dt.swaps.length; i++) { r = dt.swaps[i]; (ix.swapsBy[r.element_id] = ix.swapsBy[r.element_id] || []).push(r); }
  }
  J.ix = function () { if (!ix) { buildIndex(); } return ix; };
  J.settings = function () { return S.data.settings || { tax_rate: 0.15, prices_include_tax: true, usd_fee: 1, hours: {}, online_cutoff: '14:00' }; };
  J.rate = function () { return JC.usdRate(J.settings(), S.data.fx); };

  J.loadData = function (cb) {
    var keys = ['categories', 'items', 'settings', 'fx', 'ingredients', 'dish_ingredients', 'swaps', 'diets', 'diet_marks'], pending = keys.length + 1, fresh = {}, failed = false;
    function done() {
      pending -= 1; if (pending) { return; }
      if (!failed) { fresh.names = fresh.names || S.data.names || []; S.data = fresh; save('data'); buildIndex(); }
      if (cb) { cb(failed); }
    }
    keys.forEach(function (k) {
      J.api('GET', PARTS[k], null, function (err, data) { if (err) { failed = true; } else { fresh[k] = k === 'settings' ? (data && data[0]) : data; } done(); });
    });
    J.call('people_names', {}, function (err, data) { if (!err && data) { fresh.names = data; } done(); });
  };

  /* ───────────── the live floor ───────────── */
  J.pollFloor = function (cb) {
    if (!S.session) { return; }
    J.call('floor_state', {}, function (err, f) {
      if (!err && f) {
        if (S.queue.length) {
          // writes are still waiting to upload: keep our own picture of orders and sticks, take the rest
          if (S.floor) { S.floor.lights = f.lights; S.floor.dish_state = f.dish_state; S.floor.tables = f.tables; }
        } else { S.floor = f; }
        var sig = JSON.stringify([S.floor.open, S.floor.done, S.floor.sticks, S.floor.lights, S.floor.dish_state]);
        if (sig !== J._floorSig) { J._floorSig = sig; save('floor'); J.changed(); } else { save('floor'); }
      }
      if (cb) { cb(err); }
    });
  };
  J.stickInfo = function (n) {
    var l = (S.floor && S.floor.sticks) || [];
    for (var i = 0; i < l.length; i++) { if (l[i].number === n) { return l[i]; } }
    return null;
  };
  J.tableOf = function (id) { var t = (S.floor && S.floor.tables) || []; return J.byId(t, id); };
  J.light = function (ingId) { return (S.floor && S.floor.lights && S.floor.lights[ingId]) || 'green'; };
  J.dishState = function (itemId) { return (S.floor && S.floor.dish_state && S.floor.dish_state[itemId]) || { out: false, missing: [] }; };

  /* A "number" is everything on one stick (for here), or one counter code (to go / online): all its orders, together. */
  J.numbers = function () {
    var open = (S.floor && S.floor.open) || [], groups = [], byKey = {}, i, o, k, g;
    for (i = 0; i < open.length; i++) {
      o = open[i];
      k = o.stick ? 's' + o.stick : 'o' + o.id;
      if (!byKey[k]) { byKey[k] = { key: k, stick: o.stick || null, orders: [], type: o.type, name: o.name, source: o.source, created: o.created_at }; groups.push(byKey[k]); }
      g = byKey[k]; g.orders.push(o);
      if (o.created_at < g.created) { g.created = o.created_at; }
    }
    for (i = 0; i < groups.length; i++) {
      g = groups[i]; g.total = 0; g.owed = 0; g.paid = true;
      for (k = 0; k < g.orders.length; k++) {
        g.total += Number(g.orders[k].total); if (g.orders[k].status !== 'paid') { g.paid = false; g.owed += Number(g.orders[k].total); }
      }
    }
    return groups;
  };
  J.numberOf = function (key) { var l = J.numbers(); for (var i = 0; i < l.length; i++) { if (l[i].key === key) { return l[i]; } } return null; };
  /* Just done: the last completed numbers, grouped as they were completed together */
  J.justDone = function () {
    var done = (S.floor && S.floor.done) || [], groups = [], byKey = {}, i, o, k;
    for (i = 0; i < done.length; i++) {
      o = done[i]; k = (o.stick || o.id) + '@' + o.completed_at;
      if (!byKey[k]) { byKey[k] = { key: k, stick: o.stick || null, orders: [], completed_at: o.completed_at, table_id: o.table_id, name: o.name, type: o.type }; groups.push(byKey[k]); }
      byKey[k].orders.push(o);
    }
    return groups.slice(0, 3);
  };

  /* ───────────── the write queue: every change is saved here first, then uploaded in order ───────────── */
  var JOBS = { order: 'sync_order2', pay: 'pay_orders', complete: 'complete_number', undo: 'undo_complete', place: 'place_stick', stop: 'stop_item',
    cancel: 'cancel_order', light: 'set_light', dishout: 'set_dish_out' };
  J.enqueue = function (kind, payload) {
    var job = { id: J.uuid(), kind: kind, at: new Date().toISOString() };
    if (kind === 'light' || kind === 'dishout') { job.body = payload; } else { job.p = payload; }
    S.queue.push(job); save('queue'); J.syncNext(); J.changed();
    return job;
  };
  J.syncNext = function () {
    if (S.syncing || !S.queue.length || !S.session) { return; }
    S.syncing = true;
    var job = S.queue[0], body = job.body || { p: job.p };
    if (job.kind === 'light' || job.kind === 'dishout') { body.p_token = (S.person && S.person.token) || body.p_token; }
    J.call(JOBS[job.kind], body, function (err, res, status) {
      S.syncing = false;
      var refused = err && status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429;
      var logicFail = !err && res && res.ok === false;           // e.g. "stick back" while something is unpaid, "table occupied"
      if (!err || logicFail) {
        S.queue.shift(); save('queue');
        if (job.kind === 'order') { markSynced(job.p.order.id); }
        if (logicFail) { S.syncErr = ''; }
        else { S.syncErr = ''; }
        if (!S.queue.length) { J.pollFloor(); }
        J.changed(); J.syncNext(); return;
      }
      if (refused) {
        job.failures = (job.failures || 0) + 1;
        S.syncErr = 'A change could not upload (' + status + '). It is kept on this tablet.';
        if (S.queue.length > 1) { S.queue.push(S.queue.shift()); }
        if (job.failures > 5) { S.queue = S.queue.filter(function (j) { return j !== job; }); }
        save('queue');
      }
      J.changed();
    });
  };
  function markSynced(id) { for (var i = 0; i < S.log.length; i++) { if (S.log[i].order.id === id) { S.log[i].synced = true; } } save('log'); }
  J.ping = function () {
    JC.rest('GET', 'settings?select=id', null, null, function (err, data, status) {
      var was = S.online; S.online = status > 0;
      if (S.online !== was) { J.changed(); }
      if (S.online) { J.syncNext(); }
    });
  };

  /* ───────────── PIN sign-in = the time clock ───────────── */
  function sha256(str) {
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
      0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
      0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
      0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var bytes = [], i, j, c;
    str = unescape(encodeURIComponent(str));
    for (i = 0; i < str.length; i++) { bytes.push(str.charCodeAt(i)); }
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) { bytes.push(0); }
    for (i = 7; i >= 0; i--) { bytes.push(i >= 4 ? 0 : (bitLen >>> (i * 8)) & 0xff); }
    function rr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (i = 0; i < bytes.length; i += 64) {
      var Wd = [];
      for (j = 0; j < 16; j++) { Wd[j] = (bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) | (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3]; }
      for (j = 16; j < 64; j++) {
        var s0 = rr(Wd[j - 15], 7) ^ rr(Wd[j - 15], 18) ^ (Wd[j - 15] >>> 3), s1 = rr(Wd[j - 2], 17) ^ rr(Wd[j - 2], 19) ^ (Wd[j - 2] >>> 10);
        Wd[j] = (Wd[j - 16] + s0 + Wd[j - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], cc = H[2], dd = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[j] + Wd[j]) | 0,
          S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22), mj = (a & b) ^ (a & cc) ^ (b & cc), t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (dd + t1) | 0; dd = cc; cc = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + cc) | 0; H[3] = (H[3] + dd) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = '';
    for (i = 0; i < 8; i++) { c = (H[i] >>> 0).toString(16); out += ('00000000' + c).slice(-8); }
    return out;
  }
  J.sha256 = sha256;

  function enter(p, token) {
    S.person = { id: p.id, name: p.name, role: p.role, station: p.station || null, language: p.language || 'en', token: token || null };
    S.lang = p.language || S.lang; save('person'); save('lang');
  }
  /* cb(result): 'ok' | 'wrong' | 'locked' | 'offline-unknown' */
  J.signIn = function (personId, pin, cb) {
    var who = J.byId(S.data.names || [], personId) || { id: personId, name: '', role: 'staff' };
    J.call('sign_in', { p_person: personId, p_pin: pin, p_device: S.device.code }, function (err, r) {
      if (!err && r) {
        if (r.ok) {
          var salt = J.uuid();
          S.known[personId] = { salt: salt, hash: sha256(salt + pin), person: who, token: r.token, token_at: Date.now() }; save('known');
          enter({ id: personId, name: r.name, role: r.role, station: r.station, language: r.language }, r.token);
          cb('ok', r); return;
        }
        cb(r.locked ? 'locked' : 'wrong'); return;
      }
      // no internet: people who have signed in on this device before can still sign in; the shift clocks in when it is back
      var k = S.known[personId];
      if (!k) { cb('offline-unknown'); return; }
      if (sha256(k.salt + pin) !== k.hash) { cb('wrong'); return; }
      enter({ id: personId, name: who.name || k.person.name, role: who.role || k.person.role, station: who.station, language: who.language }, k.token);
      cb('ok');
    });
  };
  J.signOut = function () {
    if (S.person && S.person.token) { J.call('sign_out', { p_token: S.person.token }); }
    S.person = null; save('person'); J.changed();
  };

  /* ───────────── repaint hook (set by the app) ───────────── */
  J.changed = function () { if (J.onChange) { J.onChange(); } };
  J.sizes = { queue: function () { return S.queue.length; } };
  J.keys = KEYS;
}(window, document, window.JC));
