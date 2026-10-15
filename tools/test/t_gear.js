var H = require('./harness'), shim = require('./shim');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
(async function () {
  var h = await H.start({ reset: true });
  var p = await h.page('/pos2/', { init: INIT, viewport: { width: 1024, height: 768 } });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1200);
  if (await p.locator('[data-act="tourClose"]').count()) { await p.click('[data-act="tourClose"] >> nth=0'); }
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(1500);
  await p.click('.hit[data-arg="menu"] >> nth=0'); await p.waitForTimeout(600);
  await p.click('.mrow[data-arg] >> nth=3'); await p.waitForTimeout(600);
  var title = await p.locator('.pop').innerText(); console.log('dish popup:', title.replace(/\n+/g, ' | ').slice(0, 160));
  await p.click('[data-act="ovGear"]'); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/claude-0/shots/gear_dish.png' });
  console.log('gear:', (await p.locator('.pop').innerText()).replace(/\n+/g, ' | ').slice(0, 300));
  var open = p.locator('[data-act="pkOpen"]'); ok((await open.count()) >= 1, 'has "add ingredients" button');
  await open.first().click(); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/claude-0/shots/gear_pick.png' });
  var tiles = await p.locator('[data-act="pkToggle"]').count(); ok(tiles > 10, 'ingredient checklist (' + tiles + ')');
  var before = shim.psql("select count(*) from dish_ingredients").out;
  await p.locator('[data-act="pkToggle"] >> nth=2').click(); await p.waitForTimeout(200);
  await p.click('[data-act="pkDone"]'); await p.waitForTimeout(2000);
  var after = shim.psql("select count(*) from dish_ingredients").out;
  console.log('dish_ingredients', before, '->', after); ok(before !== after, 'Done saved the checklist');
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 700)); process.exit(1); });
