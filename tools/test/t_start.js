var H = require('./harness'), seed = require('./seed_floor');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  var p = await h.page('/pos/start/', { viewport: { width: 1180, height: 820 }, init: function () { try { localStorage.clear(); } catch (e) {} } });
  await p.waitForTimeout(1500);
  ok(/setup=start/.test(p.url()), 'the start link lands on /pos/?setup=start');
  ok((await p.locator('#setupForm').count()) === 1 && /Welcome/.test(await p.locator('.setup').innerText()), 'a fresh tablet is welcomed and asked to sign in');
  await p.screenshot({ path: '/tmp/claude-0/shots/start_0.png' });
  await p.fill('#su_email', 'pos@josiescafe.com'); await p.fill('#su_pass', 'x'); await p.click('#setupForm button'); await p.waitForTimeout(1500);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForSelector('.sgcard', { timeout: 15000 });
  ok(/Welcome/.test(await p.locator('.sgbody h1').innerText()), 'then the guided start opens');
  var first = await p.locator('.sgcard b').first().innerText(); ok(first === 'Your PIN', 'first bite is Your PIN (' + first + ')');
  await p.screenshot({ path: '/tmp/claude-0/shots/start_1.png' });
  await p.click('.sgstart'); await p.waitForTimeout(1800);
  ok((await p.locator('.tcard').count()) === 1, 'the PIN bite shows its card');
  await p.screenshot({ path: '/tmp/claude-0/shots/start_2.png' });
  while (await p.locator('[data-act="tourNext"]').count()) { await p.click('[data-act="tourNext"]'); await p.waitForTimeout(400); }
  await p.waitForTimeout(500);
  ok((await p.locator('.sgnext').count()) === 1 && /Hours/.test(await p.locator('.sgnext b').innerText()), 'finishing a bite offers the next one (Hours and the sign)');
  await p.screenshot({ path: '/tmp/claude-0/shots/start_3.png' });
  await p.click('.sgnext'); await p.waitForTimeout(1200);
  ok((await p.locator('.tcard').count()) === 1, 'the next bite starts');
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
