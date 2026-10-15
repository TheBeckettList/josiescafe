var H = require('./harness'), shim = require('./shim'), seed = require('./seed_floor');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  shim.psql("update items set active=true, price=60, stock=5, show_online=true where name->>'en' in ('Brownie','Key lime pie')");
  var p = await h.page('/pos/', { init: INIT, viewport: { width: 1280, height: 900 } });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1500); if (await p.locator('[data-act="tourClose"]').count()) { await p.click('[data-act="tourClose"] >> nth=0'); }
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(2200);
  var badge = await p.locator('.hit[data-arg="pastries"] .sbadge').innerText(); ok(/10 left/.test(badge), 'stand status says ' + badge);
  await p.click('.hit[data-arg="pastries"]'); await p.waitForTimeout(500);
  ok((await p.locator('.prow').count()) === 2, 'popup lists the 2 pastries');
  await p.screenshot({ path: '/tmp/claude-0/shots/pastry_pop.png' });
  await p.click('.prow >> nth=0 >> [aria-label="+1"]'); await p.waitForTimeout(1200);
  console.log('stock now:', shim.psql("select string_agg(name->>'en'||'='||stock, ', ') from items where name->>'en' in ('Brownie','Key lime pie')").out);
  await p.click('.prow >> nth=0 >> [aria-label="-1"]'); await p.click('.prow >> nth=0 >> [aria-label="-1"]'); await p.waitForTimeout(1200);
  console.log('after two minus:', shim.psql("select string_agg(name->>'en'||'='||stock, ', ') from items where name->>'en' in ('Brownie','Key lime pie')").out);
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
