var H = require('./harness'), seed = require('./seed_floor');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  var p = await h.page('/', { viewport: { width: 1100, height: 800 } });
  await p.waitForTimeout(2000);
  var seen = {};
  for (var code of ['fr', 'de', 'nl', 'nl-BE', 'it', 'pt', 'nb', 'ga', 'he', 'es', 'en']) {
    await p.click('.lbtn'); await p.waitForTimeout(200); await p.click('.lopt[data-arg="' + code + '"]'); await p.waitForTimeout(900);
    await p.click('[data-act="helpOpen"]'); await p.waitForTimeout(300);
    var t = await p.locator('.hsteps li').first().innerText(); var dir = await p.evaluate(function () { return document.documentElement.dir; });
    ok(!seen[t], code + ': "' + t + '" dir=' + dir); seen[t] = 1;
    if (code === 'he' || code === 'ga') { await p.screenshot({ path: '/tmp/claude-0/shots/lang_' + code + '.png' }); }
    await p.click('.big'); await p.waitForTimeout(200);
  }
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 500)); process.exit(1); });
