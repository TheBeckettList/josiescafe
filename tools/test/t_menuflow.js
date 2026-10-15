var H = require('./harness');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start({ reset: true });
  var p = await h.page('/', { viewport: { width: 390, height: 800 }, mobile: true, touch: true }); await p.waitForTimeout(1800);
  await p.click('.mkb.tap', { force: true }); await p.waitForTimeout(1200);
  var y0 = await p.evaluate(function () { return window.pageYOffset; });
  ok(y0 > 200, 'the See the menu pill scrolls to the menu (y=' + Math.round(y0) + ')');
  var n = await p.locator('.cat').count(); var moved = [];
  for (var i = 1; i < Math.min(n, 5); i++) {
    var before = await p.evaluate(function () { return window.pageYOffset; });
    await p.locator('.cat').nth(i).click(); await p.waitForTimeout(300);
    var after = await p.evaluate(function () { return window.pageYOffset; });
    moved.push(Math.round(after - before));
  }
  ok(moved.every(function (d) { return Math.abs(d) < 2; }), 'switching categories does not move the page (' + moved.join(', ') + ')');
  await p.evaluate(function () { window.scrollBy(0, 260); }); await p.waitForTimeout(300);
  var sticky = await p.evaluate(function () { var c = document.querySelector('.cats').getBoundingClientRect(); return Math.round(c.top); });
  ok(sticky >= 52 && sticky <= 62, 'the category row stays under the header while scrolling (top=' + sticky + ')');
  var yb = await p.evaluate(function () { return window.pageYOffset; });
  var vis = await p.evaluate(function () { var r = document.querySelectorAll('.mrow'), i; for (i = 0; i < r.length; i++) { var b = r[i].getBoundingClientRect(); if (b.top > 150 && b.bottom < window.innerHeight - 20) { return i; } } return 0; });
  await p.locator('.mrow').nth(vis).click(); await p.waitForTimeout(400);
  ok((await p.locator('.dcard.modal').count()) === 1, 'a dish opens as a card over the menu');
  await p.click('.dcard [data-act="unpick"], .dcard .big.ghost'); await p.waitForTimeout(300);
  var y1 = await p.evaluate(function () { return window.pageYOffset; });
  ok(Math.abs(y1 - yb) < 4, 'closing it leaves you where you were');
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script|404/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 500)); process.exit(1); });
