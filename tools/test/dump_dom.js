var H = require('./harness'), seed = require('./seed_floor');
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
async function dump(p, label) { console.log('--', label, JSON.stringify(await p.evaluate(function () { var out = {}; ['.top','.tabs','.qbtn','.lang','.avatar-btn','.band','.main','.cats','.cat','.tiles','.tile','.tk','.dchips','.seg2','.paybtn','.later','.stickpage','.stk-right','.sbtn','.ovbody','.mapbox','.orail','.rcard','.nrow','.hit','.mstats','.mloved','.mphones','.payp','.methods','.mcard'].forEach(function (s) { var e = document.querySelector(s); if (e) { var r = e.getBoundingClientRect(); out[s] = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; } }); return out; }))); }
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  var p = await h.page('/pos/', { init: INIT, viewport: { width: 1024, height: 768 } });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1500);
  if (await p.locator('[data-act="tourClose"]').count()) { await p.click('[data-act="tourClose"] >> nth=0'); }
  await dump(p, 'pos'); await p.screenshot({ path: '/tmp/claude-0/shots/t_pos.png' });
  await p.click('.tile >> nth=0'); await p.waitForTimeout(300); await p.click('[data-act="pay"]'); await p.waitForTimeout(500); await dump(p, 'pay');
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(1500); await dump(p, 'overview');
  await p.click('.tab:has-text("Manager")'); await p.waitForTimeout(1500); await dump(p, 'manager');
  await h.stop();
})().catch(function (e) { console.error(String(e).slice(0, 400)); process.exit(1); });
