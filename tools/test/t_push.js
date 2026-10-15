var H = require('./harness'), shim = require('./shim'), seed = require('./seed_floor');
function ok(c, m) { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) { process.exitCode = 1; } }
(async function () {
  var h = await H.start({ reset: true }); seed.seed();
  var code = shim.psql("select code from ticket_link where id=1").out;
  shim.psql("insert into push_keys(id,public_key,private_jwk) values (1,'BPubKeyForTestOnlyBPubKeyForTestOnlyBPubKeyForTestOnlyBPubKeyForTestOnlyBPubKeyForTestOnly','{}') on conflict do nothing");
  var p = await h.page('/pos/tickets/', { viewport: { width: 390, height: 780 }, touch: true, mobile: true, init: function () {
    try { localStorage.clear(); } catch (e) {}
    var sub = { endpoint: 'https://push.example.test/abc', keys: { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' } };
    var reg = { pushManager: { getSubscription: function () { return Promise.resolve(null); }, subscribe: function () { return Promise.resolve(sub); } } };
    Object.defineProperty(navigator, 'serviceWorker', { value: { register: function () { return Promise.resolve(reg); }, ready: Promise.resolve(reg), addEventListener: function () {}, getRegistration: function () { return Promise.resolve(reg); } }, configurable: true });
    window.PushManager = function () {};
    window.Notification = { permission: 'default', requestPermission: function (cb) { window.Notification.permission = 'granted'; return Promise.resolve('granted'); } };
  } });
  await p.waitForTimeout(500);
  await p.fill('#code', code); await p.click('button[type=submit]'); await p.waitForTimeout(1500);
  ok((await p.locator('.alerts .btn').count()) === 1, 'Turn on alerts button shows');
  await p.click('.alerts .btn'); await p.waitForTimeout(1500);
  console.log('msg:', await p.locator('.alerts').innerText().catch(function () { return 'none'; }), '| keys:', shim.psql('select count(*) from push_keys').out);
  ok(shim.psql("select count(*) from push_subs where station='kitchen'").out === '1', 'phone signed up for kitchen alerts');
  ok((await p.locator('.alerts').count()) === 0, 'alerts box gone once on');
  await p.click('[data-act="menu"]'); await p.waitForTimeout(300);
  ok((await p.locator('[data-act="alertsoff"]').count()) === 1, 'can turn alerts off in settings');
  console.log('card:', shim.psql("select public.push_card(id,'kitchen','en')::text from orders where number='4'").out.slice(0, 200));
  console.log('errors:', p.errors.filter(function (e) { return !/ServiceWorker|fetching the script/.test(e); }));
  await h.stop();
})().catch(function (e) { console.error('FAILED', String(e).slice(0, 700)); process.exit(1); });
