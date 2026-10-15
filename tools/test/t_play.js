var H = require('./harness');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start({ reset: true });
  var REAL = { access_token: 'REAL-TOKEN', refresh_token: 'real', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' };
  var p = await h.page('/play/app/', { viewport: { width: 1180, height: 820 }, init: function () { try { if (!localStorage.getItem('jc.pos.session')) { localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'REAL-TOKEN', refresh_token: 'real', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' })); localStorage.setItem('jc.p2.person', JSON.stringify({ name: 'RealPerson', token: 'real' })); } } catch (e) {} } });
  p.on('console', function (m) { if (m.type() === 'error' || m.type() === 'warning') { console.log('console:', m.text().slice(0, 200)); } });
  await p.waitForSelector('.person', { timeout: 90000 });
  ok((await p.locator('#playcover').count()) === 0, 'the play café is up');
  var names = await p.locator('.person .pn b').allTextContents(); console.log('people:', names.join(', '));
  ok(names.length === 5, 'five people to play as');
  await p.screenshot({ path: '/tmp/claude-0/shots/play_signin.png' });
  await p.click('.person:has-text("Josie")');
  await p.waitForSelector('.tabs', { timeout: 20000 }); await p.waitForTimeout(1500);
  await p.screenshot({ path: '/tmp/claude-0/shots/play_josie.png' });
  if (await p.locator('.tour .tavatar').count()) { await p.click('.tour .btn:has-text("Later"), .tour button:has-text("Later")'); await p.waitForTimeout(300); }
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(2500);
  ok((await p.locator('.nrow').count()) >= 3, 'the floor has the preset orders (' + await p.locator('.nrow').count() + ')');
  await p.screenshot({ path: '/tmp/claude-0/shots/play_overview.png' });
  await p.click('[data-toggle]'); await p.click('[data-who="Beto"]'); await p.waitForTimeout(3000);
  ok((await p.locator('.hit[data-ov="bar"]').count()) === 1, 'switched to Beto: the bar view');
  await p.screenshot({ path: '/tmp/claude-0/shots/play_beto.png' });
  // a guest orders on the website window; it lands at the bar of the same café
  await p.click('[data-toggle]'); await p.click('[data-guest]'); await p.waitForTimeout(2500);
  var g = p.frameLocator('#playguest iframe');
  await g.locator('.hit[data-act="toMenu"]').first().click(); await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/claude-0/shots/play_guest.png' });
  await g.locator('.cat').nth(1).click(); await p.waitForTimeout(300); await g.locator('.mrow').nth(1).click(); await p.waitForTimeout(400);
  await g.locator('[data-act="addDish"]').click(); await p.waitForTimeout(300); await g.locator('[data-act="review"]').click(); await p.waitForTimeout(300);
  await g.locator('#gname').fill('Friend'); await g.locator('[data-act="type"][data-arg="togo"]').click(); await g.locator('#gname').fill('Friend');
  await g.locator('[data-act="send"]').click(); await p.waitForTimeout(2500);
  ok(/Making it/.test(await g.locator('.state').innerText()), 'guest order went through in the play café');
  await p.screenshot({ path: '/tmp/claude-0/shots/play_guest2.png' });
  await p.waitForTimeout(4500);
  ok(/Friend/.test(await p.locator('.orail').innerText()), 'it shows up on the POS map rail');
  var keys = await p.evaluate(function () { return { s: localStorage.getItem('jc.pos.session'), pr: localStorage.getItem('jc.p2.person'), play: Object.keys(localStorage).filter(function (k) { return k.indexOf('jc.playx.') === 0; }).length }; });
  ok(/REAL-TOKEN/.test(keys.s) && /RealPerson/.test(keys.pr), 'the real tablet sign-in is untouched by play');
  ok(keys.play >= 3, 'play keeps its own storage (' + keys.play + ' keys)');
  // an old build of play left its fake sign-in on this browser: the real POS clears it and asks for setup
  var p3 = await h.page('/pos/', { viewport: { width: 1180, height: 820 }, init: function () { try { localStorage.clear(); localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'play-token', refresh_token: 'play' })); localStorage.setItem('jc.p2.person', JSON.stringify({ name: 'Rosa', token: 'x' })); } catch (e) {} } });
  await p3.waitForTimeout(1500);
  ok((await p3.locator('#setupForm').count()) === 1, 'the real POS drops the leftover play sign-in and shows device setup');
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
