var H = require('./harness'), shim = require('./shim'), seed = require('./seed_floor');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  shim.psql("insert into people(name,role,station,pin_hash,rate) values ('Ana','staff','register','x',60)");
  shim.psql("insert into shifts(person_id,in_at,out_at) select id, now()-interval '3 hours', now() from people where name='Ana'");
  var p = await h.page('/pos2/', { init: INIT, viewport: { width: 1024, height: 768 } });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1200);
  if (await p.locator('[data-act="tourClose"]').count()) { await p.click('[data-act="tourClose"] >> nth=0'); }
  await p.click('.tab:has-text("Manager")'); await p.waitForTimeout(2000);
  await p.screenshot({ path: '/tmp/claude-0/shots/mgr.png' });
  ok((await p.locator('.mcard').count()) === 4, 'four stat cards');
  ok((await p.locator('.mloved .lrow').count()) >= 3, 'most loved rows');
  await p.click('[data-act="mgrPay"]'); await p.waitForTimeout(2000);
  await p.screenshot({ path: '/tmp/claude-0/shots/pay.png' });
  console.log('pay rows:', await p.locator('.payrow').count());
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 700)); process.exit(1); });
