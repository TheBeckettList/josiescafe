var H = require('./harness'), seed = require('./seed_floor');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  var p = await h.page('/pos/', { init: INIT, viewport: { width: 1440, height: 960 }, dpr: 2 });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1500);
  if (await p.locator('[data-act="tourClose"]').count()) { await p.click('[data-act="tourClose"] >> nth=0'); }
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(2000);
  var r = await p.evaluate(function () { var b = document.getElementById('mapscale').getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width }; });
  var sc = r.w / 1440;
  async function frame(name, ms, c) { await p.waitForTimeout(ms); await p.screenshot({ path: '/tmp/claude-0/shots/cp_' + name + '.png', clip: { x: r.l + c[0] * sc, y: r.t + c[1] * sc, width: c[2] * sc, height: c[3] * sc } }); }
  await p.click('.hit.crit[data-arg="tree"]'); ok((await p.locator('.cr-tree.on').count()) === 1, 'tree plays'); await frame('tree0', 0, [470, 600, 380, 200]); await frame('tree1', 260, [470, 600, 380, 200]);
  await p.waitForTimeout(1800);
  await p.click('.hit.crit[data-arg="iguana"]'); await frame('ig0', 0, [440, 870, 200, 100]); await frame('ig_wink', 300, [440, 870, 200, 100]); await frame('ig_crane', 1000, [440, 870, 200, 100]); await frame('ig_mouth', 800, [440, 870, 200, 100]);
  await p.waitForTimeout(2200);
  await p.click('.hit.crit[data-arg="crab1"]'); await frame('crab0', 0, [780, 950, 360, 110]); await frame('crab_a', 450, [780, 950, 360, 110]); await frame('crab_b', 1600, [780, 950, 360, 110]); await frame('crab_c', 1300, [780, 950, 360, 110]);
  await p.waitForTimeout(1800);
  await p.click('.hit.crit[data-arg="ray"]'); await frame('ray', 450, [360, 1120, 300, 120]);
  await p.waitForTimeout(2200);
  await p.click('.hit.crit[data-arg="tuk"]'); await frame('tuk', 800, [80, 330, 230, 330]);
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 600)); process.exit(1); });
