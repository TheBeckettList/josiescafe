var H = require('./harness');
var INIT = function () {
  try {
    if (!localStorage.getItem('jc.pos.session')) {
      localStorage.setItem('jc.pos.session', JSON.stringify({ access_token: 'test-token', refresh_token: 'r', expires_at: Date.now() + 1e9, email: 'pos@josiescafe.com' }));
      localStorage.setItem('jc.pos.device', JSON.stringify({ code: 'A', mode: 'register', lang: 'en' }));
    }
  } catch (e) {}
};
(async function () {
  var h = await H.start();
  var p = await h.page('/pos2/', { init: INIT });
  await p.waitForTimeout(1500);
  console.log('errors after load:', p.errors);
  await p.screenshot({ path: '/tmp/claude-0/shots/pos2_signin.png' });
  console.log('people buttons:', await p.locator('.person').count());
  await p.click('.person');
  for (var k of ['1', '2', '3', '4']) { await p.click('.key[data-arg="' + k + '"]'); }
  await p.waitForTimeout(1800);
  console.log('after pin, tabs:', await p.locator('.tab').allTextContents());
  console.log('categories:', await p.locator('.cat .lbl').allTextContents());
  console.log('tiles:', await p.locator('.tile').count());
  await p.screenshot({ path: '/tmp/claude-0/shots/pos2_pos.png' });
  console.log('errors:', p.errors);
  await h.stop();
})().catch(function (e) { console.error('FAILED', e); process.exit(1); });
