var H = require('./harness');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start({ reset: true });
  var p = await h.page('/pos/?play', { viewport: { width: 1180, height: 820 } });
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
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
