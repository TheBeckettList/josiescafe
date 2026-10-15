var H = require('./harness'), seed = require('./seed_floor');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  var p = await h.page('/pos/', { init: INIT, viewport: { width: 1280, height: 900 } });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1500); if (await p.locator('[data-act="tourClose"]').count()) { await p.click('[data-act="tourClose"] >> nth=0'); }
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(2200);
  await p.screenshot({ path: '/tmp/claude-0/shots/ov_final.png' });
  ok((await p.locator('.vchip').count()) === 5, 'View as chips for Josie');
  ok((await p.locator('.tab:has-text("Manager")').count()) === 1, 'Josie sees the Manager tab');
  await p.click('.vchip:has-text("Bar")'); await p.waitForTimeout(600);
  ok((await p.locator('.tab:has-text("Manager")').count()) === 0, 'viewing as Bar hides the Manager tab');
  ok((await p.locator('.rcard h2:has-text("Right now")').count()) === 0, 'and the manager cards');
  await p.click('.vchip:has-text("Josie")'); await p.waitForTimeout(500);
  ok((await p.locator('.tab:has-text("Manager")').count()) === 1, 'back to Josie');
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
