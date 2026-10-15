var H = require('./harness'), shim = require('./shim');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'P', mode: 'inventory', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
(async function () {
  var h = await H.start({ reset: true });
  var p = await h.page('/pos2/', { init: INIT, viewport: { width: 390, height: 780 }, touch: true, mobile: true });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1500);
  if (await p.locator('[data-act="tourClose"]').count()) { await p.click('[data-act="tourClose"] >> nth=0'); }
  ok((await p.locator('.itile').count()) > 3, 'inventory tiles (' + await p.locator('.itile').count() + ')');
  await p.click('.itile >> nth=0'); await p.waitForTimeout(300);
  await p.click('.lg.red'); await p.waitForTimeout(1500);
  await p.screenshot({ path: '/tmp/claude-0/shots/phoneinv.png' });
  ok(shim.psql("select count(*) from ingredients where light='red'").out === '1', 'light set to out in the database');
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 700)); process.exit(1); });
