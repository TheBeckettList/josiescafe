/* Josie's World · the ticket view. ONE ticket per screen, same item size, icon chips for without / add / swap, ADD-ON pieces,
   pinned STOPPED / CHANGED alerts that clear themselves. Read only: nothing here is tappable. Shared by the map popups (POS app)
   and the cooks' phones. Needs art/art.js. Plain ES5. */
(function (w, d) {
  'use strict';
  var T = w.J2T = {};
  var ART = w.J2ART;

  var STR = {
    en: { stick: 'Stick', forHere: 'For here', toGo: 'To go', online: 'Online', now: 'now', min: 'min', addon: 'ADD-ON', neu: 'new', no: 'NO', scroll: 'scroll for more',
      stopped: 'STOPPED', changed: 'CHANGED', from: 'FROM REGISTER', clears: 'clears', stopMsg: 'Take it off. If it is made, tell the counter.', addonWaiting: 'add-on waiting',
      empty: 'No tickets yet.', live: 'Live', tickets: 'tickets', ticket: 'ticket', kitchen: 'Kitchen', bar: 'Bar', counter: 'Counter' },
    es: { stick: 'Palito', forHere: 'Aquí', toGo: 'Para llevar', online: 'En línea', now: 'ahora', min: 'min', addon: 'EXTRA', neu: 'nuevo', no: 'SIN', scroll: 'desliza para ver más',
      stopped: 'PARAR', changed: 'CAMBIO', from: 'DESDE LA CAJA', clears: 'se quita', stopMsg: 'Quítalo. Si ya está hecho, avisa en el mostrador.', addonWaiting: 'extra esperando',
      empty: 'Todavía no hay tickets.', live: 'En vivo', tickets: 'tickets', ticket: 'ticket', kitchen: 'Cocina', bar: 'Bar', counter: 'Mostrador' }
  };
  function s(lang, k) { return (STR[lang] || STR.en)[k]; }
  T.str = s;
  function esc(x) { return String(x === null || x === undefined ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* which picture a dish wears, from its English name */
  var NAME_ICON = [
    [/iced|frapp/i, 'iced-coffee'], [/smoothie|sunrise|sunset|limeade|slush/i, 'smoothie'], [/juice|soda/i, 'juice'], [/water/i, 'water'],
    [/full plate/i, 'full-plate'], [/avocado toast/i, 'avocado-toast'], [/blt|sandwich/i, 'sandwich'], [/fruit bowl/i, 'fruit-bowl'], [/pancake/i, 'pancakes'],
    [/burger/i, 'burger'], [/salad/i, 'salad'], [/fries/i, 'fries'], [/taco/i, 'tacos'], [/baleada/i, 'baleada'], [/croissant/i, 'croissant'],
    [/cinnamon roll/i, 'cinnamon-roll'], [/banana bread/i, 'banana-bread'], [/coconut bread/i, 'coconut-bread'], [/bagel|classic|high roller|oh so good/i, 'bagel'],
    [/espresso|americano|latte|cappuccino|chai|drip|coffee|flavor/i, 'hot-coffee']
  ];
  T.dishKey = function (en, station) {
    for (var i = 0; i < NAME_ICON.length; i++) { if (NAME_ICON[i][0].test(en || '')) { return NAME_ICON[i][1]; } }
    return station === 'bar' ? 'hot-coffee' : 'full-plate';
  };
  function ico(icon, size) {
    if (!icon || !ART) { return ''; }
    var p = icon.split(':'); return ART.svg(p[0] === 'menu' ? 'menu' : 'ing', p[1], size);
  }
  function slashed(icon, size) {
    return '<span class="tv-sl"><span class="tv-dim">' + ico(icon, size) + '</span><i></i></span>';
  }
  function dietLetter(txt) { var t = (txt || '').toLowerCase(); return t.indexOf('vegan') === 0 ? 'V' : t.indexOf('gluten') === 0 ? 'GF' : 'K'; }

  /* a chip: without / add / swap / put back, with the diet that caused it written out */
  function chip(c, lang) {
    var name = c.ing && c.ing.name ? c.ing.name : '', h = '';
    if (c.type === 'no') {
      h = '<span class="tv-chip no"><span class="tv-cd">' + slashed(c.ing.icon, 26) + '</span>' + esc(s(lang, 'no')) + ' ' + esc(name.toLowerCase()) + '</span>';
    } else if (c.type === 'add') {
      h = '<span class="tv-chip add"><span class="tv-cd">' + ico(c.ing.icon, 26) + '</span>+ ' + esc(name.toLowerCase()) + '</span>';
    } else if (c.type === 'swap') {
      h = '<span class="tv-chip swap"><span class="tv-cd">' + slashed(c.ing.icon, 26) + '</span><b>&rarr;</b><span class="tv-cd">' + ico(c.with && c.with.icon, 26) + '</span>' +
        esc(((c.with && c.with.name) || '').toLowerCase()) + '</span>';
    } else if (c.type === 'back') {
      h = '<span class="tv-chip back"><span class="tv-cd">' + ico(c.ing.icon, 26) + '</span>' + esc(name.toLowerCase()) + '</span>';
    }
    return h;
  }
  function itemRow(it, lang, station) {
    var key = T.dishKey(it.en || it.name, station), chips = '', diets = {}, dl = '', i, c;
    for (i = 0; i < (it.chips || []).length; i++) {
      c = it.chips[i]; chips += chip(c, lang);
      if (c.diet && !diets[c.diet]) { diets[c.diet] = 1; chips += '<span class="tv-k">' + dietLetter(c.diet) + '</span>'; dl += (dl ? ' · ' : '') + esc(c.diet); }
    }
    return '<div class="tv-item' + (it.stopped ? ' stopped' : '') + '"><span class="tv-art">' + ART.svg('menu', key, 48) + '</span><span class="tv-it"><span class="tv-nm"><i>' + it.qty + '</i> ' + esc(it.name) + '</span>' +
      (chips ? '<span class="tv-chips">' + chips + '</span>' : '') + (dl ? '<span class="tv-dl">' + dl + '</span>' : '') + (it.note ? '<span class="tv-note">' + esc(it.note) + '</span>' : '') + '</span></div>';
  }

  /* minutes since, using the server clock so a wrong tablet clock cannot make tickets look old */
  function mins(t, nowIso, skew) {
    var now = nowIso ? new Date(nowIso).getTime() : Date.now();
    var m = Math.max(0, Math.floor((now + (skew || 0) - new Date(t.created_at).getTime()) / 60000));
    return m;
  }
  T.card = function (t, o) {
    o = o || {}; var lang = o.lang || 'en', st = o.station || 'kitchen', m = mins(t, o.now, o.skew), i, h, title, sub, numTxt;
    var isAdd = t.kind === 'addon', typeTxt = t.type === 'togo' ? s(lang, 'toGo') : s(lang, 'forHere');
    if (t.stick) { title = s(lang, 'stick') + ' ' + t.stick; numTxt = String(t.stick); }
    else { title = t.name || t.number; numTxt = (t.name || t.number || '?').charAt(0).toUpperCase(); }
    sub = typeTxt + (t.source === 'online' ? ' · ' + s(lang, 'online') : '') + (t.addons_waiting ? ' · +' + t.addons_waiting + ' ' + s(lang, 'addonWaiting') : '');
    h = '<article class="tv-card' + (isAdd ? ' add' : '') + '" data-id="' + esc(t.id) + '">';
    if (isAdd) {
      h += '<div class="tv-addhead"><span class="tv-addtag">' + s(lang, 'addon') + '</span><span class="tv-link"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="#2F6B58" stroke-width="2.4" stroke-linecap="round"/></svg> ' +
        s(lang, 'stick') + ' ' + esc(t.parent_stick || t.stick || '') + '</span><span class="tv-grow"></span>' + (m < 2 ? '<span class="tv-new">' + s(lang, 'neu') + '</span>' : '<span class="tv-min">' + m + ' ' + s(lang, 'min') + '</span>') + '</div>';
    } else {
      h += '<div class="tv-head"><span class="tv-num">' + esc(numTxt) + '</span><span class="tv-ttl"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></span><span class="tv-min">' + (m < 1 ? s(lang, 'now') : m + ' ' + s(lang, 'min')) + '</span></div>';
    }
    for (i = 0; i < (t.items || []).length; i++) { h += itemRow(t.items[i], lang, st); }
    return h + '</article>';
  };

  /* pinned alerts: plum for STOPPED, amber for CHANGED. A draining bar shows how long until it clears itself. */
  T.alerts = function (feed, o) {
    o = o || {}; var lang = o.lang || 'en', h = '', i, a, now = feed.now ? new Date(feed.now).getTime() : Date.now(), pct, who;
    for (i = 0; i < (feed.alerts || []).length; i++) {
      a = feed.alerts[i];
      pct = Math.max(0, Math.min(100, Math.round((new Date(a.clears_at).getTime() - now) / Math.max(1, new Date(a.clears_at).getTime() - new Date(a.created_at).getTime()) * 100)));
      who = a.stick ? s(lang, 'stick') + ' ' + a.stick : (a.name || '');
      h += '<div class="tv-alert ' + (a.kind === 'stop' ? 'stop' : 'chg') + '" data-aid="' + esc(a.id) + '"><div class="tv-ah"><span>' + (a.kind === 'stop' ? s(lang, 'stopped') : s(lang, 'changed')) + ' · ' + s(lang, 'from') + '</span><span class="tv-clr">' + s(lang, 'clears') + '<i><b style="width:' + pct + '%"></b></i></span></div>' +
        '<div class="tv-at">' + esc(a.item || '') + (who ? ' · ' + esc(who) : '') + '</div><div class="tv-am">' + esc(a.text || (a.kind === 'stop' ? s(lang, 'stopMsg') : '')) + '</div></div>';
    }
    return h;
  };

  /* the whole list: alerts pinned on top, then one ticket per screen. data-scroll keeps the position through repaints. */
  T.list = function (feed, o) {
    o = o || {}; var lang = o.lang || 'en', tickets = feed && feed.tickets ? feed.tickets : [], h = '', i;
    h += '<div class="tv" id="' + (o.id || 'tv') + '">' + (feed && feed.alerts && feed.alerts.length ? '<div class="tv-alerts">' + T.alerts(feed, o) + '</div>' : '');
    h += '<div class="tv-wrap"><div class="tv-scroll" data-scroll="' + (o.scrollKey || 'tv') + '">';
    for (i = 0; i < tickets.length; i++) { h += T.card(tickets[i], { lang: lang, station: o.station, now: feed.now, skew: o.skew }); }
    if (!tickets.length) { h += '<p class="tv-empty">' + s(lang, 'empty') + '</p>'; }
    h += '</div><div class="tv-dots">';
    for (i = 0; i < tickets.length; i++) { h += '<i></i>'; }
    h += '</div><div class="tv-more" hidden>' + s(lang, 'scroll') + ' &darr;</div></div></div>';
    return h;
  };
  /* after each repaint: show the "scroll for more" cue only when the ticket on screen is longer than the screen */
  T.after = function (root) {
    var sc = root.querySelector('.tv-scroll'); if (!sc) { return; }
    var more = root.querySelector('.tv-more'), dots = root.querySelectorAll('.tv-dots i'), cards = sc.querySelectorAll('.tv-card');
    function update() {
      var mid = sc.scrollTop + sc.clientHeight / 2, cur = 0, i, c;
      for (i = 0; i < cards.length; i++) { if (cards[i].offsetTop <= mid) { cur = i; } }
      for (i = 0; i < dots.length; i++) { dots[i].className = i === cur ? 'on' : ''; }
      c = cards[cur];
      var its = c ? c.querySelectorAll('.tv-item') : [], last = its.length ? its[its.length - 1] : c;
      if (more) { more.hidden = !(last && (last.offsetTop + last.offsetHeight + (last === c ? 0 : c.offsetTop)) > (sc.scrollTop + sc.clientHeight - 6)); }
    }
    sc.onscroll = update; update();
  };
  /* a soft two-tone chime when a new alert appears (best effort: only after the person has touched the screen once) */
  var seen = {}, ctx = null;
  T.chime = function (feed) {
    var fresh = false, i, id;
    for (i = 0; i < (feed.alerts || []).length; i++) { id = feed.alerts[i].id; if (!seen[id]) { seen[id] = 1; fresh = true; } }
    if (!fresh || !w.AudioContext && !w.webkitAudioContext) { return; }
    try {
      ctx = ctx || new (w.AudioContext || w.webkitAudioContext)();
      var t0 = ctx.currentTime;
      [[660, 0], [880, 0.16]].forEach(function (n) {
        var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = n[0]; o.type = 'sine'; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, t0 + n[1]); g.gain.exponentialRampToValueAtTime(0.25, t0 + n[1] + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + n[1] + 0.3);
        o.start(t0 + n[1]); o.stop(t0 + n[1] + 0.32);
      });
    } catch (e) {}
  };
}(window, document));
