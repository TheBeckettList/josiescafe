var H = require('./harness'), shim = require('./shim'), seed = require('./seed_floor');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
async function boot(h) {
  var p = await h.page('/pos/', { init: INIT, viewport: { width: 1280, height: 900 } });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1500); if (await p.locator('[data-act="tourClose"]').count()) { await p.click('[data-act="tourClose"] >> nth=0'); }
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(1500);
  return p;
}
(async function () {
  // 1. a rush is on: nothing appears
  var h = await H.start({ reset: true }); seed.seed();
  shim.psql("update ingredients set light_set_at = now() - interval '3 hours'");
  var p = await boot(h);
  await p.click('.vchip:has-text("Bar")'); await p.waitForTimeout(800);
  await p.evaluate(function () { J2.quiet.rules.cool = 0; J2.quiet.rules.coolAfterRush = 0; });
  await p.waitForTimeout(5000);
  ok((await p.locator('.rcard.quiet').count()) === 0, 'no prompt while the bar has tickets');
  await h.stop();
  // 2. quiet: one card, the beans first
  h = await H.start({ reset: true });
  shim.psql("update ingredients set light_set_at = now() - interval '3 hours'");
  p = await boot(h);
  await p.click('.vchip:has-text("Bar")'); await p.waitForTimeout(500);
  await p.evaluate(function () { J2.quiet.reset(); J2.quiet.rules.cool = 0; J2.quiet.rules.coolAfterRush = 0; J2.changed ? 0 : 0; });
  await p.waitForTimeout(5200);
  var card = p.locator('.rcard.quiet'); ok((await card.count()) === 1, 'a quiet bar gets one card');
  var name = await card.locator('.qt b').innerText(); console.log('first card:', name); ok(/bean/i.test(name), 'coffee beans first (the required check)');
  await p.screenshot({ path: '/tmp/claude-0/shots/quiet.png' });
  await p.click('.rcard.quiet .lg.green'); await p.waitForTimeout(1500);
  ok((await p.locator('.rcard.quiet').count()) === 0, 'after answering, nothing more for 20 minutes');
  console.log('beans checked in the database:', shim.psql("select (now() - light_set_at) < interval '1 minute' from ingredients where name->>'en' like 'Coffee beans'").out);
  // later snoozes
  await p.evaluate(function () { var s = JSON.parse(localStorage.getItem('jc.p2.quiet')); s.shown = []; localStorage.setItem('jc.p2.quiet', JSON.stringify(s)); });
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
