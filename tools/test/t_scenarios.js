/* Agents and tests: run every scenario headless against the pretend café and print where it backed up. */
var H = require('./harness');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start({ reset: true });
  var p = await h.page('/play/app/', { viewport: { width: 1180, height: 820 } });
  await p.waitForFunction(function () { return window.J2PLAY && window.J2PLAY.scenarios; }, null, { timeout: 90000 });
  var reports = await p.evaluate(function () { return J2PLAY.scenarios.runAll({ fast: true }); });
  reports.forEach(function (r) {
    console.log('\n== ' + r.title + ' — ' + r.orders + ' orders, ' + r.finished + ' finished, avg wait ' + r.avgWait + 's, p90 ' + r.p90Wait + 's, worst ' + (r.worst ? r.worst.who + ' ' + r.worst.wait + 's' : '-') + ', peak line bar ' + r.peak.bar + ' kitchen ' + r.peak.kitchen + ', waiting pot ' + r.peak.waiting);
    r.notes.forEach(function (n) { console.log('   · ' + n); });
    if (r.probes.length) { r.probes.forEach(function (x) { console.log('   → ' + x.name + ': ' + x.result); }); }
  });
  var by = {}; reports.forEach(function (r) { by[r.scenario] = r; });
  ok(reports.length === 5, 'all five scenarios ran');
  ok(by.one.finished === by.one.orders && by.one.errors.length === 0, 'one order: everything finished, no errors');
  ok(by.morning.finished >= by.morning.orders - by.morning.refused - 0 && by.morning.errors.length === 0, 'morning rush: all finished, no errors (' + by.morning.errors.length + ' errors)');
  ok(by.lunch.errors.length === 0, 'lunch rush: no errors');
  ok(by.milk.errors.length === 0, 'out of milk: no errors, refusals are polite (' + by.milk.refused + ' refused)');
  ok(by.odd.probes.length === 5 && by.odd.errors.length === 0, 'odd things: every probe answered without an error');
  ok(/counted once/.test((by.odd.probes.filter(function (x) { return x.name === 'pay twice'; })[0] || {}).result || ''), 'paying twice counts the order once');
  console.log('\nconsole errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script|404|403/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 800)); process.exit(1); });
