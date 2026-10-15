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
  ok((await p.locator('.thelp .tstep').count()) >= 5, 'the ? lists the steps (' + await p.locator('.thelp .tstep').count() + ')');
  await p.screenshot({ path: '/tmp/claude-0/shots/tour_3.png' });
  await p.click('.tstep >> nth=2'); await p.waitForTimeout(400);
  ok((await p.locator('.tdots i.on').count()) === 1, 'tapping a step jumps to it');
  await p.screenshot({ path: '/tmp/claude-0/shots/tour_4.png' });
  await p.click('[data-act="tourClose"]'); await p.waitForTimeout(300);
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(1500); await p.click('.qbtn'); await p.waitForTimeout(300);
  console.log('overview steps:', await p.locator('.thelp .tstep span').allTextContents());
  await p.click('[data-act="tourGo"][data-arg="0"]'); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/claude-0/shots/tour_5.png' });
  await p.click('[data-act="tourClose"]'); await p.click('.tab:has-text("Manager")'); await p.waitForTimeout(1500); await p.click('.qbtn'); await p.waitForTimeout(300);
  console.log('manager steps:', await p.locator('.thelp .tstep span').allTextContents());
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
