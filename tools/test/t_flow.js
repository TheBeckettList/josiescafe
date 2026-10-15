var H = require('./harness'), shim = require('./shim');
var INIT = function () { try { if (!localStorage.getItem('jc.pos.session')) {
  localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
  localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' })); } } catch (e) {} };
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start(), p = await h.page('/pos2/', { init: INIT });
  await p.waitForTimeout(1200);
  await p.click('.person:has-text("Manager")'); for (var k of ['1','2','3','4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1500);
  await p.click('[data-act="tourClose"]');
  await p.click('.cat:has-text("Breakfast")');
  await p.click('.tile:has-text("Full plate")');
  await p.click('.dchip:has-text("Kosher-style")');
  await p.waitForTimeout(300);
  ok(await p.locator('.lname small').first().textContent().then(function (t) { return /no bacon/i.test(t) && /kosher/i.test(t); }), 'ticket line says "no bacon · kosher-style" (bacon is marked not kosher-style)');
  ok((await p.locator('.tile:has-text("Breakfast BLT") .tbadge').first().textContent()) !== null, 'BLT tile has a badge under kosher-style');
  console.log('BLT tile note:', await p.locator('.tile:has-text("Breakfast BLT") .tbadge').allTextContents());
  console.log('Full plate tile note:', await p.locator('.tile:has-text("Full plate") .tbadge').allTextContents());
  await p.screenshot({ path: '/tmp/claude-0/shots/pos2_ticket.png' });
  await p.click('.ldot >> nth=0'); await p.waitForTimeout(300);
  await p.screenshot({ path: '/tmp/claude-0/shots/pos2_sheet.png' });
  await p.click('.sheet-x');
  await p.fill('#cust', 'Sam');
  await p.click('[data-act="pay"]'); await p.waitForTimeout(300);
  ok(await p.locator('.sbtn').count() >= 18, 'Which stick? shows the sticks (' + await p.locator('.sbtn').count() + ')');
  await p.screenshot({ path: '/tmp/claude-0/shots/pos2_stick.png' });
  await p.click('.sbtn[data-arg="3"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: '/tmp/claude-0/shots/pos2_pay.png' });
  await p.click('.chip >> nth=0'); await p.click('[data-act="complete"]'); await p.waitForTimeout(1500);
  ok(await p.locator('.donep').count() === 1, 'done screen shown');
  await p.screenshot({ path: '/tmp/claude-0/shots/pos2_done.png' });
  var r = shim.psql("select o.number || '|' || o.customer_name || '|' || o.status || '|' || o.stick_number || '|' || o.phase || '|' || o.diets::text || '|' || (select count(*) from order_pieces where order_id=o.id) || '|' || (select chips::text from order_items i where i.order_id=o.id and i.name='Full plate') from orders o where o.device='A' order by created_at desc limit 1");
  console.log('DB order:', r.out);
  ok(/^3\|Sam\|paid\|3\|open\|\{kosher_style\}\|1\|/.test(r.out) && /"type": "no"/.test(r.out), 'order reached the server: stick 3, Sam, paid, kosher_style, one kitchen piece, bacon removed chip');
  var f = shim.psql("select state from sticks where number=3"); ok(f.out === 'waiting', 'stick 3 is in the waiting pot');
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', e); process.exit(1); });
