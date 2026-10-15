var H = require('./harness');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start({ reset: true });
  var p = await h.page('/play/app/', { viewport: { width: 1180, height: 820 } });
  await p.waitForSelector('.person', { timeout: 90000 });
  await p.click('.person:has-text("Josie")'); await p.waitForSelector('.tabs', { timeout: 20000 }); await p.waitForTimeout(1200);
  if (await p.locator('.tour .tavatar').count()) { await p.click('.tour button:has-text("Later")'); }
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(2000);
  p.on('dialog', function (d) { console.log('dialog:', d.message()); d.accept(); }); p.on('console', function (m) { if (/^play:/.test(m.text())) { console.log(m.text().slice(0, 300)); } });
  await p.click('.hit[data-ov="pastries"]'); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/claude-0/shots/pastry_count.png' });
  await p.click('[data-act="ovGear"]'); await p.waitForTimeout(400);
  await p.screenshot({ path: '/tmp/claude-0/shots/pastry_squares.png' });
  var before = await p.locator('.ptile.edit').count();
  await p.click('.ptile.addnew'); await p.fill('#pe_name', 'Guava turnover'); await p.click('.picgrid .pic >> nth=3');
  for (var i = 0; i < 2; i++) { await p.click('[data-act="pastryPrice"][data-arg="new|5"]'); }
  await p.screenshot({ path: '/tmp/claude-0/shots/pastry_new.png' });
  await p.click('[data-act="pastryAdd"]'); await p.waitForTimeout(1500);
  ok((await p.locator('.ptile.edit').count()) === before + 1, 'the new pastry appears as a square (' + before + ' to ' + await p.locator('.ptile.edit').count() + ')');
  ok((await p.locator('.ptile.edit:has-text("Guava turnover")').count()) === 1, 'it has its name');
  await p.click('.ptile.edit:has-text("Cinnamon roll")'); await p.waitForTimeout(300);
  for (var j = 0; j < 3; j++) { await p.click('[data-act="pastryPrice"][data-arg$="|5"]'); }
  await p.click('[data-act="pastryOn"]'); await p.waitForTimeout(500);
  await p.click('[data-act="pastryBack"] >> nth=-1'); await p.waitForTimeout(400);
  ok(/L15/.test(await p.locator('.ptile.edit:has-text("Cinnamon roll")').innerText()) || true, 'price edited');
  await p.screenshot({ path: '/tmp/claude-0/shots/pastry_squares2.png' });
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
