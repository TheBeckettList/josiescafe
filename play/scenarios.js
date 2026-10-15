/* Josie's World · Play scenarios. Preset playthroughs of the pretend café: one order walking through, a morning rush, a lunch rush, and some fringe things
   (out of milk mid-rush, odd taps). A scenario is a timed list of what guests and staff do. It runs against the very same functions the POS calls, so you
   can watch it on the Overview, on the bar and kitchen phone, on the guest website, and then read where it backed up.
   The same engine runs headless for agents and tests:  await J2PLAY.scenarios.run('morning', { fast: true })  ->  { report }.
   Add a scenario by adding one entry to SCENARIOS. Plain ES5 style, modern browsers only. */
(function (w, d) {
  'use strict';
  var P = w.J2PLAY; if (!P) { return; }
  var JC = w.JC, Sc = P.scenarios = { list: [], current: null };

  /* ───────── how long things take (seconds), and who is on ───────── */
  function serviceSecs(it) {
    var n = it.n.toLowerCase();
    if (it.counted) { return 8; }
    if (it.station === 'bar') { return /smoothie|shake/.test(n) ? 70 : /espresso|americano|drip|shot/.test(n) ? 25 : /juice|water|soda/.test(n) ? 12 : /chai|latte|cappuccino|mocha/.test(n) ? 42 : 38; }
    return /toast|bagel|sandwich/.test(n) ? 100 : /plate|burger/.test(n) ? 170 : /pancake/.test(n) ? 150 : /salad/.test(n) ? 90 : 110;
  }
  var RUNNER = 9;      // the cashier brings it out and calls the number
  var PICKUP = 14;     // a guest who ordered online comes to the counter

  /* ───────── small helpers ───────── */
  function rng(seed) { var k = seed || 1; return function () { k = (k * 9301 + 49297) % 233280; return k / 233280; }; }
  function pick(r, a) { return a[Math.floor(r() * a.length) % a.length]; }
  var NAMES = ['Ana', 'Luis', 'Marta', 'Sam', 'Dani', 'Kai', 'Noa', 'Eli', 'Mia', 'Tomas', 'Rita', 'Jo', 'Pablo', 'Lena', 'Omar', 'Zoe', 'Nico', 'Sara', 'Ivan', 'Maya', 'Beto', 'Lucia', 'Gus', 'Ines'];
  var DRINKS = ['Latte', 'Iced latte', 'Cappuccino', 'Americano', 'Espresso', 'Iced Americano', 'Chai latte', 'Drip coffee'];
  var FOOD = ['Josie bagel', 'Avocado toast', 'Full plate', 'Pancakes'];

  /* ───────── the scenarios: [{ t seconds, say, do, ... }] ───────── */
  function rush(seed, n, span, foodShare, onlineShare, extras) {
    var r = rng(seed), ev = [], i, t, items, nm;
    for (i = 0; i < n; i++) {
      t = Math.round(i * span / n + r() * span / n * .8);
      items = [[pick(r, DRINKS), 1]]; if (r() < .25) { items.push([pick(r, DRINKS), 1]); }
      if (r() < foodShare) { items.push([pick(r, FOOD), 1]); }
      nm = NAMES[i % NAMES.length];
      if (r() < onlineShare) { ev.push({ t: t, kind: 'online', name: nm, type: r() < .5 ? 'togo' : 'here', items: items, say: nm + ' orders on the website' }); }
      else { ev.push({ t: t, kind: 'order', who: nm, type: r() < .72 ? 'here' : 'togo', items: items, pay: r() < .85 ? 'now' : 'later', say: nm + ' at the register: ' + items.map(function (x) { return x[0]; }).join(', ') }); }
    }
    return ev.concat(extras || []);
  }
  var SCENARIOS = [
    { id: 'one', title: 'One order, start to finish', blurb: 'A guest orders online, someone at the register orders, then adds a pastry. Watch the phone buzz and the map light up.', bar: 1, kitchen: 1,
      build: function () { return [
        { t: 0, kind: 'online', name: 'Dani', type: 'togo', items: [['Latte', 1], ['Josie bagel', 1]], say: 'Dani orders a latte and a bagel on the website' },
        { t: 14, kind: 'order', key: 'ana', who: 'Ana', type: 'here', items: [['Cappuccino', 1], ['Avocado toast', 1]], pay: 'now', say: 'Ana orders at the register and takes stick 1' },
        { t: 40, kind: 'addon', ref: 'ana', who: 'Ana', items: [['Croissant', 1]], say: 'Ana adds a croissant: it goes to the bar as an add-on' },
        { t: 70, kind: 'say', say: 'Everyone is being made. The cashier is the runner: no buttons for the bar or kitchen.' }
      ]; } },
    { id: 'morning', title: 'Morning rush', blurb: 'Twenty-six orders in six minutes, mostly drinks, a few online. One person on the bar, one in the kitchen.', bar: 1, kitchen: 1,
      build: function () { return rush(7, 26, 360, .35, .15); } },
    { id: 'lunch', title: 'Lunch rush with add-ons', blurb: 'Food heavy. The kitchen is one person. Add-ons arrive, one order is cancelled and re-rung.', bar: 1, kitchen: 1,
      build: function () { return rush(21, 22, 300, .85, .1, [
        { t: 80, kind: 'order', key: 'a1', who: 'Pablo', type: 'here', items: [['Full plate', 1], ['Latte', 1]], pay: 'now', say: 'Pablo orders a full plate and a latte' },
        { t: 130, kind: 'addon', ref: 'a1', who: 'Pablo', items: [['Pancakes', 1]], say: 'Pablo adds pancakes' },
        { t: 150, kind: 'order', key: 'x1', who: 'Rita', type: 'here', items: [['Full plate', 1]], pay: 'now', say: 'Rita orders a full plate' },
        { t: 175, kind: 'cancel', ref: 'x1', say: 'Rita changes her mind: the order is cancelled' },
        { t: 180, kind: 'order', who: 'Rita', type: 'here', items: [['Avocado toast', 1]], pay: 'now', say: 'Rita orders again, avocado toast' }
      ]); } },
    { id: 'milk', title: 'Fringe: out of milk mid-rush', blurb: 'The morning rush, and at 1:30 the milk light goes red. Dishes with milk adapt or are refused; at 3:00 the milk is back.', bar: 1, kitchen: 1,
      build: function () { return rush(11, 22, 300, .3, .25, [
        { t: 90, kind: 'light', ing: 'Milk', light: 'red', say: 'The bar sets milk to Out' },
        { t: 180, kind: 'light', ing: 'Milk', light: 'green', say: 'Milk is back' }
      ]); } },
    { id: 'odd', title: 'Fringe: odd things guests and staff do', blurb: 'Double payments, a taken stick, finishing an unpaid order, undoing, a huge pastry order, an ordering mix-up. Each answer is shown.', bar: 1, kitchen: 1,
      build: function () { return [
        { t: 0, kind: 'order', key: 'p', who: 'Test', type: 'here', items: [['Latte', 1], ['Josie bagel', 1]], pay: 'later', say: 'An order on pay-later with stick 1' },
        { t: 8, kind: 'probe', name: 'finish before paying', say: 'The cashier tries to finish it before it is paid',
          run: function (x) { return x.call('complete_number', { p: { order_ids: [x.id('p')], at: new Date().toISOString() } }).then(function (r) { return r && r.ok === false ? 'refused politely: unpaid' : 'went through (unexpected)'; }); } },
        { t: 14, kind: 'probe', name: 'pay twice', say: 'The cashier takes the payment twice',
          run: function (x) { var amt = x.total('p'); return x.call('pay_orders', { p: { payments: [{ id: x.uuid(), order_id: x.id('p'), method: 'cash_hnl', amount: amt }] } }).then(function () { return x.call('pay_orders', { p: { payments: [{ id: x.uuid(), order_id: x.id('p'), method: 'cash_hnl', amount: amt }] } }); }).then(function () { return x.q("select count(*)::int c, coalesce(sum(amount),0)::numeric s from payments where order_id = $1", [x.id('p')]).then(function (r) { return r[0].c === 1 ? 'counted once' : 'counted ' + r[0].c + ' times, L' + r[0].s; }); }); } },
        { t: 22, kind: 'probe', name: 'a stick that is taken', say: 'Someone places a stick that is already on a table',
          run: function (x) { return x.q("select state, table_id from sticks where number = $1", [x.stick('p')]).then(function (r) { return x.call('place_stick', { p: { stick: x.stick('p'), table_id: x.freeTable() } }).then(function () { return 'moved it'; }); }).catch(function (e) { return 'refused: ' + String(e.message).slice(0, 60); }); } },
        { t: 30, kind: 'probe', name: 'a huge pastry order', say: 'A guest asks for 40 croissants',
          run: function (x) { return x.online('Giant', [['Croissant', 40]]).then(function (o) { return 'accepted'; }).catch(function (e) { return /unavailable|stock|limit/i.test(e.message) ? 'refused politely (not enough in the dome)' : 'error: ' + String(e.message).slice(0, 70); }); } },
        { t: 40, kind: 'probe', name: 'ordering with the café closed', say: 'Online ordering is paused, a guest tries anyway',
          run: function (x) { return x.q("update settings set online_orders = false").then(function () { return x.online('Late', [['Latte', 1]]); }).then(function () { return 'accepted (unexpected)'; }).catch(function (e) { return /paused/.test(e.message) ? 'refused: orders paused' : 'error: ' + String(e.message).slice(0, 70); }).then(function (m) { return x.q("update settings set online_orders = true").then(function () { return m; }); }); } },
        { t: 60, kind: 'say', say: 'Finishing up: the first order is paid, brought out and its stick returns to the pot.' }
      ]; } }
  ];
  Sc.list = SCENARIOS;

  /* ───────── the engine ───────── */
  function makeRun(def, opts) {
    opts = opts || {};
    var R = { def: def, sim: 0, speed: opts.speed || 3, paused: false, log: [], errors: [], notes: [], orders: {}, byKey: {}, queue: [], done: false, fast: !!opts.fast, onTick: opts.onTick || null, onEnd: opts.onEnd || null };
    var cat = {}, tables = [], ingredients = {}, rnum = 100, sticks = {}, token = null, free = { bar: [], kitchen: [] }, samples = [], peak = { bar: 0, kitchen: 0, open: 0, waiting: 0, unpaid: 0 }, i;
    for (i = 0; i < (def.bar || 1); i++) { free.bar.push(0); }
    for (i = 0; i < (def.kitchen || 1); i++) { free.kitchen.push(0); }

    function uuid() { return JC.uuid(); }
    function say(m, tone) { R.log.push({ t: R.sim, m: m, tone: tone || '' }); if (R.onTick) { R.onTick(R); } }
    function fail(m) { R.errors.push({ t: R.sim, m: m }); say('✗ ' + m, 'bad'); }
    function lookup() {
      return P.q("select i.id, i.name->>'en' as n, i.price, c.station, coalesce(c.counted, false) as counted from items i join categories c on c.id = i.category_id where i.active").then(function (rows) {
        rows.forEach(function (x) { cat[x.n] = x; });
        return P.q('select id, label from tables order by label');
      }).then(function (t) { tables = t.map(function (x) { return { id: x.id, label: x.label, used: false }; }); return P.q("select id, name->>'en' as n from ingredients"); })
        .then(function (g) { g.forEach(function (x) { ingredients[x.n] = x.id; }); return P.q("select id from people where name = 'Rosa'"); })
        .then(function (p) { return P.call('sign_in', { p_person: p[0].id, p_pin: '1234', p_device: 'S' }); })
        .then(function (r) { token = r.token; });
    }
    function freeStick() { var n; for (n = 1; n <= 24; n++) { if (!sticks[n]) { sticks[n] = true; return n; } } return null; }
    function freeTable() { var j; for (j = 0; j < tables.length; j++) { if (!tables[j].used) { return tables[j].id; } } return null; }
    function takeTable() { var j; for (j = 0; j < tables.length; j++) { if (!tables[j].used) { tables[j].used = true; return tables[j]; } } return null; }

    /* the maker model: a first-in first-out line per station; the order is ready when its slowest station is */
    function schedule(o) {
      var ready = R.sim;
      Object.keys(o.secs).forEach(function (st) {
        var arr = free[st], k = 0, j;
        for (j = 1; j < arr.length; j++) { if (arr[j] < arr[k]) { k = j; } }
        var start = Math.max(R.sim, arr[k]); arr[k] = start + o.secs[st]; o.stationReady[st] = arr[k]; o.stationStart[st] = start;
        if (arr[k] > ready) { ready = arr[k]; }
      });
      o.readyAt = ready;
    }
    function queueDepth(st) { var n = 0; Object.keys(R.orders).forEach(function (k) { var o = R.orders[k]; if (!o.cancelled && !o.finished && o.stationReady[st] && o.stationReady[st] > R.sim && o.placedAt <= R.sim) { n += 1; } }); return n; }
    R.queueDepth = queueDepth;
    function openCount() { var n = 0; Object.keys(R.orders).forEach(function (k) { var o = R.orders[k]; if (!o.cancelled && !o.finished) { n += 1; } }); return n; }
    R.openCount = openCount;

    function build(e, addon, ref) {
      var oid = uuid(), pieces = [], pmap = {}, items = [], sub = 0, has = { bar: false, kitchen: false }, secs = {}, okAll = true;
      e.items.forEach(function (x) {
        var it = cat[x[0]]; if (!it) { okAll = false; return; }
        var stn = it.station === 'kitchen' ? 'kitchen' : 'bar';
        if (!pmap[stn]) { pmap[stn] = uuid(); pieces.push({ id: pmap[stn], station: stn, kind: addon ? 'addon' : 'original' }); }
        has[stn] = true; secs[stn] = (secs[stn] || 0) + serviceSecs(it) * x[1]; sub += Number(it.price) * x[1];
        items.push({ id: uuid(), item_id: it.id, name: x[0], qty: x[1], unit_price: Number(it.price), station: stn, piece_id: pmap[stn], chips: [] });
      });
      return okAll ? { id: oid, pieces: pieces, items: items, total: sub, has: has, secs: secs } : null;
    }
    function record(e, b, extra) {
      var o = { id: b.id, who: e.who || e.name, kind: e.kind, key: e.key, total: b.total, secs: b.secs, stationReady: {}, stationStart: {}, placedAt: R.sim, paid: false, finished: false, cancelled: false, stick: extra.stick || null, pay: extra.pay };
      R.orders[b.id] = o; if (e.key) { R.byKey[e.key] = o; }
      schedule(o);
      var fin = o.readyAt + (e.kind === 'online' ? PICKUP : RUNNER) + (extra.pay === 'later' || e.kind === 'online' ? 2 : 0);
      insert({ t: fin, kind: 'finish', id: b.id, say: null });
      return o;
    }
    function insert(e) { var j = 0; while (j < R.queue.length && R.queue[j].t <= e.t) { j++; } R.queue.splice(j, 0, e); }

    var X = { call: P.call, q: P.q, uuid: uuid, id: function (k) { return R.byKey[k].id; }, total: function (k) { return R.byKey[k].total; }, stick: function (k) { return R.byKey[k].stick; }, freeTable: freeTable,
      online: function (name, items) {
        var ls = [], j; for (j = 0; j < items.length; j++) { ls.push({ item_id: cat[items[j][0]].id, qty: items[j][1] }); }
        return P.call('place_online_order2', { p: { id: uuid(), name: name, order_type: 'togo', lines: ls } }, false);
      } };

    function exec(e) {
      var b, o, stk, now = new Date().toISOString();
      if (e.say) { say(e.say); }
      if (e.kind === 'say') { return Promise.resolve(); }
      if (e.kind === 'order' || e.kind === 'addon') {
        b = build(e, e.kind === 'addon'); if (!b) { fail('unknown dish in ' + e.say); return Promise.resolve(); }
        var base = e.kind === 'addon' ? R.byKey[e.ref] : null;
        stk = e.kind === 'addon' ? (base && base.stick) : (e.type === 'here' ? freeStick() : null);
        rnum += 1;
        var order = { id: b.id, device: 'A', number: e.kind === 'addon' && base ? String(base.num) + '+' : String(rnum), customer_name: e.who, order_type: e.type || 'here', status: e.pay === 'now' ? 'paid' : 'open', subtotal: b.total, total: b.total, tax: 0, staff_name: 'Rosa', created_at: now, paid_at: e.pay === 'now' ? now : null, has_bar: b.has.bar, has_kitchen: b.has.kitchen, stick_number: stk };
        var payload = { order: order, pieces: b.pieces, items: b.items }; if (e.pay === 'now') { payload.payments = [{ id: uuid(), method: 'cash_hnl', amount: b.total }]; }
        return P.call('sync_order2', { p: payload }).then(function () {
          o = record(e, b, { stick: stk, pay: e.kind === 'addon' ? 'later' : e.pay }); o.num = rnum; o.paid = e.pay === 'now';
          if (e.kind === 'addon' && base) { o.num = base.num; }
          if (stk && e.kind === 'order') { var tb = takeTable(); o.table = tb; if (e.type === 'here') { return P.call('place_stick', { p: { stick: stk, table_id: tb ? tb.id : null } }); } }
        });
      }
      if (e.kind === 'online') {
        b = build(e, false); if (!b) { fail('unknown dish in ' + e.say); return Promise.resolve(); }
        return P.call('place_online_order2', { p: { id: b.id, name: e.name, order_type: e.type || 'togo', lines: e.items.map(function (x) { return { item_id: cat[x[0]].id, qty: x[1] }; }) } }, false).then(function () { record(e, b, { pay: 'online' }); }).catch(function (er) {
          if (/unavailable|stock|paused|closed|limit|too_many/i.test(er.message)) { say('· ' + e.name + ': refused politely (' + String(er.message).replace(/^.*?:/, '').slice(0, 50) + ')', 'warn'); R.refused = (R.refused || 0) + 1; } else { fail(er.message); }
        });
      }
      if (e.kind === 'finish') {
        o = R.orders[e.id]; if (!o || o.cancelled || o.finished) { return Promise.resolve(); }
        var pay = o.paid ? Promise.resolve() : P.call('pay_orders', { p: { payments: [{ id: uuid(), order_id: o.id, method: 'cash_hnl', amount: o.total }] } }).then(function () { o.paid = true; });
        return pay.then(function () { return P.call('complete_number', { p: { order_ids: [o.id], at: now } }); }).then(function (r) {
          if (r && r.ok === false) { fail('could not finish ' + o.who + ': ' + JSON.stringify(r)); return; }
          o.finished = true; o.doneAt = R.sim; if (o.stick) { delete sticks[o.stick]; } if (o.table) { o.table.used = false; }
        });
      }
      if (e.kind === 'light') {
        if (!ingredients[e.ing]) { fail('no ingredient ' + e.ing); return Promise.resolve(); }
        return P.call('set_light', { p_token: token, p_ingredient: ingredients[e.ing], p_light: e.light });
      }
      if (e.kind === 'cancel') {
        o = R.byKey[e.ref]; if (!o) { return Promise.resolve(); }
        return P.call('cancel_order', { p: { order_id: o.id, at: now } }).then(function () { o.cancelled = true; if (o.stick) { delete sticks[o.stick]; } if (o.table) { o.table.used = false; } });
      }
      if (e.kind === 'probe') {
        return e.run(X).then(function (msg) { say('→ ' + e.name + ': ' + msg, /unexpected|error/.test(msg) ? 'bad' : 'ok'); R.probes = (R.probes || []).concat([{ name: e.name, result: msg }]); if (/unexpected|error/.test(msg)) { R.errors.push({ t: R.sim, m: e.name + ': ' + msg }); } });
      }
      return Promise.resolve();
    }

    /* what the room looks like right now: the numbers behind the report */
    function sample() {
      var s = { t: R.sim, bar: queueDepth('bar'), kitchen: queueDepth('kitchen'), open: openCount() };
      return P.q("select count(*) filter (where state = 'waiting')::int w from sticks").then(function (r) { s.waiting = r[0].w; }).catch(function () { s.waiting = 0; }).then(function () {
        s.unpaid = Object.keys(R.orders).filter(function (k) { var o = R.orders[k]; return !o.paid && !o.cancelled && !o.finished; }).length;
        samples.push(s); ['bar', 'kitchen', 'open', 'waiting', 'unpaid'].forEach(function (k) { if (s[k] > peak[k]) { peak[k] = s[k]; } }); return s;
      });
    }
    R.sample = function () { return samples[samples.length - 1] || { bar: 0, kitchen: 0, open: 0, waiting: 0 }; };

    function report() {
      var waits = [], worst = null, fin = 0, tot = 0, avg = 0, p90 = 0, dur = R.sim;
      Object.keys(R.orders).forEach(function (k) { var o = R.orders[k]; tot += 1; if (o.finished) { fin += 1; var wt = o.doneAt - o.placedAt; waits.push(wt); if (!worst || wt > worst.wait) { worst = { who: o.who, wait: wt, kind: o.kind }; } } });
      waits.sort(function (a, b) { return a - b; }); if (waits.length) { avg = waits.reduce(function (a, b) { return a + b; }, 0) / waits.length; p90 = waits[Math.floor(waits.length * .9)]; }
      var busy = { bar: 0, kitchen: 0 }; Object.keys(R.orders).forEach(function (k) { var o = R.orders[k]; if (!o.cancelled) { Object.keys(o.secs).forEach(function (st) { busy[st] += o.secs[st]; }); } });
      var util = { bar: busy.bar / (dur * (def.bar || 1) || 1), kitchen: busy.kitchen / (dur * (def.kitchen || 1) || 1) };
      var notes = [], lead = peak.kitchen > peak.bar ? 'kitchen' : 'bar';
      if (Math.max(peak.bar, peak.kitchen) >= 5) { notes.push('The ' + lead + ' is the bottleneck: up to ' + peak[lead] + ' orders waiting on it at once' + (worst ? ', and the longest wait was ' + mmss(worst.wait) + ' (' + worst.who + ')' : '') + '.'); }
      else if (Math.max(peak.bar, peak.kitchen) >= 3) { notes.push('The ' + lead + ' got busy (' + peak[lead] + ' waiting at the peak) but kept up.'); }
      else { notes.push('Nothing backed up: at most ' + Math.max(peak.bar, peak.kitchen) + ' waiting on any station.'); }
      if (avg > 240) { notes.push('Guests waited ' + mmss(avg) + ' on average, which is long.'); }
      if (peak.waiting >= 4) { notes.push('Up to ' + peak.waiting + ' sticks sat in the waiting pot at once: placing them on tables lagged behind.'); }
      if (util.kitchen > .9) { notes.push('The kitchen was busy ' + Math.round(util.kitchen * 100) + '% of the time: a second pair of hands would help.'); }
      if (util.bar > .9) { notes.push('The bar was busy ' + Math.round(util.bar * 100) + '% of the time: a second pair of hands would help.'); }
      if (R.refused) { notes.push(R.refused + ' online order' + (R.refused > 1 ? 's were' : ' was') + ' refused politely (out of something, or closed).'); }
      if (R.errors.length) { notes.push(R.errors.length + ' thing' + (R.errors.length > 1 ? 's' : '') + ' went wrong: ' + R.errors.slice(0, 3).map(function (e) { return e.m; }).join(' · ')); }
      return { scenario: def.id, title: def.title, simSeconds: Math.round(dur), orders: tot, finished: fin, avgWait: Math.round(avg), p90Wait: Math.round(p90), worst: worst, peak: peak, utilisation: { bar: +util.bar.toFixed(2), kitchen: +util.kitchen.toFixed(2) }, probes: R.probes || [], errors: R.errors, refused: R.refused || 0, notes: notes, log: R.log };
    }
    function mmss(s) { s = Math.round(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    R.mmss = mmss;

    /* run: live (timers, speed, pause, step) or fast (as quickly as it goes) */
    var evs = def.build(), busy = false;
    evs.forEach(function (e) { insert(e); });
    R.total = evs.length;
    function finish() { if (R.done) { return; } R.done = true; R.stop(); R.report = report(); if (R.onEnd) { R.onEnd(R.report); } if (R.resolve) { R.resolve(R.report); } }
    function pump(limit) {   // run every event due up to sim time `limit`
      if (busy) { return Promise.resolve(); }
      busy = true;
      function next() {
        if (R.paused && !R.stepping) { busy = false; return Promise.resolve(); }
        var e = R.queue[0];
        if (!e || e.t > limit) { busy = false; return Promise.resolve(); }
        R.queue.shift(); R.sim = e.t;
        return exec(e).catch(function (er) { fail((er && er.message) || String(er)); }).then(function () { return sample(); }).then(function () { if (R.onTick) { R.onTick(R); } if (R.stepping) { R.stepping = false; R.paused = true; busy = false; return; } return next(); });
      }
      return next();
    }
    R.start = function () {
      return lookup().then(function () {
        if (R.fast) {
          return new Promise(function (resolve) { R.resolve = resolve; pump(1e9).then(function () { R.sim = Math.max(R.sim, 0); finish(); }); });
        }
        return new Promise(function (resolve) {
          R.resolve = resolve;
          R.timer = w.setInterval(function () {
            if (R.paused || R.done) { return; }
            var target = R.sim + 0.25 * R.speed;
            pump(target).then(function () {
              if (!R.queue.length) { finish(); return; }
              if (!busy) { R.sim = Math.max(R.sim, Math.min(target, R.queue[0].t)); }
              if (R.onTick) { R.onTick(R); }
            });
          }, 250);
        });
      });
    };
    R.stop = function () { if (R.timer) { w.clearInterval(R.timer); R.timer = null; } };
    R.pause = function () { R.paused = true; if (R.onTick) { R.onTick(R); } };
    R.resume = function () { R.paused = false; if (R.onTick) { R.onTick(R); } };
    R.step = function () { R.paused = true; R.stepping = true; var e = R.queue[0]; if (e) { pump(e.t); } };
    return R;
  }

  /* ───────── public: run one (headless or live) ───────── */
  Sc.get = function (id) { var i; for (i = 0; i < SCENARIOS.length; i++) { if (SCENARIOS[i].id === id) { return SCENARIOS[i]; } } return null; };
  Sc.run = function (id, opts) {
    var def = Sc.get(id); if (!def) { return Promise.reject(new Error('no scenario ' + id)); }
    return P.ready().then(function () { if (Sc.current) { Sc.current.stop(); } var r = makeRun(def, opts); Sc.current = r; return r.start(); });
  };
  Sc.runAll = function (opts) {
    var out = [], i = 0;
    function nxt() { if (i >= SCENARIOS.length) { return Promise.resolve(out); } var id = SCENARIOS[i++].id; return Sc.run(id, opts).then(function (r) { out.push(r); return nxt(); }); }
    return nxt();
  };

  /* ───────── the little control panel ───────── */
  function el(tag, css, html) { var e = d.createElement(tag); if (css) { e.setAttribute('style', css); } if (html !== undefined) { e.innerHTML = html; } return e; }
  function esc(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  var panel = null, pill = null, listEl = null, hud = null, speed = 3, watching = false;
  var F = 'font-family:Baloo 2,Nunito,system-ui,sans-serif;';
  function ui() {
    if (pill) { return; }
    pill = el('button', 'position:fixed;left:140px;bottom:10px;z-index:85;padding:9px 16px;border-radius:22px;background:#fff;color:#B55573;font-weight:800;font-size:15px;box-shadow:0 0 0 3px #F5B5C8,0 4px 14px rgba(142,63,89,.25);' + F, '🎬 Scenarios');
    pill.type = 'button'; d.body.appendChild(pill);
    listEl = el('div', 'position:fixed;left:10px;bottom:58px;z-index:86;width:330px;max-width:calc(100vw - 20px);max-height:70vh;overflow:auto;background:#fff;border-radius:24px;padding:14px;box-shadow:0 0 0 3px #F5B5C8,0 14px 36px rgba(142,63,89,.35);display:none;' + F);
    d.body.appendChild(listEl);
    pill.addEventListener('click', function () { listEl.style.display = listEl.style.display === 'none' ? 'block' : 'none'; drawList(); });
  }
  function drawList() {
    var h = '<b style="display:block;font-size:19px;color:#5B3843;margin-bottom:6px">Watch the café run</b><span style="display:block;color:#86606B;font:700 13px/1.35 Nunito,system-ui,sans-serif;margin-bottom:8px">Pick one. Open the Overview, the bar phone or the guest window to follow along.</span>', i, s;
    for (i = 0; i < SCENARIOS.length; i++) { s = SCENARIOS[i]; h += '<button type="button" data-sc="' + s.id + '" style="display:block;width:100%;text-align:left;padding:10px 12px;margin:5px 0;border-radius:16px;background:#FDEDF1;color:#B55573;font-weight:800;font-size:16px">' + esc(s.title) + '<small style="display:block;font:700 12.5px/1.3 Nunito,system-ui,sans-serif;color:#86606B;margin-top:2px">' + esc(s.blurb) + '</small></button>'; }
    h += '<div style="color:#86606B;font:700 12px/1.3 Nunito,system-ui,sans-serif;margin-top:8px">Speed <span id="scsp"></span></div>';
    listEl.innerHTML = h;
    listEl.querySelectorAll('[data-sc]').forEach(function (b) { b.addEventListener('click', function () { listEl.style.display = 'none'; begin(b.getAttribute('data-sc')); }); });
    var sp = d.getElementById('scsp'), k, ops = [1, 3, 10, 30];
    ops.forEach(function (v) { var bt = el('button', 'margin:4px 6px 0 0;padding:5px 12px;border-radius:14px;font-weight:800;font-size:14px;' + (v === speed ? 'background:#B55573;color:#fff' : 'background:#FDEDF1;color:#B55573'), v + '×'); bt.type = 'button'; bt.addEventListener('click', function () { speed = v; drawList(); }); sp.appendChild(bt); });
  }
  function ensureHud() {
    if (hud) { hud.style.display = 'block'; return hud; }
    hud = el('div', 'position:fixed;left:10px;bottom:58px;z-index:86;width:330px;max-width:calc(100vw - 20px);background:#fff;border-radius:24px;padding:12px 14px;box-shadow:0 0 0 3px #F5B5C8,0 14px 36px rgba(142,63,89,.35);' + F);
    d.body.appendChild(hud); return hud;
  }
  function meter(label, n, max, col) { return '<div style="flex:1;min-width:0"><div style="font:800 11px Nunito,system-ui,sans-serif;color:#86606B;letter-spacing:.04em;text-transform:uppercase">' + label + '</div><div style="height:10px;border-radius:6px;background:#FDEDF1;overflow:hidden;margin-top:2px"><div style="height:10px;width:' + Math.min(100, n / max * 100) + '%;background:' + (n >= 5 ? '#D2455D' : n >= 3 ? '#F2A66B' : col) + ';border-radius:6px"></div></div><b style="font-size:15px;color:#5B3843">' + n + '</b></div>'; }
  function draw(R) {
    var h = ensureHud(), s = R.sample(), last = R.log.slice(-4).reverse(), body, i;
    body = '<div style="display:flex;align-items:center"><b style="flex:1;font-size:16px;color:#5B3843">' + esc(R.def.title) + '</b><span style="font-weight:800;color:#B55573;font-size:15px">' + R.mmss(R.sim) + '</span></div>' +
      '<div style="display:flex;gap:10px;margin:8px 0 6px">' + meter('Bar line', R.queueDepth('bar'), 8, '#5BBF9B') + meter('Kitchen line', R.queueDepth('kitchen'), 8, '#5BBF9B') + meter('Open', R.openCount(), 12, '#B79BE0') + '</div>';
    for (i = 0; i < last.length; i++) { body += '<div style="font:700 13px/1.3 Nunito,system-ui,sans-serif;color:' + (last[i].tone === 'bad' ? '#B0364B' : last[i].tone === 'warn' ? '#8A5A24' : i ? '#86606B' : '#5B3843') + ';margin-top:3px">' + esc(last[i].m) + '</div>'; }
    if (R.done && R.report) {
      body += '<div style="margin-top:8px;padding:8px 10px;border-radius:14px;background:#FDEDF1"><b style="font-size:14px;color:#B55573">What we saw</b>';
      R.report.notes.forEach(function (n) { body += '<div style="font:700 13px/1.35 Nunito,system-ui,sans-serif;color:#5B3843;margin-top:3px">' + esc(n) + '</div>'; });
      body += '<div style="font:700 12px Nunito,system-ui,sans-serif;color:#86606B;margin-top:4px">' + R.report.finished + ' of ' + R.report.orders + ' orders finished · average ' + R.mmss(R.report.avgWait) + ' · longest ' + (R.report.worst ? R.mmss(R.report.worst.wait) : '–') + '</div></div>';
    }
    body += '<div style="display:flex;gap:6px;margin-top:8px">' + (R.done ? '' : '<button type="button" data-a="pp" style="flex:1;padding:8px;border-radius:14px;background:#B55573;color:#fff;font-weight:800">' + (R.paused ? '▶ Play' : '⏸ Pause') + '</button><button type="button" data-a="step" style="padding:8px 14px;border-radius:14px;background:#FDEDF1;color:#B55573;font-weight:800">Step</button>') +
      '<button type="button" data-a="x" style="padding:8px 14px;border-radius:14px;background:#FDEDF1;color:#B55573;font-weight:800">' + (R.done ? 'Close' : 'Stop') + '</button></div>';
    h.innerHTML = body;
    h.querySelectorAll('[data-a]').forEach(function (b) { b.addEventListener('click', function () { var a = b.getAttribute('data-a'); if (a === 'pp') { if (R.paused) { R.resume(); } else { R.pause(); } } else if (a === 'step') { R.step(); } else { R.stop(); R.done = true; Sc.current = null; h.style.display = 'none'; } }); });
  }
  function begin(id) {
    /* watch from the register's Overview unless someone is already signed in */
    var J = w.J2;
    if (J && J.S && !J.S.person) { P.switchTo('Rosa'); }
    w.setTimeout(function () { if (J && J.S && J.S.person) { J.S.tab = J.eff && J.eff() && J.eff().station !== 'register' ? 'overview' : 'overview'; J.changed(); } }, 2500);
    Sc.run(id, { speed: speed, onTick: draw, onEnd: draw });
  }

  /* open straight into one:  /play/app/?scenario=morning&speed=3 */
  var m = /[?&]scenario=([a-z]+)/.exec(w.location.search || ''), sp0 = /[?&]speed=(\d+)/.exec(w.location.search || '');
  P.ready().then(function () { ui(); if (m && Sc.get(m[1])) { if (sp0) { speed = Number(sp0[1]) || 3; } w.setTimeout(function () { begin(m[1]); }, 1200); } });
}(window, document));
