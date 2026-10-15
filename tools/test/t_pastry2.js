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
  var rows = await p.locator('.ptile.edit').count(); ok(rows === 17, 'setup lists all 17 pastries (' + rows + ')');
  await p.screenshot({ path: '/tmp/claude-0/shots/pastry_setup.png' });
  p.on('dialog', function (d) { console.log('dialog:', d.message()); d.accept(); });
  await p.screenshot({ path: '/tmp/claude-0/shots/pastry_squares.png' });
  await p.click('.ptile.edit:has-text("Key lime pie")'); await p.waitForTimeout(300);
  ok((await p.locator('.picgrid .pic').count()) >= 10, 'editor shows the generic pastry picture set (' + await p.locator('.picgrid .pic').count() + ')');
  await p.screenshot({ path: '/tmp/claude-0/shots/pastry_editor.png' });
  await p.click('[data-act="pastryBack"] >> nth=0'); await p.waitForTimeout(300);
  await p.click('[data-act="ovGear"]'); await p.waitForTimeout(300);
  ok((await p.locator('.pop .ptile').count()) >= 1, 'counting side shows squares');
  await p.click('.hit[data-ov="fridge"]'); await p.waitForTimeout(500);
  ok((await p.locator('.pop .ptile:has-text("Brownie")').count()) === 1, 'inventory popup has the Pastries squares');
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 500)); process.exit(1); });
