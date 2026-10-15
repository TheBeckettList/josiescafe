/* Josie's Tickets (new look). Enter the 6-digit code once; then it is just the tickets, one per screen. Nothing to tap, mark or press.
   Reads tickets2_feed. Plain ES5. */
(function (w, d, JC, T) {
  'use strict';
  var STR = {
    en: { pick: 'Which tickets?', code: 'Ticket code', help: 'Find it on the register: Manage › Ticket phones.', open: 'Open tickets', bad: 'That code isn’t right.', nonet: 'No internet. Try again.',
      live: 'Live', off: 'No internet · showing the last tickets', settings: 'Settings', alertsOn: 'Alerts on', turnOn: 'Turn on alerts', turning: 'Turning on…', alertsWhy: 'Your phone buzzes for every new ticket, even when it is locked.', alertsOff: 'Turn off alerts',
      iosTitle: 'To get alerts on iPhone', ios1: 'Tap Share', ios2: 'Choose “Add to Home Screen”', ios3: 'Open Josie’s Tickets from your home screen and tap Turn on alerts', iosOld: 'Needs iOS 16.4 or newer.',
      noPush: 'This phone cannot get alerts. Keep this page open: it beeps for every new ticket.', blocked: 'Alerts are blocked. Allow notifications for josiescafe.com in the phone settings.', notReady: 'Alerts are not ready yet. Try again in a minute.', failed: 'Could not turn on alerts. Try again.', sw: 'Switch to', lang: 'Español', forget: 'Sign out (forget the code)', close: 'Close', kitchen: 'Kitchen', bar: 'Bar' },
    es: { pick: '¿Qué tickets?', code: 'Código de tickets', help: 'Lo encuentras en la caja: Manage › Ticket phones.', open: 'Abrir tickets', bad: 'Ese código no es correcto.', nonet: 'Sin internet. Inténtalo de nuevo.',
      live: 'En vivo', off: 'Sin internet · últimos tickets', settings: 'Ajustes', alertsOn: 'Avisos activados', turnOn: 'Activar avisos', turning: 'Activando…', alertsWhy: 'Tu teléfono suena con cada ticket nuevo, aunque esté bloqueado.', alertsOff: 'Apagar avisos',
      iosTitle: 'Para recibir avisos en iPhone', ios1: 'Toca Compartir', ios2: 'Elige “Agregar a pantalla de inicio”', ios3: 'Abre Josie’s Tickets desde tu pantalla de inicio y toca Activar avisos', iosOld: 'Necesita iOS 16.4 o más nuevo.',
      noPush: 'Este teléfono no puede recibir avisos. Deja esta página abierta: suena con cada ticket nuevo.', blocked: 'Los avisos están bloqueados. Permite notificaciones para josiescafe.com en los ajustes del teléfono.', notReady: 'Los avisos aún no están listos. Inténtalo en un minuto.', failed: 'No se pudieron activar los avisos. Inténtalo de nuevo.', sw: 'Cambiar a', lang: 'English', forget: 'Salir (olvidar el código)', close: 'Cerrar', kitchen: 'Cocina', bar: 'Bar' }
  };
  var app = d.getElementById('app');
  var S = { code: JC.get('tk.code', ''), station: JC.get('tk.station', 'kitchen'), lang: JC.get('tk.lang', /^es/i.test(w.navigator.language || '') ? 'es' : 'en'),
    feed: (JC.get('tk.feed2', null)), live: false, menu: false, msg: '', skew: 0, vapid: JC.get('tk.vapid', ''), endpoint: JC.get('tk.endpoint', ''), busy: false, alertMsg: '' };
  function s(k) { return STR[S.lang][k]; }
  function esc(x) { return JC.esc(x === null || x === undefined ? '' : String(x)); }
  function rpc(name, body, cb) { JC.rest('POST', 'rpc/' + name, body, null, cb); }
  /* ── what this phone can do ── */
  var nav = w.navigator;
  var isIOS = /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  var standalone = nav.standalone === true || !!(w.matchMedia && w.matchMedia('(display-mode: standalone)').matches);
  var canPush = 'serviceWorker' in nav && 'PushManager' in w && 'Notification' in w;
  function alertsOn() { return !!(canPush && S.endpoint && w.Notification.permission === 'granted'); }
  function b64ToBytes(b64) {
    var pad = '===='.slice((b64.length % 4) || 4), raw = w.atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/')), out = new Uint8Array(raw.length), i;
    for (i = 0; i < raw.length; i++) { out[i] = raw.charCodeAt(i); }
    return out;
  }
  function turnOn() {
    if (!canPush || S.busy) { return; }
    if (!S.vapid) { S.alertMsg = s('notReady'); paint(); return; }
    S.busy = true; S.alertMsg = ''; paint();
    function fail(msg) { S.busy = false; S.alertMsg = msg || s('failed'); paint(); }
    function withPermission(next) {
      var r; try { r = w.Notification.requestPermission(function (p) { if (!r) { next(p); } }); } catch (e) { r = null; }
      if (r && r.then) { r.then(next, function () { fail(); }); }
    }
    withPermission(function (perm) {
      if (perm !== 'granted') { fail(perm === 'denied' ? s('blocked') : ''); return; }
      nav.serviceWorker.register('../sw.js', { scope: '../' }).then(function () { return nav.serviceWorker.ready; }).then(function (reg) {
        return reg.pushManager.getSubscription().then(function (old) { return old || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(S.vapid) }); });
      }).then(function (sub) {
        var json = JSON.parse(JSON.stringify(sub));
        rpc('tickets_subscribe', { p_code: S.code, p_sub: json, p_station: S.station, p_lang: S.lang }, function (err, ok) {
          if (err || ok === false) { fail(); return; }
          S.endpoint = json.endpoint; JC.set('tk.endpoint', S.endpoint); S.busy = false; S.alertMsg = ''; paint();
          JC.http('POST', JC.cfg.url + '/functions/v1/kitchen-push', { test: S.endpoint, code: S.code, lang: S.lang }, { apikey: JC.cfg.key, 'Content-Type': 'application/json' }, function () {});
        });
      }, function () { fail(); });
    });
  }
  function resubscribe() {
    if (!alertsOn()) { return; }
    nav.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (sub) {
      if (!sub) { S.endpoint = ''; JC.del('tk.endpoint'); paint(); return; }
      rpc('tickets_subscribe', { p_code: S.code, p_sub: JSON.parse(JSON.stringify(sub)), p_station: S.station, p_lang: S.lang }, function () {});
    });
  }
  function turnOff() {
    var ep = S.endpoint; S.endpoint = ''; JC.del('tk.endpoint');
    if (ep && S.code) { rpc('tickets_unsubscribe', { p_code: S.code, p_endpoint: ep }, function () {}); }
    if (canPush) { nav.serviceWorker.getRegistration('../').then(function (reg) { return reg && reg.pushManager.getSubscription(); }).then(function (sub) { if (sub) { sub.unsubscribe(); } }, function () {}); }
  }
  function alertsBox() {
    if (alertsOn()) { return ''; }
    var h = '<section class="alerts">';
    if (isIOS && !standalone) { h += '<b>' + esc(s('iosTitle')) + '</b><ol><li>' + esc(s('ios1')) + '</li><li>' + esc(s('ios2')) + '</li><li>' + esc(s('ios3')) + '</li></ol><small>' + esc(s('iosOld')) + '</small>'; }
    else if (!canPush) { h += '<p>' + esc(s('noPush')) + '</p>'; }
    else if (w.Notification.permission === 'denied') { h += '<p>' + esc(s('blocked')) + '</p>'; }
    else { h += '<p>' + esc(s('alertsWhy')) + '</p><button type="button" class="btn" data-act="alerts"' + (S.busy ? ' disabled' : '') + '>' + esc(S.busy ? s('turning') : s('turnOn')) + '</button>'; }
    return h + (S.alertMsg ? '<p class="msg">' + esc(S.alertMsg) + '</p>' : '') + '</section>';
  }
  /* a short beep and buzz for new work while the page is open */
  var audio = null, seenIds = null;
  function unlockAudio() { if (audio) { return; } var A = w.AudioContext || w.webkitAudioContext; if (!A) { return; } try { audio = new A(); } catch (e) { audio = null; } }
  function ding() {
    try { if (nav.vibrate) { nav.vibrate([250, 120, 250]); } } catch (e) {}
    if (!audio) { return; }
    try { var t0 = audio.currentTime; [0, 0.22].forEach(function (off, i) { var o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine'; o.frequency.value = i ? 1320 : 990; g.gain.setValueAtTime(0.0001, t0 + off); g.gain.exponentialRampToValueAtTime(0.35, t0 + off + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.2); o.connect(g); g.connect(audio.destination); o.start(t0 + off); o.stop(t0 + off + 0.22); }); } catch (e) {}
  }
  function noteNew(feed) {
    var i, fresh = false, now = {};
    for (i = 0; i < (feed.tickets || []).length; i++) { now[feed.tickets[i].id] = 1; if (seenIds && !seenIds[feed.tickets[i].id]) { fresh = true; } }
    seenIds = now; if (fresh) { ding(); }
  }
  function paint() {
    d.documentElement.lang = S.lang;
    var keep = app.querySelector('.tv-scroll'), top = keep ? keep.scrollTop : 0, h;
    if (!S.code) {
      h = '<div class="setup"><img class="wm" src="../../img/josies-wordmark.png" alt="Josie’s"><p>' + esc(s('pick')) + '</p><div class="seg">' +
        ['kitchen', 'bar'].map(function (k) { return '<button type="button" class="' + (S.station === k ? 'on' : '') + '" data-act="station" data-arg="' + k + '">' + esc(s(k)) + '</button>'; }).join('') + '</div>' +
        '<form id="codeForm"><input id="code" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" aria-label="' + esc(s('code')) + '"><p class="help">' + esc(s('help')) + '</p><p class="msg">' + esc(S.msg) + '</p>' +
        '<button class="btn" type="submit">' + esc(s('open')) + '</button></form></div>';
    } else {
      h = '<header class="top"><h1>' + esc(s(S.station)) + '</h1><small class="' + (S.live ? '' : 'off') + '"><i></i>' + esc(S.live ? s('live') : s('off')) + '</small>' +
        '<button type="button" class="dots" data-act="menu" aria-label="' + esc(s('settings')) + '">&middot;&middot;&middot;</button></header>' + alertsBox() + '<div class="feed">' +
        T.list(S.feed || { tickets: [], alerts: [] }, { lang: S.lang, station: S.station, skew: S.skew, id: 'tv', scrollKey: 'tv' }) + '</div>';
      if (S.menu) {
        var other = S.station === 'bar' ? 'kitchen' : 'bar';
        h += '<div class="sheet" data-act="menu"><div class="sheet-in"><button type="button" data-act="station" data-arg="' + other + '">' + esc(s('sw')) + ' ' + esc(s(other)) + '</button>' +
          '<button type="button" data-act="lang">' + esc(s('lang')) + '</button>' + (alertsOn() ? '<button type="button" data-act="alertsoff">' + esc(s('alertsOff')) + '</button>' : '') + '<button type="button" data-act="forget">' + esc(s('forget')) + '</button><button type="button" data-act="menu">' + esc(s('close')) + '</button></div></div>';
      }
    }
    app.innerHTML = h;
    if (S.code) { var sc = app.querySelector('.tv-scroll'); if (sc) { sc.scrollTop = top; } T.after(app); }
  }
  function poll() {
    if (!S.code) { return; }
    rpc('tickets2_feed', { p_code: S.code, p_station: S.station, p_lang: S.lang }, function (err, data, status) {
      if (err) { S.live = false; paint(); return; }
      if (!data || data.ok === false) { S.code = ''; JC.del('tk.code'); S.msg = s('bad'); paint(); return; }
      S.live = true; if (data.vapid) { S.vapid = data.vapid; JC.set('tk.vapid', data.vapid); } noteNew(data); S.feed = data; try { S.skew = new Date(data.now).getTime() - Date.now(); S.skew = 0; } catch (e) {}
      JC.set('tk.feed2', data); T.chime(data); paint();
    });
  }
  app.addEventListener('click', function (ev) {
    unlockAudio(); var el = ev.target, act, arg;
    while (el && el !== app && !(el.getAttribute && el.getAttribute('data-act'))) { el = el.parentNode; }
    if (!el || el === app) { return; }
    act = el.getAttribute('data-act'); arg = el.getAttribute('data-arg');
    if (act === 'menu' && el.className === 'sheet' && ev.target !== el) { return; }
    ev.preventDefault();
    if (act === 'station') { S.station = arg; JC.set('tk.station', arg); S.feed = null; seenIds = null; S.menu = false; paint(); poll(); resubscribe(); }
    else if (act === 'alerts') { turnOn(); }
    else if (act === 'alertsoff') { S.menu = false; turnOff(); paint(); }
    else if (act === 'lang') { S.lang = S.lang === 'es' ? 'en' : 'es'; JC.set('tk.lang', S.lang); S.menu = false; paint(); poll(); resubscribe(); }
    else if (act === 'menu') { S.menu = !S.menu; paint(); }
    else if (act === 'forget') { turnOff(); S.code = ''; JC.del('tk.code'); JC.del('tk.feed2'); S.feed = null; S.menu = false; paint(); }
  }, false);
  app.addEventListener('submit', function (ev) {
    ev.preventDefault(); var v = (d.getElementById('code').value || '').replace(/\D/g, '');
    if (v.length !== 6) { S.msg = s('bad'); paint(); return; }
    rpc('tickets2_feed', { p_code: v, p_station: S.station, p_lang: S.lang }, function (err, data, status) {
      if (err) { S.msg = status === 0 ? s('nonet') : s('bad'); paint(); return; }
      if (!data || data.ok === false) { S.msg = s('bad'); paint(); return; }
      S.code = v; JC.set('tk.code', v); S.msg = ''; if (data.vapid) { S.vapid = data.vapid; JC.set('tk.vapid', data.vapid); } S.feed = data; S.live = true; paint();
    });
  }, true);
  if ('serviceWorker' in nav) { try { nav.serviceWorker.register('../sw.js', { scope: '../' }); nav.serviceWorker.addEventListener('message', function (ev) { if (ev.data && ev.data.open) { poll(); } }); } catch (e) {} }
  d.addEventListener('visibilitychange', function () { if (!d.hidden) { poll(); } }, false);
  w.setInterval(function () { if (!d.hidden) { poll(); } }, 4000);
  paint(); poll();
}(window, document, window.JC, window.J2T));
