/* Josie's Tickets — the kitchen or bar's tickets on a cook's own phone. Read only: nothing to tap or mark.
   Opens with a 6-digit ticket code (Manage › Ticket phones on the POS). New tickets buzz the phone through
   Web Push where the phone supports it (Android Chrome; iPhone iOS 16.4+ once added to the Home Screen).
   Plain ES5 syntax so it also loads on old phones; push is only used where the browser has it. */
(function (w, d, JC) {
  'use strict';

  var POLL_MS = 5000;
  var STR = {
    es: {
      app: 'Tickets', kitchen: 'Cocina', bar: 'Bar', pick: '¿Para dónde son los tickets?',
      code: 'Código de tickets', codeHelp: 'Lo encuentras en la caja: Manage › Ticket phones.',
      open: 'Abrir tickets', badCode: 'Ese código no es correcto.', noNet: 'Sin internet. Inténtalo de nuevo.',
      live: 'En vivo', offline: 'Sin internet · última vez', here: 'Para aquí', togo: 'PARA LLEVAR',
      online: 'EN LÍNEA', pickup: 'Recoge', now: 'ahora', mins: 'min', done: 'Listo', none: 'Todavía no hay tickets.',
      note: 'Nota', alertsOn: 'Avisos activados', turnOn: 'Activar avisos', turning: 'Activando…',
      alertsWhy: 'Tu teléfono suena con cada ticket nuevo, aunque esté bloqueado.',
      iosTitle: 'Para recibir avisos en iPhone',
      ios1: 'Toca Compartir', ios2: 'Elige “Agregar a pantalla de inicio”', ios3: 'Abre Josie’s Tickets desde tu pantalla de inicio y toca Activar avisos',
      iosOld: 'Necesita iOS 16.4 o más nuevo.',
      noPush: 'Este teléfono no puede recibir avisos. Deja esta página abierta: suena con cada ticket nuevo.',
      blocked: 'Los avisos están bloqueados. Permite notificaciones para josiescafe.com en los ajustes del teléfono.',
      notReady: 'Los avisos aún no están listos. Inténtalo en un minuto.',
      failed: 'No se pudieron activar los avisos. Inténtalo de nuevo.',
      settings: 'Ajustes', switchTo: 'Cambiar a', langBtn: 'English', alertsOff: 'Apagar avisos',
      forget: 'Salir (olvidar el código)', register: 'Usar este teléfono como caja', close: 'Cerrar'
    },
    en: {
      app: 'Tickets', kitchen: 'Kitchen', bar: 'Bar', pick: 'Which tickets?',
      code: 'Ticket code', codeHelp: 'Find it on the register: Manage › Ticket phones.',
      open: 'Open tickets', badCode: 'That code isn’t right.', noNet: 'No internet. Try again.',
      live: 'Live', offline: 'No internet · last update', here: 'For here', togo: 'TO GO',
      online: 'ONLINE', pickup: 'Pickup', now: 'now', mins: 'min', done: 'Done', none: 'No tickets yet.',
      note: 'Note', alertsOn: 'Alerts on', turnOn: 'Turn on alerts', turning: 'Turning on…',
      alertsWhy: 'Your phone buzzes for every new ticket, even when it’s locked.',
      iosTitle: 'To get alerts on iPhone',
      ios1: 'Tap Share', ios2: 'Choose “Add to Home Screen”', ios3: 'Open Josie’s Tickets from your home screen and tap Turn on alerts',
      iosOld: 'Needs iOS 16.4 or newer.',
      noPush: 'This phone can’t get alerts. Keep this page open: it beeps for every new ticket.',
      blocked: 'Alerts are blocked. Allow notifications for josiescafe.com in the phone’s settings.',
      notReady: 'Alerts aren’t ready yet. Try again in a minute.',
      failed: 'Couldn’t turn on alerts. Try again.',
      settings: 'Settings', switchTo: 'Switch to', langBtn: 'Español', alertsOff: 'Turn off alerts',
      forget: 'Sign out (forget the code)', register: 'Use this phone as a register', close: 'Close'
    }
  };

  var app = d.getElementById('app');
  var T = {
    code: JC.get('tk.code', ''),
    station: JC.get('tk.station', 'kitchen'),
    lang: JC.get('tk.lang', /^es/i.test((w.navigator.language || 'es')) ? 'es' : (/^en/i.test(w.navigator.language || '') ? 'en' : 'es')),
    endpoint: JC.get('tk.endpoint', ''),
    tickets: (JC.get('tk.cache', { tickets: [] }) || {}).tickets || [],
    lastOk: (JC.get('tk.cache', {}) || {}).at || 0,
    live: false, loaded: false, msg: '', alertMsg: '', busy: false, menu: false,
    vapid: JC.get('tk.vapid', ''), seen: null, fresh: {}, focus: ''
  };

  function s(k) { return (STR[T.lang] || STR.es)[k]; }
  function esc(x) { return JC.esc(x === null || x === undefined ? '' : String(x)); }
  function $(id) { return d.getElementById(id); }
  function stationName(st) { return s(st === 'bar' ? 'bar' : 'kitchen'); }
  function clock(iso) {
    var t = new Date(iso), h = t.getHours(), m = ('0' + t.getMinutes()).slice(-2);
    return (h % 12 || 12) + ':' + m + (h >= 12 ? ' pm' : ' am');
  }
  function ago(iso) {
    var n = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    return n < 1 ? s('now') : n + ' ' + s('mins');
  }

  /* ── what this phone can do ── */
  var nav = w.navigator;
  var isIOS = /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  var standalone = nav.standalone === true || !!(w.matchMedia && w.matchMedia('(display-mode: standalone)').matches);
  var canPush = 'serviceWorker' in nav && 'PushManager' in w && 'Notification' in w;
  function alertsOn() { return !!(canPush && T.endpoint && w.Notification.permission === 'granted'); }

  /* ── server ── */
  function rpc(name, body, cb) { JC.rest('POST', 'rpc/' + name, body, null, cb); }
  function poll() {
    if (!T.code) { return; }
    rpc('tickets_feed', { p_code: T.code, p_station: T.station, p_lang: T.lang }, function (err, data, status) {
      if (err) {
        T.live = false;
        if (status === 0) { paint(); return; }
        paint(); return;
      }
      if (!data || data.ok === false) { signOut(s('badCode')); return; }
      T.live = true; T.loaded = true; T.lastOk = Date.now();
      if (data.vapid) { T.vapid = data.vapid; JC.set('tk.vapid', data.vapid); }
      var list = data.tickets || [], i, fresh = false;
      if (T.seen) {
        for (i = 0; i < list.length; i++) { if (!T.seen[list[i].id] && !list[i].done) { T.fresh[list[i].id] = Date.now(); fresh = true; } }
      }
      T.seen = {};
      for (i = 0; i < list.length; i++) { T.seen[list[i].id] = 1; }
      T.tickets = list;
      JC.set('tk.cache', { tickets: list, at: T.lastOk });
      if (fresh) { ding(); }
      paint();
    });
  }

  /* ── sound and buzz for new tickets while the page is open ── */
  var audio = null;
  function unlockAudio() {
    if (audio) { return; }
    var A = w.AudioContext || w.webkitAudioContext;
    if (!A) { return; }
    try { audio = new A(); } catch (e) { audio = null; }
  }
  function ding() {
    try { if (nav.vibrate) { nav.vibrate([250, 120, 250]); } } catch (e) {}
    if (!audio) { return; }
    try {
      var t0 = audio.currentTime;
      [0, 0.22].forEach(function (off, i) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = 'sine'; o.frequency.value = i ? 1320 : 990;
        g.gain.setValueAtTime(0.0001, t0 + off);
        g.gain.exponentialRampToValueAtTime(0.35, t0 + off + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.2);
        o.connect(g); g.connect(audio.destination);
        o.start(t0 + off); o.stop(t0 + off + 0.22);
      });
    } catch (e) {}
  }

  /* ── push alerts ── */
  function b64ToBytes(b64) {
    var pad = '===='.slice((b64.length % 4) || 4), raw = w.atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/')), out = new Uint8Array(raw.length), i;
    for (i = 0; i < raw.length; i++) { out[i] = raw.charCodeAt(i); }
    return out;
  }
  function turnOn() {
    if (!canPush || T.busy) { return; }
    if (!T.vapid) { T.alertMsg = s('notReady'); paint(); return; }
    T.busy = true; T.alertMsg = ''; paint();
    function fail(msg) { T.busy = false; T.alertMsg = msg || s('failed'); paint(); }
    function withPermission(next) {
      var r;
      try { r = w.Notification.requestPermission(function (p) { if (!r) { next(p); } }); } catch (e) { r = null; }
      if (r && r.then) { r.then(next, function () { fail(); }); }
    }
    withPermission(function (perm) {
      if (perm !== 'granted') { fail(perm === 'denied' ? s('blocked') : ''); return; }
      nav.serviceWorker.register('../sw.js', { scope: '../' }).then(function () { return nav.serviceWorker.ready; }).then(function (reg) {
        return reg.pushManager.getSubscription().then(function (old) {
          return old || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(T.vapid) });
        });
      }).then(function (sub) {
        var json = JSON.parse(JSON.stringify(sub));
        rpc('tickets_subscribe', { p_code: T.code, p_sub: json, p_station: T.station, p_lang: T.lang }, function (err, ok) {
          if (err || ok === false) { fail(); return; }
          T.endpoint = json.endpoint; JC.set('tk.endpoint', T.endpoint);
          T.busy = false; T.alertMsg = ''; paint();
          // A test alert, so the cook sees right away that it works.
          JC.http('POST', JC.cfg.url + '/functions/v1/kitchen-push', { test: T.endpoint, code: T.code, lang: T.lang },
            { apikey: JC.cfg.key, 'Content-Type': 'application/json' }, function () {});
        });
      }, function () { fail(); });
    });
  }
  function resubscribe() {
    // Station or language changed: the server sends this phone the right tickets in the right language.
    if (!alertsOn()) { return; }
    nav.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (sub) {
      if (!sub) { T.endpoint = ''; JC.del('tk.endpoint'); paint(); return; }
      rpc('tickets_subscribe', { p_code: T.code, p_sub: JSON.parse(JSON.stringify(sub)), p_station: T.station, p_lang: T.lang }, function () {});
    });
  }
  function turnOff(cb) {
    var ep = T.endpoint;
    T.endpoint = ''; JC.del('tk.endpoint');
    if (ep && T.code) { rpc('tickets_unsubscribe', { p_code: T.code, p_endpoint: ep }, function () {}); }
    if (canPush) {
      nav.serviceWorker.getRegistration('../').then(function (reg) {
        return reg && reg.pushManager.getSubscription();
      }).then(function (sub) { if (sub) { sub.unsubscribe(); } if (cb) { cb(); } }, function () { if (cb) { cb(); } });
    } else if (cb) { cb(); }
  }

  /* ── views ── */
  function vSetup() {
    return '<div class="setup"><img src="../../img/logo.png" alt="Josie\'s Cafe" width="96" height="112">' +
      '<button class="lang" data-act="lang">' + esc(s('langBtn')) + '</button>' +
      '<h1>Josie’s ' + esc(s('app')) + '</h1><p class="lbl">' + esc(s('pick')) + '</p>' +
      '<div class="seg">' + ['kitchen', 'bar'].map(function (st) {
        return '<button class="' + (T.station === st ? 'on' : '') + '" data-act="station" data-arg="' + st + '">' + esc(stationName(st)) + '</button>';
      }).join('') + '</div>' +
      '<form id="codeForm"><label class="lbl" for="code">' + esc(s('code')) + '</label>' +
      '<input id="code" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" value="">' +
      '<p class="help">' + esc(s('codeHelp')) + '</p><p class="msg">' + esc(T.msg) + '</p>' +
      '<button class="btn big" type="submit">' + esc(s('open')) + '</button></form>' +
      '<button class="link" data-act="register">' + esc(s('register')) + '</button></div>';
  }

  function vAlerts() {
    if (alertsOn()) { return ''; }
    var h = '<section class="alerts">';
    if (isIOS && !standalone) {
      h += '<b>' + esc(s('iosTitle')) + '</b><ol><li>' + esc(s('ios1')) + ' <span class="share" aria-hidden="true">' + shareIcon() + '</span></li>' +
        '<li>' + esc(s('ios2')) + '</li><li>' + esc(s('ios3')) + '</li></ol><small>' + esc(s('iosOld')) + '</small>';
    } else if (!canPush) {
      h += '<p>' + esc(s('noPush')) + '</p>';
    } else if (w.Notification.permission === 'denied') {
      h += '<p>' + esc(s('blocked')) + '</p>';
    } else {
      h += '<p>' + esc(s('alertsWhy')) + '</p><button class="btn" data-act="alerts"' + (T.busy ? ' disabled' : '') + '>' +
        esc(T.busy ? s('turning') : s('turnOn')) + '</button>';
    }
    return h + (T.alertMsg ? '<p class="msg">' + esc(T.alertMsg) + '</p>' : '') + '</section>';
  }

  function vTicket(o) {
    var cls = 'tk' + (o.done ? ' done' : '') + (T.fresh[o.id] && Date.now() - T.fresh[o.id] < 60000 ? ' fresh' : '') + (T.focus === o.id ? ' focus' : ''),
      meta = [], h;
    if (o.name) { meta.push(esc(o.name)); }
    meta.push(clock(o.created_at));
    if (!o.done) { meta.push(ago(o.created_at)); }
    h = '<article class="' + cls + '" id="t-' + esc(o.id) + '"><div class="th"><span class="num">' + esc(o.number) + '</span>' +
      (o.done ? '<span class="kind ok">✓ ' + esc(s('done')) + '</span>' :
        '<span class="kind' + (o.type === 'togo' ? ' togo' : '') + '">' + esc(o.type === 'togo' ? s('togo') : s('here')) + '</span>') + '</div>' +
      '<p class="meta">' + meta.join(' · ') + '</p>';
    if (o.source === 'online') {
      h += '<p class="pick">' + esc(s('online')) + (o.pickup_at ? ' · ' + esc(s('pickup')) + ' ' + esc(clock(o.pickup_at)) : '') + '</p>';
    }
    h += '<ul>';
    (o.items || []).forEach(function (i) {
      h += '<li><b class="q">' + esc(i.qty) + '</b><span class="n">' + esc(i.name) + (i.note ? '<em>' + esc(i.note) + '</em>' : '') + '</span></li>';
    });
    h += '</ul>';
    if (o.note) { h += '<p class="onote"><b>' + esc(s('note')) + ':</b> ' + esc(o.note) + '</p>'; }
    return h + '</article>';
  }

  function vFeed() {
    var h = '<header class="top"><div class="ttl"><h1>' + esc(stationName(T.station)) + '</h1>' +
      '<span class="st ' + (T.live ? 'on' : 'off') + '"><i></i>' + esc(T.live ? s('live') : (T.lastOk ? s('offline') + ' ' + clock(T.lastOk) : s('noNet'))) + '</span></div>' +
      (alertsOn() ? '<span class="bell" title="' + esc(s('alertsOn')) + '">' + bellIcon() + '</span>' : '') +
      '<button class="menu-btn" data-act="menu" aria-label="' + esc(s('settings')) + '">' + dotsIcon() + '</button></header>';
    h += vAlerts() + '<main class="list">';
    T.tickets.forEach(function (o) { h += vTicket(o); });
    if (!T.tickets.length) { h += '<p class="empty">' + esc(T.loaded || T.lastOk ? s('none') : '…') + '</p>'; }
    h += '</main>';
    if (T.menu) {
      var other = T.station === 'bar' ? 'kitchen' : 'bar';
      h += '<div class="sheet" data-act="menu"><div class="sheet-in"><b>' + esc(s('settings')) + '</b>' +
        '<button data-act="station" data-arg="' + other + '">' + esc(s('switchTo')) + ' ' + esc(stationName(other)) + '</button>' +
        '<button data-act="lang">' + esc(s('langBtn')) + '</button>' +
        (alertsOn() ? '<button data-act="alertsoff">' + esc(s('alertsOff')) + '</button>' : '') +
        '<button data-act="forget">' + esc(s('forget')) + '</button>' +
        '<button class="soft" data-act="menu">' + esc(s('close')) + '</button></div></div>';
    }
    return h;
  }

  function paint() {
    d.documentElement.lang = T.lang;
    var y = w.pageYOffset;
    app.innerHTML = T.code ? vFeed() : vSetup();
    if (T.code) { w.scrollTo(0, y); }
  }

  function bellIcon() { return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>'; }
  function dotsIcon() { return '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>'; }
  function shareIcon() { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>'; }

  /* ── actions ── */
  function signOut(msg) {
    turnOff();
    T.code = ''; JC.del('tk.code'); JC.del('tk.cache');
    T.tickets = []; T.seen = null; T.menu = false; T.msg = msg || ''; T.lastOk = 0; T.loaded = false;
    paint();
  }
  function submitCode() {
    var v = ($('code').value || '').replace(/\D/g, '');
    if (v.length !== 6) { T.msg = s('badCode'); paint(); return; }
    T.msg = ''; paint();
    rpc('tickets_feed', { p_code: v, p_station: T.station, p_lang: T.lang }, function (err, data, status) {
      if (err) { T.msg = status === 0 ? s('noNet') : s('badCode'); paint(); return; }
      if (!data || data.ok === false) { T.msg = s('badCode'); paint(); return; }
      T.code = v; JC.set('tk.code', v);
      T.seen = null; poll();
    });
  }
  function focusFromHash() {
    var m = /[#&]o=([0-9a-f-]{36})/i.exec(w.location.hash || '');
    if (!m) { return; }
    T.focus = m[1]; paint();
    var el = $('t-' + m[1]);
    if (el && el.scrollIntoView) { el.scrollIntoView(); w.scrollBy(0, -80); }
  }

  app.addEventListener('click', function (ev) {
    unlockAudio();
    var el = ev.target;
    while (el && el !== app && !(el.getAttribute && el.getAttribute('data-act'))) { el = el.parentNode; }
    if (!el || el === app || el.disabled) { return; }
    var act = el.getAttribute('data-act'), arg = el.getAttribute('data-arg');
    if (act === 'menu' && el.className === 'sheet' && ev.target !== el) { return; }   // taps inside the sheet
    ev.preventDefault();
    switch (act) {
      case 'station': T.station = arg; JC.set('tk.station', arg); T.menu = false; T.tickets = []; T.seen = null; T.loaded = false; paint(); poll(); resubscribe(); break;
      case 'lang': T.lang = T.lang === 'es' ? 'en' : 'es'; JC.set('tk.lang', T.lang); T.menu = false; paint(); poll(); resubscribe(); break;
      case 'menu': T.menu = !T.menu; paint(); break;
      case 'alerts': turnOn(); break;
      case 'alertsoff': T.menu = false; turnOff(function () { paint(); }); paint(); break;
      case 'forget': signOut(''); break;
      case 'register': JC.set('pos.phoneRegister', true); w.location.href = '../'; break;
    }
  }, false);
  app.addEventListener('submit', function (ev) { ev.preventDefault(); unlockAudio(); if (ev.target.id === 'codeForm') { submitCode(); } }, true);

  /* ── start ── */
  if (canPush) {
    try { nav.serviceWorker.register('../sw.js', { scope: '../' }); } catch (e) {}
    nav.serviceWorker.addEventListener('message', function (ev) {
      if (ev.data && ev.data.open) { w.location.hash = ev.data.open.split('#')[1] || ''; focusFromHash(); poll(); }
    });
  } else if ('serviceWorker' in nav) {
    try { nav.serviceWorker.register('../sw.js', { scope: '../' }); } catch (e) {}
  }
  w.addEventListener('hashchange', focusFromHash, false);
  d.addEventListener('visibilitychange', function () { if (!d.hidden) { poll(); } }, false);
  w.setInterval(function () { if (!d.hidden) { poll(); } }, POLL_MS);
  w.setInterval(function () { if (T.code && !d.hidden && !T.menu) { paint(); } }, 30000);   // keep "3 min" ages fresh
  paint();
  poll();
  focusFromHash();
}(window, document, window.JC));
