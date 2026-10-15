/* Josie's World · the Overview: Josie's from above. The real map, live sticks in the table pots, "making" bubbles, low-stock bubbles,
   every object a button that opens its screen as a popup. The rail on the right: For here, To go, Just done. Plain ES5. */
(function (w, d, JC) {
  'use strict';
  var J = w.J2, S = J.S, esc = J.esc, money = J.money, U = J.ui, ART = w.J2ART, T = w.J2T;
  var O = J.ov = { feed: { kitchen: null, bar: null }, skew: 0, tickSig: '' };
  function ui() { return S.ui; }

  /* ───────────── the map: everything in the map's own 1440 x 1240 space ───────────── */
  var MW = 1440, MH = 1240;
  var TABLES = {
    '1': { pot: [486, 343], box: [446, 346, 120, 78] }, '2': { pot: [674, 343], box: [634, 346, 120, 78] },
    '3': { pot: [964, 221], box: [924, 224, 120, 78] }, '4': { pot: [964, 333], box: [924, 336, 120, 78] },
    '5': { pot: [450, 530], box: [430, 506, 180, 108] }, '6': { pot: [634, 530], box: [614, 506, 180, 108] },
    '7': { pot: [472, 744], box: [438, 678, 110, 134] }, '8': { pot: [318, 880], box: [298, 856, 180, 104] },
    '9': { pot: [1106, 540], box: [1098, 520, 104, 126] }, '10': { pot: [1106, 818], box: [1098, 798, 104, 126] },
    '11': { pot: [1112, 651], box: [1098, 660, 72, 72] }, '12': { pot: [1184, 709], box: [1168, 718, 72, 72] },
    '13': { pot: [353, 348], box: [326, 326, 86, 184] }
  };
  var HIT = {
    kitchen: [[1266, 70, 118, 92], [1146, 212, 184, 216]], bar: [[610, 50, 130, 94]], grinder: [[556, 40, 54, 100]], fridge: [[892, 14, 158, 148]],
    menu: [[810, 166, 74, 46]], pastries: [[674, 180, 66, 66]], register: [[742, 214, 150, 34]], sign: [[114, 92, 132, 162]], 'pot-home': [[548, 166, 78, 76]], 'pot-wait': [[624, 180, 50, 62]]
  };
  var LABEL = { kitchen: 'Kitchen', bar: 'Bar', grinder: 'Coffee beans', fridge: 'Fridge', menu: 'Menu board', pastries: 'Pastries', register: 'Register', sign: 'Sign', 'pot-home': 'Home pot', 'pot-wait': 'Waiting pot' };

  function px(a) { return 'left:' + a[0] + 'px;top:' + a[1] + 'px;width:' + a[2] + 'px;height:' + a[3] + 'px;'; }
  function potSvg(l, t, n, extra) {
    return '<svg class="pot ' + (extra || '') + '" ' + (n ? 'data-pin="' + n + '"' : '') + ' style="position:absolute;left:' + l + 'px;top:' + t + 'px;z-index:3;overflow:visible" width="40" height="54" viewBox="0 0 30 40" aria-hidden="true">' +
      '<ellipse cx="15" cy="39" rx="11" ry="2.5" fill="#5B3843" opacity="0.14"/>' +
      (n ? '<rect x="13.8" y="12" width="2.4" height="16" rx="1.2" fill="#c98a52"/><circle cx="15" cy="8" r="8.5" fill="#FFFFFF" stroke="#F5B5C8" stroke-width="2.5"/><text x="15" y="8.5" text-anchor="middle" dominant-baseline="central" style="font-family:\'Baloo 2\',Nunito,sans-serif;font-weight:800;font-size:' + (String(n).length > 1 ? 8 : 10) + 'px" fill="#5B3843">' + n + '</text>' : '') +
      '<rect x="3" y="24" width="24" height="5" rx="2" fill="#f2a477"/><path d="M5 29 H25 L23 39 H7 Z" fill="#fbae7a"/><ellipse cx="15" cy="25" rx="10" ry="1.8" fill="#6b4130"/></svg>';
  }
  function homePotSvg(nums) {
    var h = '<svg style="position:absolute;left:552px;top:170px;z-index:3;overflow:visible;pointer-events:none" width="70" height="68" viewBox="0 0 54 52" aria-hidden="true">';
    var pos = [[12, 12, 15, 38, -14], [27, 8, 26, 38, 0], [42, 12, 37, 38, 14]], i;
    for (i = 0; i < nums.length && i < 3; i++) {
      h += '<rect x="' + pos[i][2] + '" y="' + (pos[i][4] === 0 ? 12 : 14) + '" width="2.4" height="' + (pos[i][4] === 0 ? 26 : 24) + '" rx="1.2" fill="#c98a52"' + (pos[i][4] ? ' transform="rotate(' + pos[i][4] + ' ' + (pos[i][2] + 1) + ' 38)"' : '') + '/>';
      h += '<circle cx="' + pos[i][0] + '" cy="' + pos[i][1] + '" r="8" fill="#FFFFFF" stroke="#F5B5C8" stroke-width="2.5"/><text x="' + pos[i][0] + '" y="' + (pos[i][1] + 0.5) + '" text-anchor="middle" dominant-baseline="central" style="font-family:\'Baloo 2\',Nunito,sans-serif;font-weight:800;font-size:10px" fill="#5B3843">' + nums[i] + '</text>';
    }
    return h + '<rect x="5" y="34" width="44" height="6" rx="2.5" fill="#f2a477"/><path d="M8 40 H46 L42 51 H12 Z" fill="#fbae7a"/><ellipse cx="27" cy="35" rx="19" ry="2.2" fill="#6b4130"/></svg>';
  }
  function makingBubble(kind, n) {
    var pos = kind === 'bar' ? 'left:626px;top:6px;width:98px;height:95px' : 'left:1252px;top:4px;width:90px;height:93px';
    var inner = kind === 'bar'
      ? '<path d="M28 52 L42 52 L35 64 Z" fill="#FFFFFF"/><circle cx="35" cy="30" r="26" fill="#FFFFFF" stroke="#F5B5C8" stroke-width="3"/><g transform="translate(17 12) scale(0.75)"><rect x="27" y="2" width="4" height="14" rx="2" fill="#B55573" transform="rotate(12 29 9)"/><path d="M13 10 h22 l-3 34 h-16 z" fill="#e4f3f7"/><path d="M14.4 22 h19.2 l-1.8 22 h-15.6 z" fill="#c98a52"/><rect x="17" y="15" width="7" height="7" rx="2" fill="#FFFFFF"/><rect x="25" y="17" width="7" height="7" rx="2" fill="#FFFFFF"/></g><circle cx="60" cy="10" r="10" fill="#FFFFFF" stroke="#F5B5C8" stroke-width="2.5"/><text x="60" y="10.5" text-anchor="middle" dominant-baseline="central" style="font-family:\'Baloo 2\',Nunito,sans-serif;font-weight:800;font-size:' + (String(n).length > 1 ? 9 : 12) + 'px" fill="#5B3843">' + n + '</text>'
      : '<path d="M18 14 Q15 10 18 6 M28 12 Q25 8 28 4" stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.9"/><rect x="40" y="56" width="22" height="5" rx="2.5" fill="#5B4A50"/><ellipse cx="24" cy="58" rx="22" ry="7" fill="#5B4A50"/><g transform="translate(4 22) scale(0.84)"><path d="M4 32 A20 20 0 0 1 44 32 Z" fill="#f6dcc0"/><path d="M10 32 A14 14 0 0 1 38 32 Z" fill="#6b4130"/><circle cx="20" cy="27" r="5" fill="#FFFFFF"/><circle cx="20" cy="27" r="2.4" fill="#fbc79a"/><path d="M4 32 L44 32 L42 36 L6 36 Z" fill="#e8c39a"/></g><circle cx="50" cy="14" r="10" fill="#FFFFFF" stroke="#F5B5C8" stroke-width="2.5"/><text x="50" y="14.5" text-anchor="middle" dominant-baseline="central" style="font-family:\'Baloo 2\',Nunito,sans-serif;font-weight:800;font-size:' + (String(n).length > 1 ? 9 : 12) + 'px" fill="#5B3843">' + n + '</text>';
    return '<svg class="mk" style="position:absolute;' + pos + ';z-index:6;overflow:visible;pointer-events:none" viewBox="' + (kind === 'bar' ? '0 0 70 68' : '0 0 64 66') + '" aria-hidden="true">' + inner + '</svg>';
  }
  function lowBubble(l, t, icon, level) {
    var amber = level === 'amber', col = amber ? '#F2A66B' : '#D2455D', fill = amber ? '#FDE3CF' : '#F9D6D6', txt = amber ? '#9A5A2A' : '#8E2F3F';
    return '<div class="lowb" style="position:absolute;left:' + l + 'px;top:' + t + 'px;z-index:7;width:52px;height:74px;pointer-events:none"><svg style="position:absolute;left:0;top:0;overflow:visible" width="52" height="74" viewBox="0 0 52 74" aria-hidden="true">' +
      '<ellipse cx="26" cy="64" rx="15" ry="5" fill="#5B3843" opacity="0.14"/><circle cx="26" cy="26" r="24" fill="' + fill + '" stroke="' + col + '" stroke-width="3"/><g transform="translate(11 11)">' + ART.svg('ing', icon, 30) + '</g>' +
      '<rect x="6" y="52" width="40" height="17" rx="8.5" fill="#FFFFFF" stroke="' + col + '" stroke-width="2"/><text x="26" y="61" text-anchor="middle" dominant-baseline="central" style="font-family:\'Baloo 2\',Nunito,sans-serif;font-weight:800;font-size:11px" fill="' + txt + '">' + (amber ? 'low' : 'out') + '</text></svg></div>';
  }

  /* ───────────── what the floor knows ───────────── */
  function lowList() {
    var out = [], l = S.data.ingredients, i, lt;
    for (i = 0; i < l.length; i++) { lt = J.light(l[i].id); if (lt !== 'green' && l[i].inventoried) { out.push({ ing: l[i], light: lt }); } }
    out.sort(function (a, b) { return (a.light === 'red' ? 0 : 1) - (b.light === 'red' ? 0 : 1); });
    return out;
  }
  function worst(filter) {
    var l = S.data.ingredients, i, w = 'green', lt;
    for (i = 0; i < l.length; i++) { if (filter(l[i])) { lt = J.light(l[i].id); if (lt === 'red') { return 'red'; } if (lt === 'amber') { w = 'amber'; } } }
    return w;
  }
  function makingCount(st) { var f = O.feed[st], n = 0, i; if (!f) { return 0; } for (i = 0; i < f.tickets.length; i++) { n += 1; } return n; }
  function makingLabel(st) {
    var f = O.feed[st], i, t;
    if (!f || !f.tickets.length) { return ''; }
    t = f.tickets[0]; return t.stick ? String(t.stick) : (t.name || t.number || '').charAt(0).toUpperCase();
  }
  function inCartTables() { var o = {}, l = J.sticks(), i; for (i = 0; i < l.length; i++) { if (l[i].state === 'table') { o[l[i].table_id] = l[i].number; } } return o; }
  function tableByLabel(label) { var t = (S.floor && S.floor.tables) || [], i; for (i = 0; i < t.length; i++) { if (t[i].label === String(label)) { return t[i]; } } return null; }


  function pastryItems() { var l = (S.data && S.data.items) || [], o = [], i; for (i = 0; i < l.length; i++) { if (l[i].active !== false && J.isCounted(l[i])) { o.push(l[i]); } } return o; }
  function popPastries() {
    var l = pastryItems(), h = pHead(J.t('pastriesWord'), J.t('pastriesSub'), 'pastries') + '<div class="pb" data-scroll="pastries">', i, it, n;
    if (!l.length) { return h + '<p class="psub">' + esc(J.t('pastriesNone')) + '</p></div>'; }
    for (i = 0; i < l.length; i++) {
      it = l[i]; n = Number(it.stock || 0);
      h += '<div class="prow' + (n < 1 ? ' zero' : '') + '"><span class="lico" style="background:' + U.menuBg(U.dishKey(it)) + '">' + ART.svg('menu', U.dishKey(it), 40) + '</span><b>' + esc(J.nm(it.name)) + '</b>' +
        '<span class="pstep"><button type="button" data-act="pastryStock" data-arg="' + it.id + '|-1" aria-label="-1">−</button><em>' + n + '</em><button type="button" data-act="pastryStock" data-arg="' + it.id + '|1" aria-label="+1">+</button></span></div>';
    }
    return h + '</div>';
  }
  /* a small status for each thing on the map (shown on its dashed box) */
  function statusFor(key, homeN, waitN) {
    var n, i, it, items, out = 0, un = 0, ords, lt, st;
    if (key === 'kitchen' || key === 'bar') { n = makingCount(key); return n ? { t: n + ' ' + J.t('making'), tone: 'ok', n: n } : { t: J.t('stQuiet'), tone: 'idle' }; }
    if (key === 'grinder') { lt = worst(function (g) { return g.location === 'grinder'; }); return { t: J.t('stBeans') + ' · ' + J.t(lt === 'green' ? 'plenty' : lt === 'amber' ? 'low' : 'out').toLowerCase(), tone: lt === 'green' ? 'ok' : lt === 'amber' ? 'warn' : 'bad' }; }
    if (key === 'fridge') { n = 0; for (i = 0; i < S.data.ingredients.length; i++) { it = S.data.ingredients[i]; if (it.inventoried && it.location === 'fridge' && J.light(it.id) !== 'green') { n += 1; } } return n ? { t: n + ' ' + J.t('low').toLowerCase(), tone: 'warn', n: n } : { t: J.t('allGood'), tone: 'ok' }; }
    if (key === 'menu') { items = S.data.items || []; for (i = 0; i < items.length; i++) { it = items[i]; if (it.active !== false && (!it.available || J.adapt(it, []).out)) { out += 1; } } return out ? { t: out + ' ' + J.t('out').toLowerCase(), tone: 'warn', n: out } : { t: J.t('stAllOn'), tone: 'ok' }; }
    if (key === 'pastries') { items = pastryItems(); if (!items.length) { return { t: '—', tone: 'idle' }; } for (i = 0; i < items.length; i++) { out += Number(items[i].stock || 0); } return out < 1 ? { t: J.t('stNoneLeft'), tone: 'bad' } : { t: out + ' ' + J.t('stLeft'), tone: out <= 4 ? 'warn' : 'ok' }; }
    if (key === 'register') { ords = (S.floor && S.floor.open) || []; for (i = 0; i < ords.length; i++) { if (ords[i].status !== 'paid') { un += 1; } } return un ? { t: un + ' ' + J.t('stToPay'), tone: 'warn', n: un } : { t: J.t('stAllPaid'), tone: 'ok' }; }
    if (key === 'sign') { st = J.settings(); return (st.closed_until && JC.today() <= st.closed_until) ? { t: J.t('closedToday'), tone: 'bad' } : { t: J.t('stOpen'), tone: 'ok' }; }
    if (key === 'pot-home') { return { t: homeN + ' ' + J.t('stHome'), tone: 'idle', n: homeN }; }
    if (key === 'pot-wait') { return waitN ? { t: waitN + ' ' + J.t('stWaiting'), tone: 'warn', n: waitN } : { t: J.t('stNoneWaiting'), tone: 'idle' }; }
    return null;
  }
  var BPOS = { 'pot-home': ' tl' };
  /* a stoplight: green fine, amber look, red act, grey quiet. A number only where a count helps; the words live in the label. */
  function sbadge(stt, key) { return stt ? '<span class="sbadge ' + stt.tone + (BPOS[key] || '') + '" title="' + esc(stt.t) + '"><i>' + (stt.n ? esc(String(stt.n)) : '') + '</i></span>' : ''; }
  /* ───────────── the screen ───────────── */
  O.screen = function () {
    var f = S.floor, h = '<div class="shell">' + U.topbar('overview') + U.band() + '<div class="ovbody"><div class="mapcol" id="mapcol"><div class="mapbox" id="mapbox"><div class="mapscale" id="mapscale">';
    h += '<div class="mapimg"></div>' + (w.J2CRIT ? w.J2CRIT.cafe() + w.J2CRIT.stand() : '');
    if (!f) { return h + '</div></div></div><aside class="orail"><p class="empty">Loading…</p></aside></div></div>'; }
    var ts = inCartTables(), i, k, label, t, st = ui().placing, sticks = J.sticks(), homeN = [], waitN = [];
    for (i = 0; i < sticks.length; i++) { if (sticks[i].state === 'home') { homeN.push(sticks[i].number); } else if (sticks[i].state === 'waiting') { waitN.push(sticks[i].number); } }
    // sticks in the table pots, drawn over the empty pots in the scene
    for (label in TABLES) {
      if (!TABLES.hasOwnProperty(label)) { continue; }
      t = tableByLabel(label);
      if (t && ts[t.id]) { h += potSvg(TABLES[label].pot[0], TABLES[label].pot[1], ts[t.id], 'draggable'); }
    }
    h += homePotSvg(homeN);
    if (waitN.length) {
      if (waitN.length === 1) { h += potSvg(628, 184, waitN[0], 'draggable'); }
      else { for (i = 0; i < waitN.length && i < 4; i++) { h += potSvg(620 + i * 22, 184 + (i % 2) * 6, waitN[i], 'draggable'); } }
    } else { h += potSvg(628, 184, 0); }
    // making bubbles
    // low-stock bubbles (reminders only)
    var wb = worst(function (g) { return g.location === 'grinder'; }), wf = worst(function (g) { return g.location === 'fridge' && g.inventoried; });
    // the tappable things
    var key, rects, hi, popKind = ui().popup && ui().popup.kind;
    for (key in HIT) {
      if (!HIT.hasOwnProperty(key)) { continue; }
      rects = HIT[key];
      for (hi = 0; hi < rects.length; hi++) {
        h += '<button type="button" class="hit sbox' + (popKind === key ? ' on' : '') + '" data-act="ovOpen" data-arg="' + key + '"' + (hi === 0 ? ' data-ov="' + key + '"' : '') + ' style="' + px(rects[hi]) + '" aria-label="' + esc(LABEL[key]) + '">' + (hi === 0 ? sbadge(key === 'pot-wait' && !waitN.length ? null : statusFor(key, homeN.length, waitN.length), key) : '') + '</button>';
      }
    }
    for (label in TABLES) {
      if (!TABLES.hasOwnProperty(label)) { continue; }
      var on = popKind === 'table' && ui().popup.id === label;
      var tt = tableByLabel(label), occ = tt && ts[tt.id];
      h += '<button type="button" class="hit tbl sbox' + (occ ? ' occ' : '') + (st ? ' pick' : '') + (on ? ' on' : '') + '" data-act="tablePick" data-arg="' + label + '" data-ov="table-' + label + '" style="' + px(TABLES[label].box) + '" aria-label="Table ' + label + '">' + (occ ? sbadge({ t: J.t('stStick') + ' ' + occ, tone: 'ok', n: occ }) : '') + '</button>';
    }
    h += (w.J2CRIT ? w.J2CRIT.hits() : '') + '</div>';       // mapscale
    if (st) { h += '<div class="placehint">' + esc(J.t('placeOnTable')) + ' · ' + st + '<button type="button" data-act="placeCancel">' + esc(J.t('cancel')) + '</button></div>'; }
    h += '<div class="poplayer" id="poplayer">' + popupHTML() + '</div></div></div>' + rail() + '</div>' + sheetLayer() + '</div>';
    return h;
  };

  /* ───────────── the rail ───────────── */
  function circle(txt, sz) { return '<span class="rcirc" style="width:' + (sz || 40) + 'px;height:' + (sz || 40) + 'px">' + esc(txt) + '</span>'; }
  function waitText(g) { var m = J.minsSince(g.created); return m < 1 ? J.t('now') : m + ' ' + J.t('min'); }
  function numRow(g) {
    var tb = null, s = g.stick ? J.stickInfo(g.stick) : null, title, sub;
    if (s && s.state === 'table') { tb = J.tableOf(s.table_id); }
    if (g.stick) { title = tb ? 'Table ' + tb.label : (s && s.state === 'waiting' ? J.t('inTheBin') : 'Stick ' + g.stick); }
    else { title = g.name || g.orders[0].number; }
    sub = waitText(g) + (g.orders.length > 1 ? ' · ' + g.orders.length + ' ' + J.t('orders') : '') + (g.source === 'online' ? ' · ' + J.t('online') : '');
    var cta = g.paid ? (g.type === 'togo' || !g.stick ? J.t('pickedUp') : J.t('stickBack')) : J.t('takePayment');
    return '<div class="nrow"><button type="button" class="nrow-l" data-act="numOpen" data-arg="' + esc(g.key) + '">' + (g.stick ? circle(g.stick) : '<span class="rcode">' + esc(g.orders[0].number) + '</span>') +
      '<span class="nt"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></span></button><button type="button" class="ncta' + (g.paid ? '' : ' alt') + '" data-act="numDo" data-arg="' + esc(g.key) + '">' + esc(cta) + '</button></div>';
  }
  function jar(level) { var f = level === 'red' ? 0 : 9; return '<svg class="jar" viewBox="0 0 24 28" width="24" height="28" aria-hidden="true"><rect x="5" y="1" width="14" height="5" rx="2" fill="#C9A06A"/><rect x="3" y="5" width="18" height="21" rx="5" fill="#FFFFFF" stroke="#E2D0D6" stroke-width="1.6"/>' + (f ? '<rect x="5" y="' + (24 - f) + '" width="14" height="' + f + '" rx="3" fill="#F2B84B"/>' : '') + '</svg>'; }
  function rail() {
    var nums = J.numbers(), here = [], go = [], i, g, h = '<aside class="orail" data-scroll="orail">' + (J.quiet ? J.quiet.card() : '') + '', done = J.justDone(), waitN = [], sticks = J.sticks();
    for (i = 0; i < nums.length; i++) { if (nums[i].stick) { here.push(nums[i]); } else { go.push(nums[i]); } }
    for (i = 0; i < sticks.length; i++) { if (sticks[i].state === 'waiting') { waitN.push(sticks[i].number); } }
    if (J.can('manager')) {
      var making = makingCount('bar') + makingCount('kitchen');
      h += '<section class="rcard"><h2>' + esc(J.t('rightNow')) + '</h2><div class="stat3"><span><b>' + nums.length + '</b>' + esc(J.t('open')) + '</span><span><b>' + making + '</b>' + esc(J.t('making')) + '</span><span><b>' + waitN.length + '</b>' + esc(J.t('waiting')) + '</span></div></section>';
    }
    if (J.can('manager')) {
      var low = lowList();
      h += '<section class="rcard"><h2>' + esc(J.t('runningLow')) + '</h2>';
      for (i = 0; i < low.length && i < 5; i++) { h += '<button type="button" class="lowrow ' + low[i].light + '" data-act="ovOpen" data-arg="inv">' + U.dot(low[i].ing.id, 'in', 38) + '<b>' + esc(J.nm(low[i].ing.name)) + '</b>' + jar(low[i].light) + '</button>'; }
      if (!low.length) { h += '<p class="rmuted">' + esc(J.t('allGood')) + '</p>'; }
      h += '</section>';
    }
    if (waitN.length) {
      h += '<section class="rcard bin">';
      for (i = 0; i < waitN.length; i++) {
        var og = null; for (g = 0; g < nums.length; g++) { if (nums[g].stick === waitN[i]) { og = nums[g]; } }
        h += '<div class="binrow">' + circle(waitN[i]) + '<span class="nt"><b>' + esc(og ? (og.orders[0].number + (og.name ? ' · ' + og.name : '')) : 'Stick ' + waitN[i]) + '</b><small>Stick ' + waitN[i] + '</small></span>' +
          '<button type="button" class="binbtn' + (ui().placing === waitN[i] ? ' on' : '') + '" data-act="placeStart" data-arg="' + waitN[i] + '">' + esc(ui().placing === waitN[i] ? J.t('bin') : J.t('placeOnTable').split(' ')[0]) + '</button></div>';
      }
      h += '</section>';
    }
    h += '<section class="rcard"><h2>' + esc(J.t('forHere')) + '</h2>';
    for (i = 0; i < here.length; i++) { h += numRow(here[i]); }
    if (!here.length) { h += '<p class="rmuted">—</p>'; }
    h += '</section><section class="rcard"><h2>' + esc(J.t('toGo')) + '</h2>';
    for (i = 0; i < go.length; i++) { h += numRow(go[i]); }
    if (!go.length) { h += '<p class="rmuted">—</p>'; }
    h += '</section><section class="rcard"><h2>' + esc(J.t('justDone')) + '</h2>';
    for (i = 0; i < done.length; i++) {
      var tb = done[i].table_id ? J.tableOf(done[i].table_id) : null, mm = J.minsSince(done[i].completed_at);
      h += '<div class="nrow"><span class="nrow-l">' + (done[i].stick ? circle(done[i].stick) : '<span class="rcode">' + esc(done[i].orders[0].number) + '</span>') + '<span class="nt"><b>' + esc(tb ? 'Table ' + tb.label : (done[i].name || done[i].orders[0].number)) + (done[i].orders.length > 1 ? ' · ' + done[i].orders.length : '') + '</b><small>' +
        (mm < 1 ? esc(J.t('now')) : mm + ' ' + esc(J.t('min')) + ' ' + esc(J.t('ago'))) + '</small></span></span><button type="button" class="undo" data-act="undoDone" data-arg="' + esc(done[i].key) + '">' + esc(J.t('undo')) + '</button></div>';
    }
    if (!done.length) { h += '<p class="rmuted">' + esc(J.t('undo')) + '…</p>'; }
    h += '</section>';
    if (S.person && S.person.role === 'josie') {
      var va = ui().viewAs || '', chips = [['', J.t('viewJosie')], ['register', J.t('viewRegister')], ['bar', J.t('barWord')], ['kitchen', J.t('kitchenWord')], ['guest', J.t('viewGuest')]];
      h += '<section class="rcard"><h2>' + esc(J.t('viewAs')) + '</h2><div class="vchips">';
      for (i = 0; i < chips.length; i++) { h += '<button type="button" class="vchip' + (va === chips[i][0] ? ' on' : '') + '" data-act="viewAs" data-arg="' + chips[i][0] + '">' + esc(chips[i][1]) + '</button>'; }
      h += '</div></section>';
    }
    return h + '</aside>';
  }

  /* ───────────── popups ───────────── */
  function pHead(title, sub, gearKind) {
    var g = gearKind && J.gear && J.gear.allowed(gearKind);
    return '<div class="ph"><div class="pht"><h2>' + esc(title) + '</h2>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>' +
      (ui().flip && g ? '<span class="setuptag">' + esc(J.t('setup')) + '</span>' : '') +
      (g ? U.roundBtn('ovGear', U.ic('gear', 22, ui().flip ? '#FFFFFF' : '#B55573'), J.t('settings'), undefined, ui().flip) : '') +
      U.roundBtn('help', '?', 'Help') + U.roundBtn('ovClose', U.ic('x', 18, '#B55573'), J.t('close')) + '</div>';
  }
  function popupHTML() {
    var p = ui().popup; if (!p) { return ''; }
    var inner = '', k = p.kind;
    if (k === 'kitchen' || k === 'bar') { inner = popTickets(k); }
    else if (k === 'inv' || k === 'fridge' || k === 'grinder') { inner = J.gear && ui().flip && J.gear.allowed('inv') ? J.gear.inventory() : popInventory(); }
    else if (k === 'menu') { inner = J.gear && ui().flip && J.gear.allowed('menu') ? J.gear.menu() : popMenu(); }
    else if (k === 'dish') { inner = J.gear && ui().flip && J.gear.allowed('menu') ? J.gear.dish(p.id) : popDish(p.id); }
    else if (k === 'ingpick') { inner = J.gear ? J.gear.ingredientPicker(p.id) : ''; }
    else if (k === 'sign') { inner = J.gear && ui().flip && J.gear.allowed('sign') ? J.gear.sign() : popSign(); }
    else if (k === 'pot-home') { inner = pHead('Home pot', 'Sticks ready to hand out', null) + '<div class="pb"><div class="pcard"><span class="psub">Ring up an order and a stick leaves this pot for the waiting pot.</span></div></div>'; }
    else if (k === 'pot-wait') { inner = popWaiting(); }
    else if (k === 'register') { inner = popRegister(); }
    else if (k === 'pastries') { inner = popPastries(); }
    else if (k === 'table') { inner = popNumber(J.numberOf(p.key) || numberForTable(p.id), p.id); }
    else if (k === 'number') { inner = popNumber(J.numberOf(p.key), null); }
    if (k === 'ingpick' || k === 'dish' || k === 'menu') { return '<div class="pop' + (ui().sheetMode ? ' sheetmode' : '') + (ui().flip ? ' flip' : '') + '" role="dialog">' + inner + '</div>'; }
    return '<div class="pop' + (ui().sheetMode ? ' sheetmode' : '') + (ui().flip ? ' flip' : '') + '" role="dialog">' + inner + '</div>';
  }
  function numberForTable(label) {
    var t = tableByLabel(label), l = J.sticks(), i, g;
    if (!t) { return null; }
    for (i = 0; i < l.length; i++) { if (l[i].table_id === t.id) { g = J.numberOf('s' + l[i].number); return g; } }
    return null;
  }
  function sheetLayer() { return ''; }
  O.head = pHead;
  /* a staff phone set up for inventory: just the lights, big, nothing else */
  O.inventoryScreen = function () { return '<div class="shell phoneinv">' + U.topbar('overview') + (J.quiet ? '<div class="quietwrap">' + J.quiet.card() + '</div>' : '') + '<div class="pop inline">' + popInventory() + '</div></div>'; };

  /* kitchen and bar: read-only tickets */
  function popTickets(st) {
    var f = O.feed[st];
    var head = pHead(st === 'kitchen' ? J.t('kitchenWord') : J.t('barWord'), J.t('live') + ' · ' + (f ? f.tickets.length : 0) + ' ' + J.t(f && f.tickets.length === 1 ? 'ticket' : 'tickets'), null);
    if (!f) { return head + '<div class="pb"><p class="empty">Loading…</p></div>'; }
    return head + '<div class="tvhost">' + T.list(f, { lang: S.lang, station: st, now: f.now, skew: O.skew, id: 'tv-' + st, scrollKey: 'tv-' + st }) + '</div>';
  }
  O.pollFeeds = function () {
    if (!S.session || !S.person || S.tab !== 'overview') { return; }
    ['kitchen', 'bar'].forEach(function (st) {
      J.call('tickets2_pos', { p_station: st, p_lang: S.lang }, function (err, f) {
        if (err || !f) { return; }
        O.skew = f.now ? new Date(f.now).getTime() - Date.now() : 0;
        var sig = JSON.stringify([f.tickets, f.alerts && f.alerts.map(function (a) { return a.id; })]);
        var changed = O.tickSig !== sig + st && JSON.stringify(O.feed[st] && O.feed[st].tickets) !== JSON.stringify(f.tickets);
        var hadAlerts = O.feed[st] && O.feed[st].alerts && O.feed[st].alerts.length;
        O.feed[st] = f;
        if (ui().popup && ui().popup.kind === st && T) { T.chime(f); }
        if (changed || (f.alerts && f.alerts.length) || hadAlerts) { J.changed(); } else if (J.ov) { J.changed(); }
      });
    });
  };

  /* inventory: one place for every light */
  function invTile(g, sel) {
    var lt = J.light(g.id);
    return '<button type="button" class="itile' + (sel ? ' sel' : '') + '" data-act="invPick" data-arg="' + g.id + '"><span class="iart">' + J.ingIcon(g.id, 44) + '<i class="lt ' + lt + '"></i></span><span class="il">' + esc(J.nm(g.name)) + '</span></button>';
  }
  function popInventory() {
    var l = S.data.ingredients, list = [], i, look = [], good = [], sel = ui().invSel, g, h;
    for (i = 0; i < l.length; i++) { if (l[i].inventoried && l[i].active !== false) { list.push(l[i]); } }
    for (i = 0; i < list.length; i++) { (J.light(list[i].id) === 'green' ? good : look).push(list[i]); }
    h = pHead(J.t('inventory'), list.length + ' · ' + J.t('allGood').toLowerCase(), 'inv') + '<div class="pb" data-scroll="inv">';
    if (sel) {
      g = J.ix().ing[sel];
      if (g) {
        var lt = J.light(g.id), n = J.ix().di, cnt = 0, id;
        for (id in n) { if (n.hasOwnProperty(id)) { for (i = 0; i < n[id].length; i++) { if (n[id][i].ingredient_id === g.id) { cnt += 1; } } } }
        h += '<div class="pcard isel"><div class="ih">' + J.ingIcon(g.id, 44) + '<b>' + esc(J.nm(g.name)) + '</b><span class="kindtag ' + g.kind + '">' + esc(J.t(g.kind)) + '</span></div><div class="lights">' +
          [['green', 'plenty'], ['amber', 'low'], ['red', 'out']].map(function (x) { return '<button type="button" class="lg ' + x[0] + (lt === x[0] ? ' on' : '') + '" data-act="invSet" data-arg="' + x[0] + '"><i></i>' + esc(J.t(x[1])) + '</button>'; }).join('') + '</div>' +
          (lt === 'red' ? '<p class="psub">' + (g.kind === 'base' ? cnt + ' dishes go out: they are made from it.' : cnt + ' dishes stay on, showing “no ' + esc(J.nm(g.name).toLowerCase()) + '” with swaps offered.') + '</p>' : '<p class="psub">' + (lt === 'amber' ? 'Low never changes a dish.' : '') + '</p>') + '</div>';
      }
    }
    if (look.length) { h += '<p class="sec">' + esc(J.t('needsLook')) + '</p><div class="igrid">'; for (i = 0; i < look.length; i++) { h += invTile(look[i], sel === look[i].id); } h += '</div>'; }
    h += '<p class="sec">' + esc(J.t('allGood')) + '</p><div class="igrid">'; for (i = 0; i < good.length; i++) { h += invTile(good[i], sel === good[i].id); } h += '</div></div>';
    return h;
  }
  /* menu board: favourites first, then everything by category. A tap opens that dish's card. */
  function dishRow(it) {
    var key = U.dishKey(it), a = J.adapt(it, []), out = a.out || !it.available;
    return '<button type="button" class="mrow' + (out ? ' out' : '') + '" data-act="dishOpen" data-arg="' + it.id + '"><span class="mico" style="background:' + U.menuBg(key) + '">' + ART.svg('menu', key, 32) + (it.starred ? '<i class="mstar">★</i>' : '') + '</span>' +
      '<span class="mn"><b>' + esc(J.nm(it.name)) + '</b>' + (out ? '<small>' + esc(J.t('outToday')) + '</small>' : (a.chips.length ? '<small class="warn">' + esc(J.t('noX') + J.ingName(a.chips[0].ingredient_id).toLowerCase()) + '</small>' : '')) + '</span><span class="mp">L' + Number(it.price) + '</span></button>';
  }
  function popMenu() {
    var items = S.data.items, favs = [], rest = {}, i, h, cats = [];
    for (i = 0; i < items.length; i++) { if (!items[i].active) { continue; } if (items[i].starred) { favs.push(items[i]); } }
    h = pHead(J.t('menuBoard'), '', 'menu') + '<div class="pb" data-scroll="menu">';
    if (favs.length) { h += '<p class="sec">★ Favourites</p>'; for (i = 0; i < favs.length; i++) { h += dishRow(favs[i]); } }
    var c = S.data.categories, k, list;
    for (k = 0; k < c.length; k++) {
      if (!c[k].active) { continue; }
      list = items.filter(function (it) { return it.category_id === c[k].id && it.active; }); if (!list.length) { continue; }
      list.sort(function (a, b) { return a.sort - b.sort; });
      h += '<p class="sec">' + esc(J.nm(c[k].name)) + '</p>'; for (i = 0; i < list.length; i++) { h += dishRow(list[i]); }
    }
    return h + '</div>';
  }
  function popDish(id) {
    var it = J.ix().itemById[id]; if (!it) { return pHead('', '', null); }
    var rows = J.ix().di[id] || [], key = U.dishKey(it), i, h = pHead(J.nm(it.name), '', 'menu') + '<div class="pb" data-scroll="dish"><div class="dishtop"><span class="mico big" style="background:' + U.menuBg(key) + '">' + ART.svg('menu', key, 56) + '</span><b>L' + Number(it.price) + '</b></div><div class="ingrows">';
    for (i = 0; i < rows.length; i++) { h += '<div class="ingrow">' + J.ingIcon(rows[i].ingredient_id, 40) + '<span>' + esc(J.ingName(rows[i].ingredient_id)) + '</span>' + (J.light(rows[i].ingredient_id) !== 'green' ? '<i class="lt ' + J.light(rows[i].ingredient_id) + '"></i>' : '') + '</div>'; }
    if (!rows.length) { h += '<p class="psub">No ingredients yet. Tap the pencil to add them.</p>'; }
    h += '</div>' + (it.description ? '<p class="psub">' + esc(J.nm(it.description)) + '</p>' : '') + '</div>';
    return h;
  }
  function popSign() {
    var st = J.settings(), closed = !!(st.closed_until && JC.today() <= st.closed_until), hrs = st.hours || {}, any = hrs.mon || hrs.tue || '6:15-14:30', parts = String(any).replace(/\s/g, '').split('-');
    function fmt(x) { var a = (x || '').split(':'); if (a.length < 2) { return x; } var hh = parseInt(a[0], 10); return (hh % 12 || 12) + ':' + a[1]; }
    return pHead(J.t('app'), 'Utila, Honduras', 'sign') + '<div class="pb"><div class="pcard signcard"><span class="opentag ' + (closed ? 'closed' : '') + '">' + esc(closed ? J.t('closedToday') : 'OPEN') + '</span><b class="bighours">' + esc(fmt(parts[0]) + ' – ' + fmt(parts[1])) + '</b><span class="psub">Mon – Sat</span></div>' +
      '<div class="pcard"><span class="psub">' + esc(J.t('onlineStops')) + ' ' + esc(String(st.online_cutoff || '14:00').slice(0, 5).replace(/^0/, '')) + '</span></div></div>';
  }
  function popWaiting() {
    var l = J.sticks(), i, h = pHead(J.t('bin'), J.t('unplaced'), null) + '<div class="pb">', n = 0, g;
    for (i = 0; i < l.length; i++) {
      if (l[i].state !== 'waiting') { continue; } n += 1; g = J.numberOf('s' + l[i].number);
      h += '<div class="pcard"><div class="prow"><b>Stick ' + l[i].number + '</b>' + (g ? '<span class="chip2 ' + (g.paid ? 'ok' : 'warn') + '">' + esc(g.paid ? J.t('paid') : J.t('notPaid')) + '</span>' : '') + '</div><span class="psub">' + esc(g ? g.orders.map(function (o) { return o.items; }).join(' · ') : '') + '</span>' +
        '<button type="button" class="bigbtn" data-act="placeStart" data-arg="' + l[i].number + '">' + esc(J.t('placeOnTable')) + '</button></div>';
    }
    if (!n) { h += '<div class="pcard"><span class="psub">' + esc(J.t('unplaced')) + ': 0</span></div>'; }
    return h + '</div>';
  }
  function popRegister() {
    var nums = J.numbers(), h = pHead(J.t('register'), J.t('overview'), null) + '<div class="pb">', i, any = false;
    for (i = 0; i < nums.length; i++) {
      if (nums[i].paid) { continue; } any = true;
      h += '<div class="pcard"><div class="prow"><b>' + esc(nums[i].stick ? 'Stick ' + nums[i].stick : (nums[i].name || nums[i].orders[0].number)) + '</b><span class="chip2 warn">' + esc(J.t('notPaid')) + '</span><span class="amt">L' + nums[i].owed + '</span></div>' +
        '<button type="button" class="bigbtn" data-act="numPay" data-arg="' + esc(nums[i].key) + '">' + esc(J.t('takePayment')) + ' · L' + nums[i].owed + '</button></div>';
    }
    if (!any) { h += '<div class="pcard"><span class="psub">Everything open is paid.</span></div>'; }
    return h + '<button type="button" class="bigbtn ghost" data-act="tab" data-arg="pos">' + esc(J.t('pos')) + '</button></div>';
  }
  /* a number: its orders, what is paid, then the one thing to do */
  function popNumber(g, tableLabel) {
    var tb = tableLabel ? tableByLabel(tableLabel) : null;
    if (!g) {
      return pHead('Table ' + (tableLabel || ''), '', null) + '<div class="pb"><div class="pcard"><span class="psub">No stick here. Drag one from the waiting pot, or tap a stick and then this table.</span></div></div>';
    }
    var s = g.stick ? J.stickInfo(g.stick) : null; if (!tb && s && s.state === 'table') { tb = J.tableOf(s.table_id); }
    var title = g.stick ? 'Stick ' + g.stick : (g.name || g.orders[0].number), i, o, k, h;
    h = pHead(title, (tb ? 'Table ' + tb.label + ' · ' : '') + (g.type === 'togo' || !g.stick ? J.t('toGo') : J.t('forHere')) + ' · ' + waitText(g) + (g.orders.length > 1 ? ' · ' + g.orders.length + ' ' + J.t('orders') : ''), null) + '<div class="pb" data-scroll="num">';
    for (i = 0; i < g.orders.length; i++) {
      o = g.orders[i];
      h += '<div class="pcard"><div class="prow"><b>' + esc(o.name || o.number) + (i > 0 ? ' · ' + esc(J.t('addOn').toLowerCase()) : '') + '</b><span class="chip2 ' + (o.status === 'paid' ? 'ok' : 'warn') + '">' + esc(o.status === 'paid' ? J.t('paid') : J.t('notPaid')) + '</span><span class="amt">L' + Number(o.total) + '</span></div>';
      for (k = 0; k < (o.lines || []).length; k++) {
        var ln = o.lines[k];
        h += '<div class="pline' + (ln.stopped ? ' stopped' : '') + '"><span><i>' + ln.qty + '</i> ' + esc(ln.name) + '</span>' +
          (!ln.stopped && J.can('register') ? '<button type="button" class="xbtn" data-act="stopLine" data-arg="' + esc(o.id + '|' + ln.id) + '" aria-label="' + esc(J.t('stopItem')) + '">' + U.ic('x', 14, '#B55573') + '</button>' : '') + '</div>';
      }
      h += '</div>';
    }
    h += '<div class="ptot"><span>' + esc(g.paid ? J.t('total') : J.t('stillToPay')) + '</span><b class="' + (g.paid ? 'ok' : '') + '">L' + (g.paid ? g.total : g.owed) + (g.paid ? ' ' + esc(J.t('paid')) : '') + '</b></div>';
    if (g.paid) { h += '<button type="button" class="bigbtn" data-act="numDo" data-arg="' + esc(g.key) + '">' + esc(g.type === 'togo' || !g.stick ? J.t('pickedUp') : J.t('stickBack')) + '</button><p class="psub c">' + (g.orders.length > 1 ? 'All orders on this number close together. ' : '') + 'The ticket leaves the kitchen screen 10 minutes later.</p>'; }
    else { h += '<button type="button" class="bigbtn" data-act="numPay" data-arg="' + esc(g.key) + '">' + esc(J.t('takePayment')) + ' · L' + g.owed + '</button><p class="psub c">' + esc(J.t('stickBackNeeds')) + '</p>'; }
    if (J.can('register')) { h += '<div class="prow2"><button type="button" class="bigbtn ghost" data-act="addTo" data-arg="' + esc(g.key) + '">' + esc(J.t('addToOrder')) + '</button></div>'; }
    return h + '</div>';
  }

  /* ───────────── layout after each paint: size the map, place the popup ───────────── */
  O.after = function (root) {
    var col = root.querySelector('#mapcol'), box = root.querySelector('#mapbox'), sc = root.querySelector('#mapscale');
    if (!col || !box || !sc) { return; }
    var cw = col.clientWidth, ch = col.clientHeight, wd = Math.min(cw, ch * MW / MH), hd = wd * MH / MW, k = wd / MW;
    box.style.width = Math.floor(wd) + 'px'; box.style.height = Math.floor(hd) + 'px';
    sc.style.webkitTransform = sc.style.transform = 'scale(' + k + ')';
    ui().mapK = k;
    var pop = root.querySelector('.pop'), layer = root.querySelector('#poplayer');
    ui().sheetMode = d.documentElement.clientWidth < 720;
    if (pop) {
      if (ui().sheetMode) { pop.className += ' sheetmode'; root.querySelector('.shell').appendChild(pop); return; }
      var anchor = null, p = ui().popup, key = p.kind === 'table' ? 'table-' + p.id : (p.kind === 'fridge' || p.kind === 'grinder' || p.kind === 'inv' ? (p.anchor || p.kind) : (p.kind === 'dish' || p.kind === 'ingpick' ? (p.anchor || 'menu') : p.kind));
      anchor = box.querySelector('[data-ov="' + key + '"]') || box.querySelector('[data-ov="' + (p.anchor || '') + '"]');
      var br = box.getBoundingClientRect(), pw = Math.min(pop.offsetWidth || 390, br.width - 20), ph = pop.offsetHeight, left = 10, top = 10, m = 10;
      if (anchor) {
        var ar = anchor.getBoundingClientRect(), ax = ar.left - br.left, ay = ar.top - br.top;
        left = (ax + ar.width + 14 + pw <= br.width - m) ? ax + ar.width + 14 : ax - 14 - pw;
        top = ay + ar.height / 2 - ph / 2;
      }
      left = Math.max(m, Math.min(left, br.width - pw - m)); top = Math.max(m, Math.min(top, br.height - ph - m));
      pop.style.left = Math.round(left) + 'px'; pop.style.top = Math.round(top) + 'px';
      var tvh = pop.querySelector('.tvhost'); if (tvh && T) { T.after(tvh); }
    }
    // a tiny cleanup so a closed popup never leaves its layer
    if (!pop && layer) { layer.innerHTML = ''; }
  };

  /* ───────────── actions ───────────── */
  function open(kind, id, anchor) { ui().popup = { kind: kind, id: id || null, anchor: anchor || null, key: id }; ui().flip = false; J.changed(); }
  function closePop() { ui().popup = null; ui().flip = false; ui().invSel = null; J.changed(); }
  function payFor(g) {
    var ids = [], i, lines = [];
    for (i = 0; i < g.orders.length; i++) { if (g.orders[i].status !== 'paid') { ids.push(g.orders[i].id); lines.push({ label: g.orders[i].items || g.orders[i].number, amount: Number(g.orders[i].total) }); } }
    ui().payFor = { ids: ids, lines: lines, total: g.owed, key: g.key, label: g.stick ? 'Stick ' + g.stick : (g.name || g.orders[0].number) };
    S.tab = 'pos'; ui().view = 'pay'; ui().pay = { method: 'cash_hnl', given: null, tip: 0, tipMode: 0, ref: '' }; ui().popup = null; J.changed();
  }
  function startAddTo(g) {
    var c = J.cart(), s = g.stick ? J.stickInfo(g.stick) : null, tb = s && s.state === 'table' ? J.tableOf(s.table_id) : null;
    if (c.lines.length && !w.confirm('Replace the order on the register?')) { return; }
    J.clearCart(); c = J.cart();
    c.addTo = { stick: g.stick, number: g.stick ? String(g.stick) : g.orders[0].number, name: g.name || g.orders[0].name || '', type: g.type, label: (g.stick ? 'Stick ' + g.stick : (g.name || g.orders[0].number)) + (tb ? ' · Table ' + tb.label : '') };
    c.type = g.type; J.saveCart(); S.tab = 'pos'; ui().view = 'pos'; ui().popup = null; J.changed();
  }
  O.handle = function (act, arg, el) {
    var g, p;
    switch (act) {
      case 'ovOpen':
        if (arg === 'inv' || arg === 'fridge' || arg === 'grinder') {
          ui().invSel = null;
          if (arg === 'grinder') { var beans = S.data.ingredients.filter(function (x) { return x.location === 'grinder'; })[0]; ui().invSel = beans ? beans.id : null; }
          open('inv', null, arg === 'inv' ? 'fridge' : arg);
        } else { open(arg, null, arg); }
        if (arg === 'kitchen' || arg === 'bar') { O.pollFeeds(); }
        return true;
      case 'quietSet': case 'quietLater': case 'quietBreak': return J.quiet ? J.quiet.handle(act, arg) : false;
      case 'ovClose': closePop(); return true;
      case 'viewAs': if (arg === 'guest') { w.open('/', '_blank'); } else { ui().viewAs = arg || null; ui().popup = null; if (ui().viewAs && J.eff().station !== 'register') { S.tab = 'overview'; } J.changed(); } return true;
      case 'pastryStock': var ps = String(arg).split('|'), pit = J.ix().itemById[ps[0]]; if (pit) { var old = Number(pit.stock || 0), nu = Math.max(0, old + Number(ps[1])); if (nu !== old) { pit.stock = nu; J.save('data'); J.changed(); J.api('PATCH', 'items?id=eq.' + pit.id, { stock: nu }, function (err) { if (err) { pit.stock = old; J.save('data'); J.changed(); w.alert(S.online ? 'Couldn’t save. Try again.' : 'Counting needs internet.'); } }, { Prefer: 'return=minimal' }); } } return true;
      case 'crit': if (w.J2CRIT) { w.J2CRIT.play(arg, d.getElementById('app')); } return true;
      case 'ovGear': ui().flip = !ui().flip; J.changed(); return true;
      case 'tablePick':
        if (ui().placing) {
          var t = tableByLabel(arg); if (t && J.placeStick(ui().placing, t.id) !== false) { ui().placing = null; open('table', arg, 'table-' + arg); ui().popup.id = arg; }
          else { ui().placing = ui().placing; }
          J.changed(); return true;
        }
        open('table', arg, 'table-' + arg); ui().popup.id = arg; return true;
      case 'numOpen': g = J.numberOf(arg); if (g) { open('number', null, g.stick ? null : null); ui().popup.key = arg; var tbl = g.stick ? J.stickInfo(g.stick) : null; if (tbl && tbl.state === 'table') { var tt = J.tableOf(tbl.table_id); ui().popup = { kind: 'table', id: tt ? tt.label : null, anchor: tt ? 'table-' + tt.label : null, key: arg }; } J.changed(); } return true;
      case 'numDo':
        g = J.numberOf(arg); if (!g) { return true; }
        if (!g.paid) { payFor(g); return true; }
        J.completeNumber(arg); ui().popup = null; J.changed(); return true;
      case 'numPay': g = J.numberOf(arg); if (g) { payFor(g); } return true;
      case 'addTo': g = J.numberOf(arg); if (g) { startAddTo(g); } return true;
      case 'undoDone': J.undoDone(arg); return true;
      case 'placeStart': ui().placing = Number(arg); ui().popup = null; J.changed(); return true;
      case 'placeCancel': ui().placing = null; J.changed(); return true;
      case 'stopLine':
        p = arg.split('|'); if (w.confirm(J.t('stopItem') + '?')) { J.enqueue('stop', { alert_id: J.uuid(), order_id: p[0], order_item_id: p[1], kind: 'stop', already_made: false }); markStopped(p[0], p[1]); }
        return true;
      case 'invPick': ui().invSel = ui().invSel === arg ? null : arg; J.changed(); return true;
      case 'invSet':
        if (ui().invSel) { J.setLight(ui().invSel, arg); } return true;
      case 'dishOpen': open('dish', arg, 'menu'); return true;
    }
    return false;
  };
  function markStopped(orderId, lineId) {
    var f = S.floor, i, k; if (!f) { return; }
    for (i = 0; i < f.open.length; i++) { if (f.open[i].id === orderId) { for (k = 0; k < (f.open[i].lines || []).length; k++) { if (f.open[i].lines[k].id === lineId) { f.open[i].lines[k].stopped = true; } } } }
    J.save('floor'); J.changed();
  }
  /* inventory light: change it here at once, queue it, the menu and the kitchen follow */
  J.setLight = function (ingId, light) {
    if (S.floor && S.floor.lights) { S.floor.lights[ingId] = light; }
    J.recomputeDishState(); J.save('floor');
    J.enqueue('light', { p_ingredient: ingId, p_light: light });
  };
  /* the out cascade, worked out on the device so it works offline too (the server's dish_state() says the same thing) */
  J.recomputeDishState = function () {
    var f = S.floor; if (!f) { return; }
    var ds = {}, items = S.data.items, i, k, rows, g, out, miss;
    for (i = 0; i < items.length; i++) {
      if (!items[i].active) { continue; }
      rows = J.ix().di[items[i].id] || []; out = !items[i].available; miss = [];
      for (k = 0; k < rows.length; k++) {
        g = J.ix().ing[rows[k].ingredient_id]; if (!g) { continue; }
        if (J.light(g.id) === 'red') { if (g.kind === 'base') { out = true; } else { miss.push({ id: g.id, name: g.name, swaps: [] }); } }
      }
      ds[items[i].id] = { out: out, missing: miss };
    }
    f.dish_state = ds;
  };

  /* ───────────── dragging a stick: a finger and a mouse do the same thing ───────────── */
  var drag = null;
  function pt(e) { var t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : e); return { x: t.clientX, y: t.clientY }; }
  function start(e) {
    var el = e.target, pin = null;
    while (el && el !== d.body) { if (el.getAttribute && el.getAttribute('data-pin')) { pin = el; break; } el = el.parentNode; }
    if (!pin) { return; }
    var p = pt(e); drag = { n: Number(pin.getAttribute('data-pin')), x: p.x, y: p.y, moved: false, g: null };
  }
  function move(e) {
    if (!drag) { return; }
    var p = pt(e);
    if (!drag.moved && Math.abs(p.x - drag.x) + Math.abs(p.y - drag.y) > 8) {
      drag.moved = true; ui().dragging = true;
      var g = d.createElement('div'); g.className = 'dragghost'; g.textContent = drag.n; d.body.appendChild(g); drag.g = g;
    }
    if (drag.g) {
      e.preventDefault();
      drag.g.style.left = p.x + 'px'; drag.g.style.top = p.y + 'px';
      var els = d.querySelectorAll('.hit.tbl'), i; for (i = 0; i < els.length; i++) { els[i].className = els[i].className.replace(' drop', ''); }
      var under = d.elementFromPoint(p.x, p.y);
      while (under && under !== d.body) { if (under.className && String(under.className).indexOf('tbl') >= 0 && under.getAttribute('data-arg')) { under.className += ' drop'; break; } under = under.parentNode; }
    }
  }
  function end(e) {
    if (!drag) { return; }
    var dd = drag; drag = null;
    if (dd.g) {
      var p = pt(e); dd.g.parentNode.removeChild(dd.g); ui().dragging = false;
      var under = d.elementFromPoint(p.x, p.y), label = null;
      while (under && under !== d.body) { if (under.className && String(under.className).indexOf('tbl') >= 0 && under.getAttribute('data-arg')) { label = under.getAttribute('data-arg'); break; } under = under.parentNode; }
      if (label) { var t = tableByLabel(label); if (t) { J.placeStick(dd.n, t.id); } }
      J.changed(); e.preventDefault();
    } else {
      // a tap on a stick: if it is on a table open that table, otherwise start placing it
      var s = J.stickInfo(dd.n);
      if (s && s.state === 'table') { var tb = J.tableOf(s.table_id); if (tb) { O.handle('tablePick', tb.label); } }
      else if (s) { ui().placing = dd.n; J.changed(); }
    }
  }
  d.addEventListener('mousedown', function (e) { if (S.tab === 'overview') { start(e); } }, false);
  d.addEventListener('mousemove', move, false);
  d.addEventListener('mouseup', end, false);
  d.addEventListener('touchstart', function (e) { if (S.tab === 'overview') { start(e); } }, { passive: true });
  d.addEventListener('touchmove', move, { passive: false });
  d.addEventListener('touchend', end, false);

  /* the map's data is polled while it is showing */
  w.setInterval(O.pollFeeds, 4000);
}(window, document, window.JC));
