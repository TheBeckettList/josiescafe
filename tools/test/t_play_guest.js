var H = require('./harness');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start({ reset: true });
  var p = await h.page('/play/guest/', { viewport: { width: 390, height: 800 }, touch: true, mobile: true });
  await p.waitForSelector('.mrow', { timeout: 90000 }); await p.waitForTimeout(800);
  ok((await p.locator('#playphone').count()) === 0 && (await p.locator('#playbar').count()) === 0, 'the customer link has no POS bar or phone');
  await p.click('.cat >> nth=1'); await p.waitForTimeout(300); await p.click('.mrow >> nth=1'); await p.waitForTimeout(400);
  await p.click('[data-act="addDish"]'); await p.waitForTimeout(300); await p.click('[data-act="review"]'); await p.waitForTimeout(300);
  await p.fill('#gname', 'Guest'); await p.click('[data-act="type"][data-arg="togo"]'); await p.fill('#gname', 'Guest');
  await p.click('[data-act="send"]'); await p.waitForTimeout(1500);
  var t0 = Date.now(), seen = [];
  function snap() { return p.evaluate(function () { var st = document.querySelector('.state'), tot = document.querySelector('.status .tot span'); return (st ? st.textContent : '?') + ' / ' + (tot ? tot.textContent : '?'); }); }
  while (Date.now() - t0 < 22000) { var x = await snap(); if (seen[seen.length - 1] !== x) { seen.push(x); console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', x); if (/Picked up/.test(x)) { break; } } await p.waitForTimeout(500); }
  ok(seen.length >= 3, 'the order steps along by itself: ' + seen.join('  →  '));
  ok(/Picked up/.test(seen[seen.length - 1]), 'and finishes as picked up');
  await p.screenshot({ path: '/tmp/claude-0/shots/play_guest_done.png', fullPage: true });
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script|404/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
