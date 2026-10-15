var H = require('./harness'), shim = require('./shim'), seed = require('./seed_floor');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  shim.psql("update items set active=false, price=0, stock=0 where name->>'en' = 'Key lime pie'; update items set active=true, price=60, stock=5 where name->>'en' = 'Brownie'");
  var p = await h.page('/pos/', { init: INIT, viewport: { width: 1280, height: 900 } });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1500); if (await p.locator('[data-act="tourClose"]').count()) { await p.click('[data-act="tourClose"] >> nth=0'); }
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(2000);
  await p.click('.hit[data-ov="pastries"]'); await p.waitForTimeout(500);
  await p.click('[data-act="ovGear"]'); await p.waitForTimeout(500);
  var rows = await p.locator('.psetup').count(); ok(rows === 17, 'setup lists all 17 pastries (' + rows + ')');
  await p.screenshot({ path: '/tmp/claude-0/shots/pastry_setup.png' });
  p.on('dialog', function (d) { console.log('dialog:', d.message()); d.accept(); });
  var row = p.locator('.psetup:has-text("Key lime pie")');
  await row.locator('.tg').click(); await p.waitForTimeout(300);
  ok((await row.locator('.tg.on').count()) === 0, 'cannot switch on without a price');
  await row.locator('[data-act="pastryPrice"][data-arg$="|5"]').click(); await p.waitForTimeout(400); console.log('after one click', await row.locator('em').innerText(), await row.locator('[data-act="pastryPrice"]').count());
  // writes go through the live REST table (not emulated by the test shim), so the price and switch are checked by hand live
  await p.click('[data-act="ovGear"]'); await p.waitForTimeout(400);
  ok((await p.locator('.prow:has-text("Brownie")').count()) === 1, 'the counting side lists what is on');
  await p.click('[data-act="ovClose"]'); await p.waitForTimeout(300);
  await p.click('.hit[data-ov="fridge"]'); await p.waitForTimeout(500);
  ok((await p.locator('.pop .prow:has-text("Brownie")').count()) === 1, 'inventory popup has a Pastries section');
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 500)); process.exit(1); });
