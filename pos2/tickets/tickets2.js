/* Josie's Tickets (new look). Enter the 6-digit code once; then it is just the tickets, one per screen. Nothing to tap, mark or press.
   Reads tickets2_feed. Plain ES5. */
(function (w, d, JC, T) {
  'use strict';
  var STR = {
    en: { pick: 'Which tickets?', code: 'Ticket code', help: 'Find it on the register: Manage › Ticket phones.', open: 'Open tickets', bad: 'That code isn’t right.', nonet: 'No internet. Try again.',
      live: 'Live', off: 'No internet · showing the last tickets', settings: 'Settings', sw: 'Switch to', lang: 'Español', forget: 'Sign out (forget the code)', close: 'Close', kitchen: 'Kitchen', bar: 'Bar' },
    es: { pick: '¿Qué tickets?', code: 'Código de tickets', help: 'Lo encuentras en la caja: Manage › Ticket phones.', open: 'Abrir tickets', bad: 'Ese código no es correcto.', nonet: 'Sin internet. Inténtalo de nuevo.',
      live: 'En vivo', off: 'Sin internet · últimos tickets', settings: 'Ajustes', sw: 'Cambiar a', lang: 'English', forget: 'Salir (olvidar el código)', close: 'Cerrar', kitchen: 'Cocina', bar: 'Bar' }
  };
  var app = d.getElementById('app');
  var S = { code: JC.get('tk.code', ''), station: JC.get('tk.station', 'kitchen'), lang: JC.get('tk.lang', /^es/i.test(w.navigator.language || '') ? 'es' : 'en'),
    feed: (JC.get('tk.feed2', null)), live: false, menu: false, msg: '', skew: 0 };
  function s(k) { return STR[S.lang][k]; }
  function esc(x) { return JC.esc(x === null || x === undefined ? '' : String(x)); }
  function rpc(name, body, cb) { JC.rest('POST', 'rpc/' + name, body, null, cb); }
  function paint() {
    d.documentElement.lang = S.lang;
    var keep = app.querySelector('.tv-scroll'), top = keep ? keep.scrollTop : 0, h;
    if (!S.code) {
      h = '<div class="setup"><img src="../../img/logo.png" alt="Josie\'s Cafe"><h1>Josie’s</h1><p>' + esc(s('pick')) + '</p><div class="seg">' +
        ['kitchen', 'bar'].map(function (k) { return '<button type="button" class="' + (S.station === k ? 'on' : '') + '" data-act="station" data-arg="' + k + '">' + esc(s(k)) + '</button>'; }).join('') + '</div>' +
        '<form id="codeForm"><input id="code" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" aria-label="' + esc(s('code')) + '"><p class="help">' + esc(s('help')) + '</p><p class="msg">' + esc(S.msg) + '</p>' +
        '<button class="btn" type="submit">' + esc(s('open')) + '</button></form></div>';
    } else {
      h = '<header class="top"><h1>' + esc(s(S.station)) + '</h1><small class="' + (S.live ? '' : 'off') + '"><i></i>' + esc(S.live ? s('live') : s('off')) + '</small>' +
        '<button type="button" class="dots" data-act="menu" aria-label="' + esc(s('settings')) + '">&middot;&middot;&middot;</button></header><div class="feed">' +
        T.list(S.feed || { tickets: [], alerts: [] }, { lang: S.lang, station: S.station, skew: S.skew, id: 'tv', scrollKey: 'tv' }) + '</div>';
      if (S.menu) {
        var other = S.station === 'bar' ? 'kitchen' : 'bar';
        h += '<div class="sheet" data-act="menu"><div class="sheet-in"><button type="button" data-act="station" data-arg="' + other + '">' + esc(s('sw')) + ' ' + esc(s(other)) + '</button>' +
          '<button type="button" data-act="lang">' + esc(s('lang')) + '</button><button type="button" data-act="forget">' + esc(s('forget')) + '</button><button type="button" data-act="menu">' + esc(s('close')) + '</button></div></div>';
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
      S.live = true; S.feed = data; try { S.skew = new Date(data.now).getTime() - Date.now(); S.skew = 0; } catch (e) {}
      JC.set('tk.feed2', data); T.chime(data); paint();
    });
  }
  app.addEventListener('click', function (ev) {
    var el = ev.target, act, arg;
    while (el && el !== app && !(el.getAttribute && el.getAttribute('data-act'))) { el = el.parentNode; }
    if (!el || el === app) { return; }
    act = el.getAttribute('data-act'); arg = el.getAttribute('data-arg');
    if (act === 'menu' && el.className === 'sheet' && ev.target !== el) { return; }
    ev.preventDefault();
    if (act === 'station') { S.station = arg; JC.set('tk.station', arg); S.feed = null; S.menu = false; paint(); poll(); }
    else if (act === 'lang') { S.lang = S.lang === 'es' ? 'en' : 'es'; JC.set('tk.lang', S.lang); S.menu = false; paint(); poll(); }
    else if (act === 'menu') { S.menu = !S.menu; paint(); }
    else if (act === 'forget') { S.code = ''; JC.del('tk.code'); JC.del('tk.feed2'); S.feed = null; S.menu = false; paint(); }
  }, false);
  app.addEventListener('submit', function (ev) {
    ev.preventDefault(); var v = (d.getElementById('code').value || '').replace(/\D/g, '');
    if (v.length !== 6) { S.msg = s('bad'); paint(); return; }
    rpc('tickets2_feed', { p_code: v, p_station: S.station, p_lang: S.lang }, function (err, data, status) {
      if (err) { S.msg = status === 0 ? s('nonet') : s('bad'); paint(); return; }
      if (!data || data.ok === false) { S.msg = s('bad'); paint(); return; }
      S.code = v; JC.set('tk.code', v); S.msg = ''; S.feed = data; S.live = true; paint();
    });
  }, true);
  d.addEventListener('visibilitychange', function () { if (!d.hidden) { poll(); } }, false);
  w.setInterval(function () { if (!d.hidden) { poll(); } }, 4000);
  paint(); poll();
}(window, document, window.JC, window.J2T));
