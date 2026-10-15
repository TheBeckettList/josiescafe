var H = require('./harness'), shim = require('./shim');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
function pad(n) { return ('0' + n).slice(-2); }
(async function () {
  var h = await H.start({ reset: true });
  var hn = new Date(Date.now() - 6 * 3600 * 1000), m = hn.getUTCHours() * 60 + hn.getUTCMinutes();
  function hhmm(x) { x = (x + 1440) % 1440; return Math.floor(x / 60) + ':' + pad(x % 60); }
  function set(range, cu) {
    var days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], o = {}; days.forEach(function (d) { o[d] = range; });
    shim.psql("update settings set hours='" + JSON.stringify(o) + "', online_cutoff='23:58', online_orders=true, closed_until=" + (cu ? "'" + cu + "'" : 'null'));
  }
  async function pill(label, re) {
    var p = await h.page('/', { viewport: { width: 390, height: 800 }, mobile: true, touch: true }); await p.waitForTimeout(1800);
    var t = await p.locator('.wtop .pill').innerText(); ok(re.test(t), label + '  →  "' + t + '"'); return p;
  }
  var todayIso = hn.toISOString().slice(0, 10);
  set(hhmm(m - 60) + '-' + hhmm(m + 60)); var p1 = await pill('open now', /Open\s*till/);
  await p1.screenshot({ path: '/tmp/claude-0/shots/hours_open.png' });
  set(hhmm(m + 60) + '-' + hhmm(m + 120)); await pill('before opening today', /Closed\s*Opens \d/);
  set('0:00-' + hhmm(m - 30)); await pill('after closing', /Closed\s*Opens tomorrow/);
  set(hhmm(m - 60) + '-' + hhmm(m + 60), todayIso); var p4 = await pill('closed today by hand', /Closed\s*Opens tomorrow/);
  await p4.screenshot({ path: '/tmp/claude-0/shots/hours_closed.png' });
  await p4.click('.wtop .pill'); await p4.waitForTimeout(400); await p4.screenshot({ path: '/tmp/claude-0/shots/hours_sheet.png' });
  ok((await p4.locator('.hweek .hr').count()) === 7 && (await p4.locator('.hweek .hr.today').count()) === 1, 'the sheet lists the week with today marked');
  console.log('errors:', p4.errors.filter(function (e) { return !/ServiceWorker|fetching the script|404/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
