var H = require('./harness'), seed = require('./seed_floor');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); } } catch (e) {} };
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  var p = await h.page('/pos/?setup', { init: INIT, viewport: { width: 1180, height: 820 } });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1500);
  ok((await p.locator('.sgcard').count()) === 11, 'the 5-minute guide opens from the link with 10 bites');
  await p.screenshot({ path: '/tmp/claude-0/shots/sg_home.png' });
  var names = ['pin', 'hours', 'menu', 'shelf', 'pastries', 'tables', 'register', 'team', 'phones', 'day', 'ask'];
  for (var n = 0; n < names.length; n++) {
    await p.click('.sgcard[data-arg="' + names[n] + '"]'); await p.waitForTimeout(500);
    var steps = await p.locator('.tdots i').count(), i = 0;
    await p.screenshot({ path: '/tmp/claude-0/shots/sg_' + names[n] + '.png' });
    while (await p.locator('[data-act="tourNext"]').count()) { var lab = await p.locator('[data-act="tourNext"]').innerText(); await p.click('[data-act="tourNext"]'); await p.waitForTimeout(450); i++; if (i > 8) break; if (i === 2) await p.screenshot({ path: '/tmp/claude-0/shots/sg_' + names[n] + '2.png' }); }
    ok((await p.locator('.sgcard').count()) === 11, names[n] + ': ' + steps + ' steps, back at the guide');
  }
  ok((await p.locator('.sgcard.done').count()) === 11, 'all bites ticked');
  await p.click('[data-act="setupClose"]'); await p.waitForTimeout(500);
  ok((await p.locator('.sgcard').count()) === 0, 'Not now returns to the app');
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
