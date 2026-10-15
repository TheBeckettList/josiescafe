var H = require('./harness');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start({ reset: true });
  var p = await h.page('/play/app/', { viewport: { width: 1180, height: 820 } });
  await p.waitForSelector('.person', { timeout: 90000 });
  await p.click('.person:has-text("Josie")'); await p.waitForSelector('.tabs', { timeout: 20000 }); await p.waitForTimeout(1200);
  if (await p.locator('.tour .tavatar').count()) { await p.click('.tour button:has-text("Later")'); }
  await p.click('.tab:has-text("Manager")'); await p.waitForTimeout(2000);
  ok((await p.locator('.mpayroll:visible, .mteam:visible, .mphones:visible, .sgopen:visible').count()) === 0, 'no wages, team, phones or setup guide in the play manager view');
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(2000);
  await p.click('.hit[data-ov="pastries"]'); await p.waitForTimeout(500);
  var n0 = await p.locator('.ptile .pstep em').first().innerText();
  await p.click('.ptile >> nth=0 >> [aria-label="+1"]'); await p.waitForTimeout(600);
  ok((await p.locator('.ptile .pstep em').first().innerText()) === String(Number(n0) + 1), 'counting a pastry works (' + n0 + ' to ' + (Number(n0) + 1) + ')');
  await p.click('[data-act="ovGear"]'); await p.waitForTimeout(400);
  await p.click('.ptile.addnew'); await p.fill('#pe_name', 'Guava turnover');
  await p.click('[data-act="pastryPrice"][data-arg="new|5"]'); await p.click('[data-act="pastryAdd"]'); await p.waitForTimeout(900);
  ok(/turned off/.test(await p.evaluate(function () { var t = document.body.innerText; return t; })), 'adding a pastry is turned away with a gentle message');
  await p.screenshot({ path: '/tmp/claude-0/shots/play_blocked.png' });
  var count = await p.evaluate(function () { return J2PLAY.handle('GET', '/rest/v1/items', { select: 'id', name: 'eq.x' }, null, true).then(function (r) { return r.status; }); });
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script|403/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
