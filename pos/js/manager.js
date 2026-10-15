/* Josie's World · Manager tab (day in review) and Payroll (Josie only). Station averages only: nothing here shows one person's speed.
   Staff never reach this screen; the server checks the role again on every call. Plain ES5. */
(function (w) {
  'use strict';
  var J = w.J2, S = J.S, U = J.ui, ART = w.J2ART, T = w.J2T, M = J.mgr = { rev: null, pay: null, busy: false, err: '', view: 'day', start: null };
  function esc(x) { return J.esc ? J.esc(x) : String(x === null || x === undefined ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var X = {
    en: { sales: 'sales', orders: 'orders', online: 'online', wait: 'average wait', busiest: 'busiest 15 min', loved: 'Most loved', low: 'Ran low today', out: 'out', lowWord: 'low', day: 'Today by the quarter hour',
      darker: 'Darker = busier', bar: 'Bar', kitchen: 'Kitchen', none: 'Nothing yet today.', payroll: 'Payroll', onlyJosie: 'Only Josie', back: 'Back', toPay: 'To pay', cash: 'Cash', transfer: 'Transfer', undo: 'Undo',
      needNet: 'Needs internet. Try again in a moment.', loading: 'Loading…', min: 'min', empty: 'No one to pay in this period.',
      phones: 'Kitchen and bar phones', phoneLink: 'Open this link on the phone', phoneCode: 'Ticket code', phoneHow: 'Then tap Share › Add to Home Screen, open it from there, and tap Turn on alerts.', phoneCount: 'phones with alerts on', newCode: 'New code', newCodeAsk: 'Make a new code? Every phone has to type it again and alerts stop until they do.', share: 'Share link', kitchen2: 'Kitchen', bar2: 'Bar' },
    es: { sales: 'ventas', orders: 'pedidos', online: 'en línea', wait: 'espera promedio', busiest: 'los 15 min más ocupados', loved: 'Lo más pedido', low: 'Se acabó hoy', out: 'agotado', lowWord: 'poco', day: 'Hoy cada cuarto de hora',
      darker: 'Más oscuro = más ocupado', bar: 'Bar', kitchen: 'Cocina', none: 'Todavía nada hoy.', payroll: 'Planilla', onlyJosie: 'Solo Josie', back: 'Atrás', toPay: 'Por pagar', cash: 'Efectivo', transfer: 'Transferencia', undo: 'Deshacer',
      needNet: 'Necesita internet. Inténtalo en un momento.', loading: 'Cargando…', min: 'min', empty: 'Nadie por pagar en este período.',
      phones: 'Teléfonos de cocina y bar', phoneLink: 'Abre este enlace en el teléfono', phoneCode: 'Código de tickets', phoneHow: 'Luego toca Compartir › Agregar a pantalla de inicio, ábrelo desde ahí y toca Activar avisos.', phoneCount: 'teléfonos con avisos', newCode: 'Código nuevo', newCodeAsk: '¿Hacer un código nuevo? Cada teléfono tendrá que escribirlo otra vez y los avisos paran hasta entonces.', share: 'Compartir enlace', kitchen2: 'Cocina', bar2: 'Bar' }
  };
  function t(k) { return (X[S.lang] || X.en)[k]; }
  function money(n) { return JC.money(n, 'L '); }
  function icoOf(icon, size) { if (!icon) { return ''; } var p = icon.split(':'); return ART.svg(p[0] === 'menu' ? 'menu' : 'ing', p[1], size); }

  function load() {
    if (M.busy || !S.person || !S.person.token) { return; }
    M.busy = true;
    J.call('day_review', { p_token: S.person.token }, function (err, r) { M.busy = false; M.err = err ? t('needNet') : ''; if (r) { M.rev = r; } J.changed(); });
  }
  function loadPhones() {
    J.api('GET', 'ticket_link?select=code', null, function (e, rows) { if (!e && rows && rows[0]) { M.code = rows[0].code; J.changed(); } });
    J.call('tickets_phones', {}, function (e, c) { if (!e && c) { M.phones = c; J.changed(); } });
  }
  function phonesCard() {
    var link = 'https://josiescafe.com/pos/tickets/';
    return '<div class="pcard mphones"><h3>' + esc(t('phones')) + '</h3><p class="psub">' + esc(t('phoneLink')) + '</p><div class="plink">' + esc(link.replace('https://', '')) + '</div>' +
      '<div class="pcode"><small>' + esc(t('phoneCode')) + '</small><b>' + esc(M.code || '······') + '</b></div>' +
      '<p class="psub">' + esc(t('phoneHow')) + '</p><p class="psub"><b>' + (M.phones ? M.phones.kitchen : 0) + '</b> ' + esc(t('kitchen2')) + ' · <b>' + (M.phones ? M.phones.bar : 0) + '</b> ' + esc(t('bar2')) + ' — ' + esc(t('phoneCount')) + '</p>' +
      '<div class="prow3"><button type="button" class="pbtn ghost" data-act="phShare">' + esc(t('share')) + '</button><button type="button" class="pbtn ghost" data-act="phNew">' + esc(t('newCode')) + '</button></div></div>';
  }
  function period(offset) {
    var n = new Date(Date.now() - 6 * 3600 * 1000), y = n.getUTCFullYear(), m = n.getUTCMonth(), half = n.getUTCDate() <= 15 ? 0 : 1, idx = y * 24 + m * 2 + half + (offset || 0);
    y = Math.floor(idx / 24); m = Math.floor((idx % 24) / 2); half = idx % 2;
    function iso(yy, mm, dd) { return yy + '-' + ('0' + (mm + 1)).slice(-2) + '-' + ('0' + dd).slice(-2); }
    var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return { start: iso(y, m, half ? 16 : 1), end: iso(y, m, half ? last : 15), label: (half ? 16 : 1) + ' – ' + (half ? last : 15) + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m] };
  }
  function loadPay() {
    if (!J.can('josie') || !S.person.token) { return; }
    var p = period(M.off || 0); M.per = p;
    J.call('payroll_view', { p_token: S.person.token, p_start: p.start, p_end: p.end }, function (err, r) { M.err = err ? t('needNet') : ''; if (r) { M.pay = r; } J.changed(); });
  }

  function card(big, small) { return '<div class="mcard"><b>' + big + '</b><small>' + esc(small) + '</small></div>'; }
  function dayView() {
    var r = M.rev, i, b, max = 1, k, bars = '', l, nowQ, left, right, mapCard, chartCard;
    if (!r) { return '<p class="empty">' + esc(M.err || t('loading')) + '</p>'; }
    function chip(name, mins, x, y) { return '<span class="mchip" style="left:' + x + '%;top:' + y + '%"><i></i>' + esc(name) + ' · ' + (mins ? mins + ' ' + t('min') : '—') + '</span>'; }
    mapCard = '<div class="pcard mmapcard"><div class="mmap" style="background-image:url(../img/world/map.png?v=2)">' + chip(t('bar'), r.bar_wait, 40, 10) + chip(t('kitchen'), r.kitchen_wait, 66, 14) + '</div></div>';
    for (k in r.buckets) { if (r.buckets.hasOwnProperty(k)) { max = Math.max(max, r.buckets[k]); } }
    var hn = new Date(Date.now() - 6 * 3600 * 1000); nowQ = hn.getUTCHours() * 4 + Math.floor(hn.getUTCMinutes() / 15);
    for (i = 24; i <= 58; i++) { b = r.buckets[i] || 0; bars += '<i class="' + (i === nowQ ? 'now' : '') + '" style="height:' + Math.max(5, Math.round(b / max * 78)) + 'px;opacity:' + (i > nowQ && nowQ >= 24 && nowQ <= 58 ? .28 : (b ? 0.4 + 0.6 * b / max : 0.28)) + '"></i>'; }
    chartCard = '<div class="pcard mbars"><div class="mhead"><h3>' + esc(t('day')) + '</h3><span class="mtime">' + esc(J.clock()) + '</span></div><div class="bars">' + bars + '</div><div class="bax"><span>6 am</span><span>8</span><span>10</span><span>12</span><span>2 pm</span></div><small>' + esc(t('darker')) + '</small></div>';
    left = mapCard + chartCard;
    right = '<div class="mstats">' + card(money(r.sales), t('sales')) + card(r.orders, t('orders') + ' · ' + r.online + ' ' + t('online')) + card(r.avg_wait ? r.avg_wait + ' ' + t('min') : '—', t('wait')) + card(r.busiest || '—', t('busiest')) + '</div>' +
      '<div class="pcard mloved"><h3>' + esc(t('loved')) + '</h3>';
    if (!r.loved.length) { right += '<p class="empty">' + esc(t('none')) + '</p>'; }
    for (i = 0; i < r.loved.length; i++) { right += '<div class="lrow"><i>' + (i + 1) + '</i><span class="lico">' + ART.svg('menu', T.dishKey(r.loved[i].name, ''), 38) + '</span><b>' + esc(r.loved[i].name) + '</b><em>' + r.loved[i].qty + '</em></div>'; }
    right += '</div><div class="pcard mlow"><h3>' + esc(t('low')) + '</h3>';
    for (i = 0; i < r.low.length; i++) { l = r.low[i]; right += '<div class="lrow"><span class="lico">' + icoOf(l.icon, 38) + '</span><b>' + esc(l.name) + '</b><em>' + esc(l.light === 'red' ? t('out') : t('lowWord')) + ' ' + esc(l.at) + '</em></div>'; }
    if (!r.low.length) { right += '<p class="empty">' + esc(t('none')) + '</p>'; }
    right += '</div>';
    return '<div class="mgrid"><div class="mleft">' + left + '</div><div class="mright">' + right + '</div></div>' + phonesCard();
  }
  function payView() {
    var p = M.pay, h = '<div class="paytop"><div class="perpick"><button type="button" data-act="payPer" data-arg="-1">‹</button><b>' + esc(M.per ? M.per.label : '') + '</b><button type="button" data-act="payPer" data-arg="1">›</button></div><span class="topay">' + esc(t('toPay')) + ' <b>' + (p ? money(p.to_pay) : '') + '</b></span></div>', i, l;
    if (!p) { return h + '<p class="empty">' + esc(M.err || t('loading')) + '</p>'; }
    if (!p.lines.length) { h += '<p class="empty">' + esc(t('empty')) + '</p>'; }
    for (i = 0; i < p.lines.length; i++) {
      l = p.lines[i];
      h += '<div class="payrow' + (l.paid ? ' paid' : '') + '">' + U.avatar(l.name, 46) + '<span class="pn"><b>' + esc(l.name) + '</b><small>' + l.hours + ' h × L ' + l.rate + '</small></span><span class="pa">' + money(l.amount) + '</span>' +
        (l.paid ? '<span class="pchip">✓ ' + esc(t(l.method === 'transfer' ? 'transfer' : 'cash')) + '</span><button type="button" class="pbtn ghost" data-act="payMark" data-arg="' + l.person_id + '|">' + esc(t('undo')) + '</button>'
          : '<button type="button" class="pbtn" data-act="payMark" data-arg="' + l.person_id + '|cash">' + esc(t('cash')) + '</button><button type="button" class="pbtn ghost" data-act="payMark" data-arg="' + l.person_id + '|transfer">' + esc(t('transfer')) + '</button>') + '</div>';
    }
    return h;
  }
  M.screen = function () {
    if (M.view === 'team' && J.team && J.can('manager')) { return J.team.screen(); }
    var pay = M.view === 'pay' && J.can('josie');
    if (!pay && !M.rev && !M.busy) { w.setTimeout(load, 0); }
    if (!pay && !M.phonesLoaded) { M.phonesLoaded = true; w.setTimeout(loadPhones, 0); }
    if (pay && !M.pay && !M.payBusy) { M.payBusy = true; w.setTimeout(function () { M.payBusy = false; loadPay(); }, 0); }
    return '<div class="shell mgr">' + U.topbar('manager', pay ? { back: '<button type="button" class="backbtn" data-act="mgrBack" aria-label="' + esc(t('back')) + '">‹</button><b class="mtitle">' + esc(t('payroll')) + ' <span class="lockpill">🔒 ' + esc(t('onlyJosie')) + '</span></b>' } : {}) +
      '<div class="mbody">' + (pay ? payView() : (J.setup ? J.setup.card() : '') + dayView() + (J.team ? J.team.button() : '') + (J.can('josie') ? '<button type="button" class="paybtn mpayroll" data-act="mgrPay">' + esc(t('payroll')) + '</button>' : '')) + '</div></div>';
  };
  M.handle = function (act, arg) {
    var p;
    switch (act) {
      case 'phShare':
        if (w.navigator.share) { try { w.navigator.share({ title: "Josie's Tickets", url: 'https://josiescafe.com/pos/tickets/' }); } catch (e) {} }
        else if (w.navigator.clipboard) { w.navigator.clipboard.writeText('https://josiescafe.com/pos/tickets/'); }
        return true;
      case 'phNew': if (w.confirm(t('newCodeAsk'))) { J.call('tickets_new_code', {}, function (e, c) { if (!e && c) { M.code = c; M.phones = { kitchen: 0, bar: 0 }; J.changed(); } }); } return true;
      case 'mgrPay': M.view = 'pay'; M.pay = null; M.off = 0; J.changed(); return true;
      case 'mgrBack': M.view = 'day'; M.rev = null; M.phonesLoaded = false; J.changed(); return true;
      case 'payPer': M.off = (M.off || 0) + Number(arg); M.pay = null; J.changed(); return true;
      case 'payMark': p = arg.split('|'); J.call('payroll_mark', { p_token: S.person.token, p_period: M.pay.period_id, p_person: p[0], p_method: p[1] || null }, function (e) { if (!e) { loadPay(); } }); return true;
    }
    return false;
  };
  w.setInterval(function () { if (S.tab === 'manager' && M.view === 'day' && S.person && S.person.token) { load(); } }, 30000);
}(window));
