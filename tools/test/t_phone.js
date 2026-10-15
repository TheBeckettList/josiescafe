var H = require('./harness'), shim = require('./shim'), seed = require('./seed_floor');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  var code = shim.psql("select code from ticket_link where id=1").out;
  var p = await h.page('/pos2/tickets/', { viewport: { width: 390, height: 780 }, touch: true, mobile: true, init: function () { try { localStorage.clear(); } catch (e) {} } });
  await p.waitForTimeout(500);
  await p.fill('#code', '000000'); await p.click('button[type=submit]'); await p.waitForTimeout(600);
  ok((await p.locator('.msg').innerText()).indexOf('code') >= 0, 'wrong code is refused');
  await p.fill('#code', code); await p.click('button[type=submit]'); await p.waitForTimeout(1500);
  var n = await p.locator('.tv-card').count(); ok(n >= 1, 'kitchen tickets show (' + n + ')');
  ok((await p.locator('button:has-text("Ready"), button:has-text("Seen")').count()) === 0, 'no Ready/Seen buttons');
  await p.screenshot({ path: '/tmp/claude-0/shots/phone_kitchen.png' });
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 700)); process.exit(1); });
