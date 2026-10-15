var H = require('./harness'), seed = require('./seed_floor');
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  var p = await h.page('/pos/', { init: INIT, viewport: { width: 1440, height: 960 }, dpr: 3 });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1500); if (await p.locator('[data-act="tourClose"]').count()) { await p.click('[data-act="tourClose"] >> nth=0'); }
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(2000);
  var r = await p.evaluate(function () { var b = document.getElementById('mapscale').getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width }; }), sc = r.w / 1440;
  var times = [0, 280, 1050, 1650, 2450], last = 0;
  await p.click('.hit.crit[data-arg="iguana"]'); var t0 = Date.now();
  for (var i = 0; i < times.length; i++) { var wait = times[i] - (Date.now() - t0); if (wait > 0) { await p.waitForTimeout(wait); } await p.screenshot({ path: '/tmp/claude-0/shots/ig_' + i + '.png', clip: { x: r.l + 470 * sc, y: r.t + 880 * sc, width: 80 * sc, height: 60 * sc } }); }
  await h.stop();
})();
