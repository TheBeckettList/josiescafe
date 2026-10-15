var H = require('./harness'), shim = require('./shim'), seed = require('./seed_floor');
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); localStorage.setItem('jc.p2.tourSeen.x', '1'); } } catch (e) {} };
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
function q(s) { return shim.psql(s).out; }
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  var p = await h.page('/pos2/', { init: INIT, viewport: { width: 1024, height: 768 } });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1200);
  if (await p.locator('[data-act="tourClose"]').count()) { await p.click('[data-act="tourClose"] >> nth=0'); }
  await p.click('.tab:has-text("Overview")'); await p.waitForTimeout(2200);
  // 1. place waiting stick 7 on a table
  await p.click('[data-act="placeStart"][data-arg="7"]'); await p.waitForTimeout(300);
  await p.click('.hit.tbl[data-arg="2"]'); await p.waitForTimeout(3500);
  ok(q("select state||'/'||coalesce((select label from tables where id=table_id),'') from sticks where number=7") === 'table/2', 'stick 7 placed on table 2');
  // 2. stick back on paid number 4
  console.log('rows:', await p.locator('.nrow').allInnerTexts()); await p.click('.nrow:has-text("Stick back") .ncta >> nth=0'); await p.waitForTimeout(3000);
  var st4 = q("select state from sticks where number=4");
  console.log('stick 4 after back:', st4, '| orders phase:', q("select string_agg(phase||':'||number, ',') from orders where number like '4%'"));
  // 3. undo
  var undo = p.locator('.undo'); ok((await undo.count()) >= 1, 'Just done shows Undo');
  // 4. pay table 9 number
  await p.click('.hit.tbl[data-arg="5"]'); await p.waitForTimeout(600);
  await p.click('.pop [data-act="numPay"]'); await p.waitForTimeout(600);
  await p.screenshot({ path: '/tmp/claude-0/shots/ov_pay.png' });
  console.log('pay screen:', (await p.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 200));
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 700)); process.exit(1); });
