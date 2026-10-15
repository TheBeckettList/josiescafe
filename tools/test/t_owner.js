var H = require('./harness'), shim = require('./shim');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
(async function () {
  var h = await H.start({ reset: true });
  var tok = 'ab' + Date.now().toString(16) + 'cdef0123456789abcdef01';
  shim.psql("insert into owner_invites (token_hash) values (encode(sha256(convert_to('" + tok + "','UTF8')),'hex'))");
  var c = await h.page('/pos/claim/#' + tok, { viewport: { width: 420, height: 800 }, init: INIT });
  await c.waitForTimeout(800);
  await c.fill('#p1', '123456'); await c.fill('#p2', '123450'); await c.click('button[type=submit]'); await c.waitForTimeout(300);
  ok(/different/.test(await c.locator('#msg').innerText()), 'mismatched PINs are refused');
  await c.fill('#p2', '123456'); await c.click('button[type=submit]'); await c.waitForTimeout(3000);
  console.log('claim page:', (await c.locator('main').innerText()).replace(/\n+/g, ' | ')); ok(/tap the Josie/.test(await c.locator('main').innerText()), 'PIN saved through the one-time link');
  ok((await c.evaluate(function () { return location.hash; })) === '', 'the token is gone from the address bar');
  var c2 = await h.page('/pos/claim/#' + tok, { viewport: { width: 420, height: 800 }, init: INIT }); await c2.waitForTimeout(600);
  await c2.fill('#p1', '654321'); await c2.fill('#p2', '654321'); await c2.click('button[type=submit]'); await c2.waitForTimeout(1200);
  ok(/already used/.test(await c2.locator('#msg').innerText()), 'the link cannot be used twice');
  var p = await h.page('/pos/', { viewport: { width: 1100, height: 800 }, init: INIT }); await p.waitForTimeout(1500);
  ok(!(await p.locator('.person .pn b').allTextContents()).some(function (n) { return n === 'Owner'; }), 'hidden account is not in the name picker');
  for (var i = 0; i < 7; i++) { await p.click('.si-brand'); }
  await p.waitForTimeout(300);
  ok((await p.locator('.pdots .pdot').count()) === 6, 'seven taps on the logo open a 6-digit pad');
  for (var d of '999999') { await p.click('.key[data-arg="' + d + '"]'); }
  await p.waitForTimeout(800); ok(/PIN|wrong|Wrong|try/i.test(await p.locator('.msg').innerText()), 'wrong PIN is refused');
  for (var d2 of '123456') { await p.click('.key[data-arg="' + d2 + '"]'); }
  await p.waitForSelector('.tabs', { timeout: 15000 }); await p.waitForTimeout(800);
  ok((await p.locator('.tab:has-text("Manager")').count()) === 1, 'signed in with owner rights');
  await p.click('.tab:has-text("Manager")'); await p.waitForTimeout(1500); await p.click('[data-act="teamOpen"]'); await p.waitForTimeout(1200);
  ok(!(await p.locator('.teamrow .pn b').allTextContents()).some(function (n) { return n === 'Owner'; }), 'not in Josie’s team list');
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
