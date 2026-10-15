var H = require('./harness'), shim = require('./shim'), seed = require('./seed_floor');
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  var p = await h.page('/pos2/', { init: INIT, viewport: { width: 1024, height: 768 } });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1200);
  var tour = await p.locator('[data-act="tourClose"]').count(); if (tour) { await p.click('[data-act="tourClose"] >> nth=0'); }
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(2500);
  await p.screenshot({ path: '/tmp/claude-0/shots/ov_map.png' });
  var rails = await p.locator('.orail .rcard h2').allTextContents(); console.log('rail cards:', rails);
  ok((await p.locator('.nrow').count()) >= 3, 'rail lists the numbers (' + await p.locator('.nrow').count() + ' rows)');
  ok((await p.locator('.mk').count()) === 2, 'making bubbles on the bar and the kitchen');
  await p.click('.hit[data-arg="kitchen"] >> nth=0'); await p.waitForTimeout(1200);
  await p.screenshot({ path: '/tmp/claude-0/shots/ov_kitchen.png' });
  ok((await p.locator('.pop .tv-card').count()) >= 1, 'kitchen popup shows ticket cards (' + await p.locator('.pop .tv-card').count() + ')');
  await p.click('.pop [data-act="ovClose"]'); await p.waitForTimeout(300);
  await p.click('.hit[data-arg="bar"] >> nth=0'); await p.waitForTimeout(1200);
  await p.screenshot({ path: '/tmp/claude-0/shots/ov_bar.png' });
  console.log('bar cards:', await p.locator('.pop .tv-card').count(), ' add-on cards:', await p.locator('.pop .tv-card.add').count());
  await p.click('.pop [data-act="ovClose"]'); await p.waitForTimeout(300);
  await p.click('.hit.tbl[data-arg="3"]'); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/claude-0/shots/ov_table3.png' });
  console.log('table 3 popup:', (await p.locator('.pop').innerText()).replace(/\n+/g, ' | ').slice(0, 260));
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
