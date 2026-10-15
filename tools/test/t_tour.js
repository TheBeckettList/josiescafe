var H = require('./harness'), seed = require('./seed_floor');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); } } catch (e) {} };
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  var p = await h.page('/pos/', { init: INIT, viewport: { width: 1024, height: 768 } });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1500);
  ok((await p.locator('.tour .tavatar').count()) === 1, 'welcome card shows on first sign-in');
  await p.screenshot({ path: '/tmp/claude-0/shots/tour_1.png' });
  await p.click('[data-act="tourStart"]'); await p.waitForTimeout(500);
  ok((await p.locator('.tcard').count()) === 1 && (await p.locator('.tspot').count()) === 1, 'first step is lit up with a card');
  await p.screenshot({ path: '/tmp/claude-0/shots/tour_2.png' });
  var n = 1; while (await p.locator('[data-act="tourNext"]').count()) { var label = await p.locator('[data-act="tourNext"]').innerText(); await p.click('[data-act="tourNext"]'); await p.waitForTimeout(250); if (label === 'Got it') { break; } n++; if (n > 15) { break; } }
  ok(n >= 5 && (await p.locator('.tcard').count()) === 0, 'walked all ' + n + ' steps and it closed');
  await p.click('.qbtn'); await p.waitForTimeout(400);
  ok((await p.locator('.pickbox').count()) >= 4 && (await p.locator('.pickbar').count()) === 1, 'the ? lights up what can be explained (' + await p.locator('.pickbox').count() + ' boxes)');
  await p.screenshot({ path: '/tmp/claude-0/shots/tour_3.png' });
  var bb = await p.locator('.paybtn').first().boundingBox(); await p.mouse.click(bb.x + 20, bb.y + 10); await p.waitForTimeout(400);
  ok((await p.locator('.tdots i').count()) === 2, 'tapping Pay explains just Pay (2 steps)');
  await p.screenshot({ path: '/tmp/claude-0/shots/tour_4.png' });
  await p.click('[data-act="tourClose"]'); await p.waitForTimeout(300);
  await p.click('.qbtn'); await p.waitForTimeout(300);
  bb = await p.locator('.tile').first().boundingBox(); await p.mouse.click(bb.x + 20, bb.y + 20); await p.waitForTimeout(400);
  ok((await p.locator('.tdots i').count()) === 3, 'tapping a dish explains dishes (3 steps)');
  await p.click('[data-act="tourClose"]'); await p.waitForTimeout(300);
  await p.click('.qbtn'); await p.click('.pickbar [data-act="tourGo"]'); await p.waitForTimeout(400);
  ok((await p.locator('.tdots i').count()) >= 8, 'Show me everything plays the whole screen');
  await p.click('[data-act="tourClose"]'); await p.waitForTimeout(300);
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(1500); await p.click('.qbtn'); await p.waitForTimeout(300);
  var tb = await p.locator('.hit[data-ov="bar"]').boundingBox(); await p.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2); await p.waitForTimeout(400);
  ok((await p.locator('.tcard b').innerText()) === 'The bar', 'tapping the bar on the map explains the bar');
  await p.screenshot({ path: '/tmp/claude-0/shots/tour_5.png' });
  await p.click('[data-act="tourClose"]'); await p.waitForTimeout(300);
  await p.click('.qbtn'); await p.waitForTimeout(300); tb = await p.locator('.orail').boundingBox(); await p.mouse.click(tb.x + tb.width - 6, tb.y + 6); await p.waitForTimeout(400);
  console.log('rail tap ->', await p.locator('.tcard b').allInnerTexts());
  await p.click('[data-act="tourClose"]'); await p.click('.tab:has-text("Manager")'); await p.waitForTimeout(1500); await p.click('.qbtn'); await p.waitForTimeout(300);
  ok((await p.locator('.pickbox').count()) >= 3, 'manager has boxes to tap');
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
