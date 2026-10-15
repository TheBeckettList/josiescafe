/* Josie's World · shared UI pieces: top bar, avatars, icons from the art kit, small controls. Plain ES5. */
(function (w, d, JC) {
  'use strict';
  var J = w.J2, S = J.S, esc = J.esc, ART = w.J2ART;
  var U = J.ui = {};

  /* ───────────── which menu icon a dish or category wears (the art kit has the pictures) ───────────── */
  var NAME_ICON = [
    [/iced|frapp/i, 'iced-coffee'], [/smoothie|sunrise|sunset|limeade|slush/i, 'smoothie'], [/juice|soda/i, 'juice'], [/water/i, 'water'],
    [/full plate/i, 'full-plate'], [/avocado toast/i, 'avocado-toast'], [/blt|sandwich/i, 'sandwich'], [/fruit bowl/i, 'fruit-bowl'], [/pancake/i, 'pancakes'],
    [/burger/i, 'burger'], [/salad/i, 'salad'], [/fries/i, 'fries'], [/taco/i, 'tacos'], [/baleada/i, 'baleada'], [/croissant/i, 'croissant'],
    [/cinnamon roll/i, 'cinnamon-roll'], [/banana bread/i, 'banana-bread'], [/coconut bread/i, 'coconut-bread'], [/bagel|classic|high roller|oh so good/i, 'bagel'],
    [/espresso|americano|latte|cappuccino|chai|drip|coffee|flavor/i, 'hot-coffee']
  ];
  var CAT_ICON = [[/hot coffee/i, 'hot-coffee'], [/iced/i, 'iced-coffee'], [/smoothie/i, 'smoothie'], [/juice|water|soda/i, 'juice'], [/breakfast/i, 'full-plate'],
    [/bagel/i, 'bagel'], [/lunch/i, 'sandwich'], [/pastr/i, 'croissant']];
  function pick(list, name) { for (var i = 0; i < list.length; i++) { if (list[i][0].test(name)) { return list[i][1]; } } return null; }
  U.dishKey = function (item) {
    var en = JC.tr(item.name, 'en'), k = (ART.keyFor && ART.keyFor(en)) || pick(NAME_ICON, en);
    if (k) { return k; }
    var c = J.ix().catById[item.category_id];
    return (c && pick(CAT_ICON, JC.tr(c.name, 'en'))) || 'full-plate';
  };
  U.catKey = function (cat) { return pick(CAT_ICON, JC.tr(cat.name, 'en')) || 'full-plate'; };
  U.menuBg = function (key) { var e = ART.menu[key]; return e && e.bg ? e.bg : '#FBDDE6'; };
  U.dishArt = function (item, size) { return ART.svg('menu', U.dishKey(item), size || 64); };

  /* ───────────── small icons that are not in the kit ───────────── */
  U.ic = function (name, size, color) {
    var s = size || 22, c = color || 'currentColor', p = {
      back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="' + c + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
      x: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/>',
      check: '<path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="' + c + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
      gear: '<path d="M4.2 19.8l.9-4.3L16.2 4.4a2.3 2.3 0 0 1 3.3 0l.1.1a2.3 2.3 0 0 1 0 3.3L8.5 18.9z" fill="none" stroke="' + c + '" stroke-width="2.4" stroke-linejoin="round"/><path d="M14.2 6.4l3.4 3.4M5.1 15.5l3.4 3.4" fill="none" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/>',
      leaf: '<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14z" fill="#8FB98B"/><path d="M5 19L13 11" stroke="#5E8A4C" stroke-width="2" stroke-linecap="round"/>',
      wheat: '<path d="M12 21V8M12 8c-3-1-4-3-4-5 3 1 4 3 4 5zm0 0c3-1 4-3 4-5-3 1-4 3-4 5zm0 5c-3-1-4-3-4-5 3 1 4 3 4 5zm0 0c3-1 4-3 4-5-3 1-4 3-4 5z" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/><path d="M4 20L20 4" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/>',
      cup: '<path d="M5 9h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" fill="#F5B5C8"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" fill="none" stroke="#F5B5C8" stroke-width="2.2"/>',
      lock: '<rect x="5" y="11" width="14" height="10" rx="3" fill="' + c + '"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="' + c + '" stroke-width="2.4"/>',
      clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="' + c + '" stroke-width="2.4"/><path d="M12 7v5l3 2" fill="none" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/>',
      link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/>',
      star: '<path d="M12 2.8l2.8 6 6.6.7-4.9 4.5 1.4 6.5L12 17.2 6.1 20.5l1.4-6.5L2.6 9.5l6.6-.7z" fill="' + c + '"/>',
      heart: '<path d="M12 20S4 14.5 4 9a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.5-8 11-8 11z" fill="none" stroke="' + c + '" stroke-width="2.4" stroke-linejoin="round"/>',
      sticky: '<circle cx="12" cy="9" r="6" fill="#fff" stroke="#F5B5C8" stroke-width="2.6"/><rect x="10.8" y="14" width="2.4" height="8" rx="1.2" fill="#C98A52"/>'
    }[name] || '';
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" aria-hidden="true" style="display:block;flex:none">' + p + '</svg>';
  };
  U.dietIcon = function (key, color) {
    if (key === 'vegan') { return U.ic('leaf', 20); }
    if (key === 'gluten_free') { return U.ic('wheat', 20, color || '#B55573'); }
    return '<span class="kk">K</span>';
  };

  U.avatar = function (name, size) {
    var s = size || 40;
    return '<span class="avatar" style="width:' + s + 'px;height:' + s + 'px;font-size:' + Math.round(s * 0.48) + 'px">' + esc((name || '?').charAt(0).toUpperCase()) + '</span>';
  };

  /* the top bar of the manager/register app */
  U.topbar = function (tab, opts) {
    opts = opts || {};
    var tabs = [['pos', J.t('pos')], ['overview', J.t('overview')]];
    if (J.can('manager')) { tabs.push(['manager', J.t('manager')]); }
    var h = '<header class="top"><span class="brand"><img src="../img/josies-wordmark.png" alt="' + J.t('app') + '" height="36"></span><span class="grow"></span>';
    if (!opts.back) {
      h += '<div class="tabs">';
      for (var i = 0; i < tabs.length; i++) { h += '<button type="button" class="tab' + (tab === tabs[i][0] ? ' on' : '') + '" data-act="tab" data-arg="' + tabs[i][0] + '">' + tabs[i][1] + '</button>'; }
      h += '</div>';
    } else { h += opts.back; }
    h += '<span class="grow"></span>' + U.statusPill() + '<button type="button" class="qbtn" data-act="help" aria-label="Help">?</button>' + U.langToggle() +
      '<span class="clock">' + J.clock() + '</span>' +
      '<button type="button" class="avatar-btn" data-act="me" aria-label="' + esc(S.person ? S.person.name : '') + '">' + U.avatar(S.person ? S.person.name : '?') + '</button></header>';
    return h;
  };
  U.langToggle = function () {
    return '<span class="lang"><button type="button" data-act="lang" data-arg="en" class="' + (S.lang === 'en' ? 'on' : '') + '">EN</button>' +
      '<button type="button" data-act="lang" data-arg="es" class="' + (S.lang === 'es' ? 'on' : '') + '">ES</button></span>';
  };
  /* offline is shown as an amber band, never hidden */
  U.statusPill = function () {
    var q = S.queue.length;
    if (!S.online) { return '<span class="pill warn">' + J.t('offlineBand').split('.')[0] + (q ? ' · ' + q + ' ' + J.t('toSync') : '') + '</span>'; }
    if (q) { return '<span class="pill warn">' + q + ' ' + J.t('toSync') + '</span>'; }
    return '';
  };
  U.band = function () {
    if (!S.online) { return '<div class="band amber">' + esc(J.t('offlineBand')) + '</div>'; }
    if (S.backBand) { return '<div class="band green">' + esc(J.t('backOnline')) + ' ' + S.backBand + ' ' + J.t('sent') + '.</div>'; }
    return '';
  };

  /* the small round buttons: ? and the close X */
  U.roundBtn = function (act, inner, label, arg, on) {
    return '<button type="button" class="rb' + (on ? ' on' : '') + '" data-act="' + act + '"' + (arg !== undefined ? ' data-arg="' + esc(arg) + '"' : '') + ' aria-label="' + esc(label || '') + '">' + inner + '</button>';
  };

  /* an ingredient as a round dot (26px on tiles, bigger on tickets). state: in | no | swap | back | add */
  U.dot = function (ingId, state, size, withId) {
    var s = size || 26, inner = J.ingIcon(ingId, Math.round(s * 0.92)), cls = 'dot ' + (state || 'in');
    var slash = state === 'no' || (state === 'swap');
    return '<span class="' + cls + '" style="width:' + s + 'px;height:' + s + 'px">' + (slash ? '<span class="dimmed">' + inner + '</span><i class="slash"></i>' : inner) +
      (state === 'swap' && withId ? '<b class="swapb">⇄</b>' : '') + (state === 'add' ? '<b class="plusb">+</b>' : '') + '</span>';
  };

  U.toggle = function (on, act, arg, label) {
    return '<button type="button" class="tg' + (on ? ' on' : '') + '" data-act="' + act + '"' + (arg !== undefined ? ' data-arg="' + esc(arg) + '"' : '') + ' aria-pressed="' + (on ? 'true' : 'false') + '" aria-label="' + esc(label || '') + '"></button>';
  };
}(window, document, window.JC));
