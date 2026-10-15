var H = require('./harness');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start({ reset: true });
  var p = await h.page('/', { viewport: { width: 1280, height: 800 }, init: function () { try { localStorage.clear(); } catch (e) {} } });
  await p.waitForTimeout(1500);
  var sc = 1280 / 1440, off = 64;   // design -> screen
  async function frame(name, ms, c) { await p.waitForTimeout(ms); await p.screenshot({ path: '/tmp/claude-0/shots/cr_' + name + '.png', fullPage: true, clip: { x: c[0] * sc, y: off + c[1] * sc, width: c[2] * sc, height: c[3] * sc } }); }
  // tree
  await p.click('.hit.crit[data-arg="tree"]'); ok((await p.locator('.cr-tree.on').count()) === 1, 'tree plays'); await frame('tree', 300, [480,600,360,160]);
  // iguana: wink early, crane later
  await p.waitForTimeout(1600);
  await p.click('.hit.crit[data-arg="iguana"]'); await frame('iguana_wink', 350, [430,870,200,100]); await frame('iguana_crane', 1100, [430,870,200,100]); await frame('iguana_mouth', 800, [430,870,200,100]);
  await p.waitForTimeout(1500);
  // crab
  await p.click('.hit.crit[data-arg="crab1"]'); await frame('crab_a', 500, [780,950,360,110]); await frame('crab_b', 1800, [780,950,360,110]); await frame('crab_c', 1400, [780,950,360,110]);
  await p.waitForTimeout(1500);
  // ray
  await p.click('.hit.crit[data-arg="ray"]'); await frame('ray', 500, [360,1120,280,120]);
  await p.waitForTimeout(2000);
  // tuk
  await p.click('.hit.crit[data-arg="tuk"]'); await frame('tuk', 900, [80,330,220,300]);
  await p.waitForTimeout(2200);
  // bay
  await p.click('[data-act="bayFlip"]'); await p.waitForTimeout(500);
  ok((await p.locator('[data-crit]').count()) >= 8, 'bay has tappable things (' + await p.locator('[data-crit]').count() + ')');
  await p.click('[data-crit="octopus"] >> nth=0', { force: true }); await frame('octopus', 400, [100,330,340,260]);
  await p.click('[data-crit="sail"] >> nth=0', { force: true }); await frame('sail', 300, [450,250,300,200]);
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
