var H = require('./harness'), seed = require('./seed_floor'), shim = require('./shim');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  var p = await h.page('/pos/', { init: INIT, viewport: { width: 1180, height: 820 } });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1500);
  if (await p.locator('[data-act="tourClose"]').count()) { await p.click('[data-act="tourClose"]'); }
  await p.click('.tab:has-text("Manager")'); await p.waitForTimeout(1500);
  await p.click('[data-act="teamOpen"]'); await p.waitForTimeout(1200);
  var n0 = await p.locator('.teamrow').count(); ok(n0 >= 1, 'team list shows ' + n0 + ' people');
  await p.screenshot({ path: '/tmp/claude-0/shots/team_list.png' });
  await p.click('[data-act="teamEdit"][data-arg="new"]'); await p.waitForTimeout(300);
  await p.click('[data-act="teamSave"]'); await p.waitForTimeout(300);
  ok((await p.locator('.teamform .msg').innerText()).length > 3, 'empty form is refused');
  await p.fill('#tm_name', 'Lucia'); await p.click('[data-arg="station|bar"]'); await p.fill('#tm_rate', '60'); await p.fill('#tm_pin', '4321');
  await p.screenshot({ path: '/tmp/claude-0/shots/team_form.png' });
  await p.click('[data-act="teamSave"]'); await p.waitForTimeout(1500);
  ok((await p.locator('.teamrow').count()) === n0 + 1, 'new person appears');
  ok(/L 60\/h/.test(await p.locator('.teamwrap').innerText()), 'wage shows for Josie');
  var r = shim.psql("select name, role, station, rate from people where name = 'Lucia'"); console.log(String(r).trim());
  await p.click('.teamrow:has-text("Lucia")'); await p.waitForTimeout(300); await p.fill('#tm_rate', '65'); await p.click('[data-act="teamSave"]'); await p.waitForTimeout(1200);
  ok(/L 65\/h/.test(await p.locator('.teamwrap').innerText()), 'wage change saved');
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
