/* Josie's World · the app shell: boot, sign-in, repaint, events, timers. Plain ES5. */
(function (w, d, JC) {
  'use strict';
  var J = w.J2, S = J.S, esc = J.esc, U = J.ui, R = J.reg;
  var app = d.getElementById('app'), paintTimer = null;

  S.ui = { view: 'pos', cat: null, sheet: null, pay: null, last: null, pin: '', pinFor: null, pinMsg: '', popup: null, flip: false, placing: null, tutorial: false };

  /* ───────────── which screen is showing ───────────── */
  function roleHome() {
    var p = J.eff();
    if (p && (p.station === 'bar' || p.station === 'kitchen') && p.role === 'staff') { return 'overview'; }
    return 'pos';
  }
  function html() {
    if (!S.session) { return setupView(); }
    if (!S.person) { return signinView(); }
    if (J.setup) { J.setup.check(); if (S.ui.setup === 'home') { return J.setup.home(); } }
    return shell() + (S.ui.tutorial ? tutorialHTML() : '') + J.tour.html();
  }
  function shell() {
    var tab = S.tab;
    if (S.device.mode === 'inventory' || /[?&]inv\b/.test(w.location.search || '')) { return J.ov.inventoryScreen(); }
    if (tab === 'manager' && !J.can('manager')) { tab = S.tab = 'pos'; }
    if (tab === 'pos' && roleHome() === 'overview') { tab = S.tab = 'overview'; }
    if (tab === 'overview') { return J.ov.screen(); }
    if (tab === 'manager') { return J.mgr.screen(); }
    var v = S.ui.view;
    if (v === 'stick') { return R.stick(); }
    if (v === 'pay') { return R.pay(); }
    if (v === 'done') { return R.done(); }
    return R.pos();
  }

  /* ───────────── device setup (once per tablet; shared with the live /pos/) ───────────── */
  function setupView() {
    return '<div class="center setup"><img src="../img/josies-wordmark.png" alt="Josie’s" height="86" style="display:block;margin:0 auto 10px"><h1>Set up this device</h1>' +
      '<p class="muted">A manager does this once per tablet. It stays signed in, even offline.</p>' +
      '<form id="setupForm" class="pcard form" autocomplete="on"><label>Device email<input id="su_email" type="email" autocapitalize="off" autocorrect="off" value="pos@josiescafe.com"></label>' +
      '<label>Password<input id="su_pass" type="password"></label><label>Device letter<select id="su_code">' + ['A', 'B', 'C', 'D', 'E', 'F'].map(function (c) { return '<option' + (S.device.code === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label>' +
      '<p id="su_msg" class="msg">' + esc(S.ui.setupMsg || '') + '</p><button class="paybtn wide" type="submit"><span>Sign in device</span></button></form></div>';
  }
  function doSetup() {
    var email = J.$('su_email').value.replace(/^\s+|\s+$/g, ''), pass = J.$('su_pass').value;
    S.device.code = J.$('su_code').value; JC.set('pos.device', S.device);
    J.$('su_msg').innerHTML = 'Signing in…';
    J.deviceSignIn(email, pass, function (err) {
      if (err) { S.ui.setupMsg = 'That email and password didn’t work.'; J.changed(); return; }
      S.ui.setupMsg = ''; J.loadData(function () { J.pollFloor(); J.changed(); }); J.changed();
    });
  }

  /* ───────────── who is this? ───────────── */
  var ROLE_LABEL = { josie: 'owner', manager: 'managerRole' };
  function roleText(p) {
    if (p.role === 'josie') { return J.t('owner'); }
    if (p.role === 'manager') { return J.t('managerRole'); }
    if (p.station === 'bar') { return J.t('bar'); }
    if (p.station === 'kitchen') { return J.t('kitchen'); }
    return J.t('register');
  }
  function signinView() {
    var names = S.data.names || [], h = '<div class="signin"><img class="si-brand" src="../img/josies-wordmark.png" alt="Josie’s" height="58">', i, p, pin = S.ui.pin, dots = '';
    if (!S.ui.pinFor) {
      h += '<div class="si-col"><h1 class="si-h">' + esc(J.t('whoIsThis')) + '</h1>' + (w.J2PLAY ? '<p class="muted" style="text-align:center;margin:-6px 0 10px">' + (S.lang === 'es' ? 'Modo de juego: nada es real. Elige quién eres.' : 'Play mode: nothing here is real. Pick who you are.') + '</p>' : '') + '<div class="plist">';
      for (i = 0; i < names.length; i++) {
        p = names[i];
        h += '<button type="button" class="person" data-act="pickPerson" data-arg="' + p.id + '">' + U.avatar(p.name, 54) + '<span class="pn"><b>' + esc(p.name) + '</b><small>' + esc(roleText(p)) + '</small></span></button>';
      }
      if (!names.length) { h += '<p class="muted">' + esc(S.online ? 'No people yet.' : J.t('needsNet')) + '</p>'; }
      h += '</div><div class="si-lang">' + U.langToggle() + '</div><p class="tinyv">' + (S.online ? '' : esc(J.t('offlineBand')) + ' · ') + 'v' + J.VERSION + ' · device ' + esc(S.device.code) + '</p></div></div>';
      return h;
    }
    p = J.byId(names, S.ui.pinFor) || { name: '?' };
    for (i = 0; i < 4; i++) { dots += '<span class="pdot' + (i < pin.length ? ' on' : '') + '"></span>'; }
    h += '<div class="si-col pinp"><button type="button" class="rb" data-act="pinBack" aria-label="' + esc(J.t('back')) + '">' + U.ic('back', 20, '#B55573') + '</button>' +
      '<div class="si-who">' + U.avatar(p.name, 84) + '<b>' + esc(p.name) + '</b></div><div class="pdots">' + dots + '</div><p class="msg">' + esc(S.ui.pinMsg) + '</p><div class="pad">';
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '<'].forEach(function (k) {
      h += k === '' ? '<span></span>' : '<button type="button" class="key" data-act="pin" data-arg="' + k + '">' + (k === '<' ? '⌫' : k) + '</button>';
    });
    return h + '</div></div></div>';
  }
  function pinKey(k) {
    if (k === '<') { S.ui.pin = S.ui.pin.slice(0, -1); } else if (S.ui.pin.length < 4) { S.ui.pin += k; }
    S.ui.pinMsg = '';
    if (S.ui.pin.length === 4) {
      var pin = S.ui.pin, id = S.ui.pinFor; S.ui.pin = '';
      J.signIn(id, pin, function (res) {
        if (res === 'ok') {
          S.ui.pinFor = null; S.ui.pinMsg = ''; S.tab = roleHome();
          if (!JC.get('p2.tourSeen.' + id, false)) { S.ui.tutorial = true; JC.set('p2.tourSeen.' + id, true); }
          J.pollFloor();
        } else { S.ui.pinMsg = res === 'locked' ? J.t('locked') : res === 'offline-unknown' ? J.t('needsNet') : J.t('wrongPin'); }
        J.changed();
      });
    }
    J.changed();
  }

  /* ───────────── tutorial: shown once at first sign-in, replayed by the ? ───────────── */
  function tutorialHTML() {
    var nm = S.person ? S.person.name : '';
    return '<div class="scrim"></div><div class="tour"><span class="tavatar">' + esc(nm.charAt(0).toUpperCase()) + '</span><b>' + esc(J.t('tutorialWelcome')) + ', ' + esc(nm) + '</b><p>' + esc(J.tour.welcomeLook()) + '</p>' +
      '<span class="qbtn tq">?</span><div class="tourbtns tcol"><button type="button" class="btn primary wide" data-act="tourStart">' + esc(J.t('showMe')) + '</button><button type="button" class="btn soft wide" data-act="tourClose">' + esc(J.t('later')) + '</button></div></div>';
  }

  /* ───────────── repaint (keeps typing and scroll where they were) ───────────── */
  function paint() {
    var a = d.activeElement, keep = null, scrolls = {}, i, els;
    if (a && a.id && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) { keep = { id: a.id, s: a.selectionStart, e: a.selectionEnd }; }
    els = app.querySelectorAll('[data-scroll]');
    for (i = 0; i < els.length; i++) { scrolls[els[i].getAttribute('data-scroll')] = els[i].scrollTop; }
    var h = html();
    d.documentElement.className = 'v-' + (S.person ? S.tab : 'x');
    app.innerHTML = h;
    els = app.querySelectorAll('[data-scroll]');
    for (i = 0; i < els.length; i++) { var k = els[i].getAttribute('data-scroll'); if (scrolls[k] !== undefined) { els[i].scrollTop = scrolls[k]; } }
    if (keep) { var n = J.$(keep.id); if (n) { try { n.focus(); n.setSelectionRange(keep.s, keep.e); } catch (e) {} } }
    if (J.ov && J.ov.after) { J.ov.after(app); }
    if (J.tour && J.tour.after) { J.tour.after(); }
  }
  J.onChange = function () {
    if (paintTimer || S.ui.dragging) { return; }
    paintTimer = w.setTimeout(function () { paintTimer = null; paint(); }, 24);
  };
  J.repaintNow = paint;

  /* ───────────── events ───────────── */
  function actEl(el) { while (el && el !== app && el !== d.body) { if (el.getAttribute && el.getAttribute('data-act')) { return el; } el = el.parentNode; } return null; }
  function onClick(ev) {
    var el = actEl(ev.target); if (!el || el.disabled) { return; }
    var act = el.getAttribute('data-act'), arg = el.getAttribute('data-arg'), c = J.cart();
    ev.preventDefault();
    switch (act) {
      case 'lang': J.setLang(arg); break;
      case 'pickPerson': S.ui.pinFor = arg; S.ui.pin = ''; S.ui.pinMsg = ''; J.changed(); if (w.J2PLAY && w.J2PLAY.autopin) { w.setTimeout(w.J2PLAY.autopin, 80); } break;
      case 'pinBack': S.ui.pinFor = null; S.ui.pin = ''; S.ui.pinMsg = ''; J.changed(); break;
      case 'pin': pinKey(arg); break;
      case 'tab': S.tab = arg; S.ui.popup = null; S.ui.flip = false; S.ui.placing = null; J.changed(); if (arg === 'overview') { J.pollFloor(); } break;
      case 'me': if (w.confirm(S.person.name + ': ' + J.t('signOut') + '?')) { J.signOut(); } break;
      case 'cat': S.ui.cat = arg; J.changed(); break;
      case 'diet': J.toggleDiet(arg); break;
      case 'add': var r = J.addItem(arg); if (r === 'cant') { J.addItem(arg, { anyway: true }); } break;
      case 'inc': J.changeQty(arg, 1); break;
      case 'dec': J.changeQty(arg, -1); break;
      case 'dot': var pp = arg.split('|'); S.ui.sheet = { kind: 'dot', line: pp[0], ing: pp[1] }; J.changed(); break;
      case 'sheetClose': S.ui.sheet = null; J.changed(); break;
      case 'sheetPick': R.sheetPick(arg); break;
      case 'sheetBack': R.sheetBack(arg); break;
      case 'ctype': c.type = arg; J.saveCart(); J.changed(); break;
      case 'pay': R.start(false); break;
      case 'paylater': R.start(true); break;
      case 'addtoCancel': c.addTo = null; J.saveCart(); J.changed(); break;
      case 'stickPick': R.stickPick(arg); break;
      case 'stickBack2': S.ui.view = 'pos'; J.changed(); break;
      case 'payBack':
        if (S.ui.payFor) { S.ui.payFor = null; S.ui.view = 'pos'; S.tab = 'overview'; } else { S.ui.view = c.type === 'here' && !c.addTo ? 'stick' : 'pos'; }
        J.changed(); break;
      case 'method': S.ui.pay.method = arg; S.ui.pay.given = null; J.changed(); break;
      case 'given': S.ui.pay.given = Number(arg); J.changed(); break;
      case 'tip':
        if (+arg === 4) { var tv = w.prompt('Tip amount in lempiras', S.ui.pay.tip || ''); if (tv === null || isNaN(Number(tv))) { break; } S.ui.pay.tip = Number(tv); }
        S.ui.pay.tipMode = +arg; J.changed(); break;
      case 'complete': R.complete(); break;
      case 'newOrder': S.ui.view = 'pos'; J.changed(); break;
      case 'placeNow': S.tab = 'overview'; S.ui.view = 'pos'; S.ui.placing = Number(arg); J.changed(); J.pollFloor(); break;
      case 'print': R.printReceipt(arg); break;
      default:
        if (J.tour && J.tour.handle(act, arg)) { break; }
        if (J.setup && J.setup.handle(act, arg)) { break; }
        if (J.team && J.team.handle(act, arg)) { break; }
        if (J.ov && J.ov.handle && J.ov.handle(act, arg, el)) { break; }
        if (J.gear && J.gear.handle && J.gear.handle(act, arg, el)) { break; }
        if (J.mgr && J.mgr.handle && J.mgr.handle(act, arg, el)) { break; }
    }
  }
  function onInput(ev) {
    var el = ev.target;
    if (el.id === 'cust') { J.cart().name = el.value; J.saveCart(); }
    else if (el.id === 'givenIn') { R.givenInput(el.value); }
    else if (el.id === 'cardRef') { S.ui.pay.ref = el.value; }
    else if (J.ov && J.ov.input && J.ov.input(el)) { return; }
    else if (J.team && J.team.input(el)) { return; }
    else if (J.gear && J.gear.input) { J.gear.input(el); }
  }
  function onSubmit(ev) { ev.preventDefault(); if (ev.target.id === 'setupForm') { doSetup(); } else if (J.gear && J.gear.submit) { J.gear.submit(ev.target); } }

  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) { if (S.ui.sheet) { S.ui.sheet = null; J.changed(); } else if (S.ui.popup) { S.ui.popup = null; S.ui.flip = false; J.changed(); } }
  });

  /* ───────────── start ───────────── */
  function boot() {
    app.addEventListener('click', onClick, false);
    app.addEventListener('input', onInput, false);
    app.addEventListener('submit', onSubmit, true);
    paint();
    if (S.session) {
      J.loadData(function () { J.changed(); });
      J.pollFloor();
    }
    J.ping();
    w.setInterval(J.ping, 8000);
    w.setInterval(function () { if (S.session && S.person && !(S.ui.view === 'pay')) { J.pollFloor(); } }, 4000);
    w.setInterval(function () { if (S.online && S.session && S.ui.view !== 'pay') { J.loadData(function () { J.changed(); }); } }, 90000);
    w.setInterval(function () { if (S.backBand && S.online && !S.queue.length) { S.backBand = 0; J.changed(); } }, 6000);
    w.setInterval(function () { J.changed(); }, 30000);                 // keep the clock and "6 min" fresh
    if ('serviceWorker' in w.navigator && !w.J2PLAY) { try { w.navigator.serviceWorker.register('sw.js'); } catch (e) {} }
  }
  boot();
}(window, document, window.JC));
