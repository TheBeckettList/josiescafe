/* The light Play engine (play/engine-sim.js) must give the same answers as the real database (play/db.tar.gz, PGlite).
   Run both on the same moves and compare: the seeded café, the website's catalog, the map, the phone tickets, the pushed text, and every scenario's report. */
var H = require('./harness');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
function canon(x) { return JSON.stringify(x, function (k, v) { if (v && typeof v === 'object' && !(v instanceof Array)) { var o = {}; Object.keys(v).sort().forEach(function (q) { o[q] = v[q]; }); return o; } return v; }); }
function norm(x) {   // ids, times and random numbers differ run to run: keep the shape and the words
  return JSON.stringify(x, function (k, v) {
    if (/(^|_)(id|at)$|^(now|clears_at|created_at|completed_at|tag|url)$/.test(k) && typeof v === 'string') { return '·'; }
    if (typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(v)) { return '·'; }
    if ((k === 'lines' || k === 'items') && v instanceof Array && v.length && v[0] && typeof v[0] === 'object' && v[0].name !== undefined && k !== 'items' || (k === 'items' && v instanceof Array && v.length && v[0] && v[0].qty !== undefined)) { return v.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }); }
    if ((k === 'marks' || k === 'chips') && v instanceof Array) { return v.slice().sort(function (a, b) { return canon(a) < canon(b) ? -1 : 1; }); }
    return v;
  });
}
function diff(a, b, path, out) {
  path = path || ''; out = out || [];
  if (out.length > 12) { return out; }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    var ks = {}; Object.keys(a).concat(Object.keys(b)).forEach(function (k) { ks[k] = 1; });
    Object.keys(ks).forEach(function (k) { diff(a[k], b[k], path + '.' + k, out); });
  } else if (JSON.stringify(a) !== JSON.stringify(b)) { out.push(path + ': sim ' + JSON.stringify(a) + ' vs real ' + JSON.stringify(b)); }
  return out;
}
async function snap(p) {
  return p.evaluate(async function () {
    await J2PLAY.ready();
    function call(fn, body, au) { return J2PLAY.handle('POST', '/rest/v1/rpc/' + fn, {}, body, au !== false).then(function (r) { return { s: r.status, j: r.json }; }); }
    var out = {}, people = (await call('people_names', {})).j, rosa = people.filter(function (x) { return x.name === 'Rosa'; })[0], josie = people.filter(function (x) { return x.name === 'Josie'; })[0];
    out.people = people.map(function (x) { return { name: x.name, role: x.role, station: x.station }; });
    var si = (await call('sign_in', { p_person: rosa.id, p_pin: '1234', p_device: 'T' })).j; out.signin = { ok: si.ok, name: si.name, role: si.role, station: si.station, first: si.first_time };
    out.badpin = (await call('sign_in', { p_person: rosa.id, p_pin: '0000', p_device: 'T' })).j;
    out.anonSync = (await call('floor_state', {}, false)).s;
    function sorted(c) { c.items.sort(function (a, b) { return a.id < b.id ? -1 : 1; }); return c; }
    out.site = sorted((await call('site_catalog', { p_lang: 'en' }, false)).j); out.siteEs = sorted((await call('site_catalog', { p_lang: 'es' }, false)).j);
    out.floor = (await call('floor_state', {})).j;
    out.kitchen = (await call('tickets2_pos', { p_station: 'kitchen', p_lang: 'en' })).j; out.bar = (await call('tickets2_pos', { p_station: 'bar', p_lang: 'es' })).j;
    var sj = (await call('sign_in', { p_person: josie.id, p_pin: '1234', p_device: 'T' })).j;
    out.review = (await call('day_review', { p_token: sj.token })).j; out.review.loved.sort(function (a, b) { return b.qty - a.qty || (a.name < b.name ? -1 : 1); });
    out.reviewStaff = (await call('day_review', { p_token: si.token })).s;
    var o = out.floor.open, st = {};
    for (var i = 0; i < o.length; i++) { st[o[i].id] = (await call('order_status2', { p_id: o[i].id, p_lang: 'en' }, false)).j; }
    out.status = Object.keys(st).sort().map(function (k) { return st[k]; }).filter(Boolean);
    out.gate = (await call('online_gate', {}, false)).j;
    // a guest order with chips, then an add-on, then pay and finish: the answers at each step
    var items = out.site.items, byName = {}; items.forEach(function (x) { byName[x.en] = x; });
    var menu = await J2PLAY.eng.menu(); out.siteHas = { latte: !!byName['Latte'], avocado: !!byName['Avocado toast'], croissant: !!byName['Croissant'], menuCroissant: menu.filter(function (x) { return x.n === 'Croissant'; }).length };
    var oid = '11111111-1111-4111-8111-111111111111', av = byName['Avocado toast'], egg = av.ing.filter(function (g) { return g.name === 'Egg'; })[0];
    out.place = (await call('place_online_order2', { p: { id: oid, name: 'Zed', order_type: 'togo', note: 'thanks', lines: [{ item_id: av.id, qty: 2, chips: egg ? [{ type: 'no', ingredient_id: egg.id }] : [] }, { item_id: byName['Latte'].id, qty: 1 }] } }, false));
    out.placeAgain = (await call('place_online_order2', { p: { id: oid, name: 'Zed', order_type: 'togo', lines: [{ item_id: byName['Latte'].id, qty: 1 }] } }, false));
    out.badName = (await call('place_online_order2', { p: { id: '22222222-2222-4222-8222-222222222222', name: ' ', order_type: 'here', lines: [{ item_id: byName['Latte'].id, qty: 1 }] } }, false));
    out.badQty = (await call('place_online_order2', { p: { id: '33333333-3333-4333-8333-333333333333', name: 'Q', order_type: 'here', lines: [{ item_id: byName['Latte'].id, qty: 21 }] } }, false));
    out.empty = (await call('place_online_order2', { p: { id: '44444444-4444-4444-8444-444444444444', name: 'Q', order_type: 'here', lines: [] } }, false));
    out.noItem = (await call('place_online_order2', { p: { id: '55555555-5555-4555-8555-555555555555', name: 'Q', order_type: 'here', lines: [{ item_id: '00000000-0000-4000-8000-000000000000', qty: 1 }] } }, false));
    out.add = (await call('add_to_online_order2', { p: { order_id: oid, lines: [{ item_id: byName['Josie bagel'].id, qty: 2 }] } }, false));
    out.addBad = (await call('add_to_online_order2', { p: { order_id: '66666666-6666-4666-8666-666666666666', lines: [{ item_id: byName['Latte'].id, qty: 1 }] } }, false));
    out.statusZed = (await call('order_status2', { p_id: oid, p_lang: 'en' }, false)).j;
    out.pushK = (await J2PLAY.eng.pushCard(oid, 'kitchen')); out.pushB = (await J2PLAY.eng.pushCard(oid, 'bar'));
    out.t2 = (await call('tickets2_pos', { p_station: 'bar', p_lang: 'en' })).j;
    out.unpaidFinish = (await call('complete_number', { p: { order_ids: [oid] } })).j;
    out.pay = (await call('pay_orders', { p: { payments: [{ id: '77777777-7777-4777-8777-777777777777', order_id: oid, method: 'cash_hnl', amount: out.place.j.total }] } })).j;
    out.pay2 = (await call('pay_orders', { p: { payments: [{ id: '88888888-8888-4888-8888-888888888888', order_id: oid, method: 'cash_hnl', amount: 5 }] } })).j;
    out.finish = (await call('complete_number', { p: { order_ids: [oid] } })).j;
    out.doneFloor = (await call('floor_state', {})).j.done.map(function (d) { return { name: d.name, number: d.number, total: d.total }; });
    out.undo = (await call('undo_complete', { p: { order_ids: [oid], restore: { stick: null } } })).j;
    // lights and dishes
    var ids = await J2PLAY.eng.ingredientIds();
    out.light = (await call('set_light', { p_token: si.token, p_ingredient: ids['Milk'], p_light: 'red' }));
    out.lightBad = (await call('set_light', { p_token: si.token, p_ingredient: ids['Milk'], p_light: 'blue' }));
    var f2 = (await call('floor_state', {})).j; out.dishOutMilk = Object.keys(f2.dish_state).filter(function (k) { return f2.dish_state[k].out; }).length;
    out.siteMilk = (await call('site_catalog', { p_lang: 'en' }, false)).j.items.filter(function (x) { return x.out; }).map(function (x) { return x.en; }).sort();
    out.milkOrder = (await call('place_online_order2', { p: { id: '99999999-9999-4999-8999-999999999999', name: 'M', order_type: 'here', lines: [{ item_id: byName['Latte'].id, qty: 1 }] } }, false));
    await call('set_light', { p_token: si.token, p_ingredient: ids['Milk'], p_light: 'green' });
    out.dishOff = (await call('set_dish_out', { p_token: si.token, p_item: byName['Latte'].id, p_out: true }));
    out.siteOff = (await call('site_catalog', { p_lang: 'en' }, false)).j.items.filter(function (x) { return x.out; }).map(function (x) { return x.en; }).sort();
    await call('set_dish_out', { p_token: si.token, p_item: byName['Latte'].id, p_out: false });
    // stop and cancel
    var fl = (await call('floor_state', {})).j, ln = fl.open.filter(function (x) { return x.name === 'Ana'; })[0].lines[0];
    out.stop = (await call('stop_item', { p: { alert_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', order_id: fl.open.filter(function (x) { return x.name === 'Ana'; })[0].id, order_item_id: ln.id, kind: 'stop' } })).j;
    out.stopCard = await J2PLAY.eng.alertCard('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    out.k2 = (await call('tickets2_pos', { p_station: 'kitchen', p_lang: 'en' })).j;
    out.cancel = (await call('cancel_order', { p: { order_id: fl.open.filter(function (x) { return x.name === 'Luis'; })[0].id } })).j;
    var f3 = (await call('floor_state', {})).j; out.afterCancel = { open: f3.open.map(function (x) { return x.name; }), sticks: f3.sticks.filter(function (s) { return s.state !== 'home'; }).map(function (s) { return s.number + ':' + s.state; }) };
    out.occupied = (await call('place_stick', { p: { stick: 11, table_id: f3.sticks.filter(function (s) { return s.table_id; })[0].table_id } })).j;
    out.tables = (await call('place_stick', { p: { stick: 4, table_id: null } })).j;
    // plain reads the app does
    out.menuRows = await Promise.all(['categories', 'items', 'ingredients', 'diets', 'diet_marks', 'dish_ingredients'].map(function (t) { return J2PLAY.handle('GET', '/rest/v1/' + t, { select: '*' }, null, true).then(function (r) { return [t, r.status, (r.json || []).length]; }); }));
    out.settings = (await J2PLAY.handle('GET', '/rest/v1/settings', { select: 'hours,tax_rate,online_orders' }, null, false)).json;
    return out;
  });
}
(async function () {
  var h = await H.start({ reset: true });
  var sim = await h.page('/play/app/', { viewport: { width: 1100, height: 800 } });
  var real = await h.page('/play/app/?engine=real', { viewport: { width: 1100, height: 800 } });
  await real.waitForFunction(function () { return window.J2PLAY && window.J2PLAY.eng; }, null, { timeout: 120000 });
  await sim.waitForFunction(function () { return window.J2PLAY && window.J2PLAY.eng; }, null, { timeout: 60000 });
  ok(await sim.evaluate(function () { return J2PLAY.engine(); }) === 'sim' && await real.evaluate(function () { return J2PLAY.engine(); }) === 'real', 'one page on each engine');
  var a = await snap(sim), b = await snap(real);
  ['pushK', 'pushB'].forEach(function (k) { [a, b].forEach(function (z) { if (z[k]) { z[k].body = z[k].body.split('\n').sort().join('\n'); } }); });
  var A = JSON.parse(norm(a)), B = JSON.parse(norm(b));
  Object.keys(A).forEach(function (k) {
    var d = diff(A[k], B[k], k);
    ok(d.length === 0, 'same answers: ' + k + (d.length ? '\n    ' + d.join('\n    ') : ''));
  });
  var ra = await sim.evaluate(function () { return J2PLAY.scenarios.runAll({ fast: true }); }), rb = await real.evaluate(function () { return J2PLAY.scenarios.runAll({ fast: true }); });
  ra.forEach(function (r, i) {
    var s = rb[i], same = r.orders === s.orders && r.finished === s.finished && r.errors.length === s.errors.length && r.refused === s.refused && JSON.stringify(r.probes) === JSON.stringify(s.probes) && r.avgWait === s.avgWait && r.peak.bar === s.peak.bar && r.peak.kitchen === s.peak.kitchen;
    ok(same, 'scenario ' + r.scenario + ' reads the same on both (' + r.finished + '/' + r.orders + ', avg ' + r.avgWait + 's vs ' + s.avgWait + 's, refused ' + r.refused + ' vs ' + s.refused + ')');
  });
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 900)); process.exit(1); });
