/* Josie's World · the register: POS screen, the ingredient swap sheet, Which stick?, payment, done. Plain ES5. */
(function (w, d, JC) {
  'use strict';
  var J = w.J2, S = J.S, esc = J.esc, money = J.money, U = J.ui, ART = w.J2ART;
  var R = J.reg = {};

  function ui() { return S.ui; }
  function cats() {
    var out = [], l = S.data.categories, i;
    for (i = 0; i < l.length; i++) { if (l[i].active) { out.push(l[i]); } }
    out.sort(function (a, b) { return a.sort - b.sort; });
    return out;
  }
  function itemsIn(catId) {
    var out = [], l = S.data.items, i;
    for (i = 0; i < l.length; i++) { if (l[i].category_id === catId && l[i].active) { out.push(l[i]); } }
    out.sort(function (a, b) { return a.sort - b.sort; });
    return out;
  }
  function countedLeft(cat) { var n = 0, l = itemsIn(cat.id), i; for (i = 0; i < l.length; i++) { n += Math.max(0, Number(l[i].stock || 0)); } return n; }
  function inCart(itemId) { var c = J.cart(), n = 0, i; for (i = 0; i < c.lines.length; i++) { if (c.lines[i].item_id === itemId) { n += c.lines[i].qty; } } return n; }
  function dietLetter(k) { return k === 'vegan' ? 'V' : k === 'gluten_free' ? 'GF' : 'K'; }

  /* ───────────── the POS screen ───────────── */
  function catRail(list) {
    var h = '<nav class="rail">', i, c, on, key;
    for (i = 0; i < list.length; i++) {
      c = list[i]; on = ui().cat === c.id; key = U.catKey(c);
      h += '<button type="button" class="cat' + (on ? ' on' : '') + '" data-act="cat" data-arg="' + c.id + '"><span class="ico"' + (on ? ' style="background:' + U.menuBg(key) + '"' : '') + '>' +
        ART.svg('menu', key, 36) + '</span><span class="lbl">' + esc(J.nm(c.name)) + '</span>' +
        (c.counted ? '<span class="nbadge">' + countedLeft(c) + '</span>' : '') + '</button>';
    }
    return h + '</nav>';
  }
  function dietRow() {
    var c = J.cart(), l = S.data.diets, h = '<div class="diets">', i, on;
    for (i = 0; i < l.length; i++) {
      on = c.diets.indexOf(l[i].key) >= 0;
      h += '<button type="button" class="dchip' + (on ? ' on' : '') + '" data-act="diet" data-arg="' + esc(l[i].key) + '"><span class="dico">' + U.dietIcon(l[i].key) + '</span>' + esc(J.nm(l[i].name)) + '</button>';
    }
    return h + '</div>';
  }
  function tile(item, cat) {
    var c = J.cart(), a = J.adapt(item, c.diets), note = J.tileNote(item, a), key = U.dishKey(item), n = inCart(item.id), rows = J.ix().di[item.id] || [], i, dots = '', removed = {}, bg = '#FBDDE6';
    var out = a.out || !item.available;
    for (i = 0; i < a.chips.length; i++) { removed[a.chips[i].ingredient_id] = true; }
    for (i = 0; i < rows.length && i < 5; i++) { dots += U.dot(rows[i].ingredient_id, removed[rows[i].ingredient_id] ? 'no' : 'in', 26); }
    if (note && note.kind === 'fine') { bg = '#D9F0E8'; } else if (note && note.kind === 'cant') { bg = '#DCEBF8'; }
    var badge = '';
    if (out) { badge = '<span class="tbadge pink">' + esc(J.t(item.available ? 'outToday' : 'sold')) + '</span>'; }
    else if (note && note.kind === 'adapted') { badge = '<span class="tbadge amber">' + esc(note.text) + '</span>'; }
    else if (note && note.kind === 'cant') { badge = '<span class="tbadge pink">' + esc(note.text) + '</span>'; }
    else if (note && note.kind === 'fine') { badge = '<span class="tbadge circle">' + esc(dietLetter(c.diets[0])) + '</span>'; }
    var left = '';
    if (J.isCounted(item)) { var lf = Number(item.stock || 0) - n; left = '<span class="left' + (lf <= 0 ? ' zero' : '') + '">' + lf + ' left</span>'; }
    return '<button type="button" class="tile' + (out ? ' out' : '') + (note && note.kind === 'cant' ? ' cant' : '') + '" data-act="add" data-arg="' + item.id + '"' + (out ? ' disabled' : '') + '>' +
      '<span class="art" style="background:' + bg + '">' + badge + ART.svg('menu', key, 108) + '<span class="dots">' + dots + '</span></span>' +
      '<span class="tn">' + esc(J.nm(item.name)) + '</span><span class="tp">L' + Number(item.price) + left + '</span>' +
      (n ? '<span class="plus1">+' + n + '</span>' : '') + '</button>';
  }
  function mainArea(list) {
    var cat = J.byId(list, ui().cat) || list[0], items = cat ? itemsIn(cat.id) : [], h = '<main class="main">', i;
    h += '<div class="sechead"><span class="sname">' + esc(cat ? J.nm(cat.name) : '') + '</span>' +
      (cat && Number(cat.togo_charge) ? '<span class="snote">' + esc(J.t('toGoAdds')) + 'L' + Number(cat.togo_charge) + '</span>' : '') + '</div>' + dietRow() + '<div class="tiles">';
    for (i = 0; i < items.length; i++) { h += tile(items[i], cat); }
    if (!items.length) { h += '<p class="empty">Nothing here yet.</p>'; }
    return h + '</div></main>';
  }

  function lineHTML(l) {
    var it = J.ix().itemById[l.item_id]; if (!it) { return ''; }
    var c = J.cart(), key = U.dishKey(it), dots = J.lineDots(l), i, dh = '', notes = [], seen = {};
    for (i = 0; i < dots.length; i++) {
      dh += '<button type="button" class="ldot" data-act="dot" data-arg="' + l.key + '|' + dots[i].id + '" aria-label="' + esc(J.ingName(dots[i].id)) + '">' + U.dot(dots[i].id, dots[i].state, 30, dots[i].with_id) + '</button>';
      if (dots[i].state === 'no' || dots[i].state === 'swap') {
        var txt = dots[i].state === 'swap' ? J.ingName(dots[i].id).toLowerCase() + ' → ' + J.ingName(dots[i].with_id).toLowerCase() : J.t('noX') + J.ingName(dots[i].id).toLowerCase();
        if (dots[i].diet && !seen[dots[i].diet]) { txt += ' · ' + J.dietClaim(dots[i].diet); }
        notes.push(txt);
      }
    }
    return '<div class="line"><div class="lrow"><span class="lico" style="background:' + U.menuBg(key) + '">' + ART.svg('menu', key, 30) + '</span>' +
      '<span class="lname"><b>' + esc(J.nm(it.name)) + '</b>' + (notes.length ? '<small>' + esc(notes.join(' · ')) + '</small>' : '') + '</span>' +
      '<button type="button" class="qb" data-act="dec" data-arg="' + l.key + '" aria-label="−">−</button><span class="q">' + l.qty + '</span>' +
      '<button type="button" class="qb" data-act="inc" data-arg="' + l.key + '" aria-label="+">+</button><span class="lprice">L' + (Number(it.price) * l.qty) + '</span></div>' +
      (dh ? '<div class="ldots">' + dh + '</div>' : '') + '</div>';
  }
  function ticketPanel() {
    var c = J.cart(), t = J.totals(c, c.type), n = J.cartCount(), h = '<aside class="tk"><div class="tk-top">', i;
    var codeLabel = c.addTo ? ('' + c.addTo.number) : (c.stick ? String(c.stick) : J.peekCode());
    h += '<span class="tk-code">' + esc(codeLabel) + '</span><span class="tk-name"><small>' + esc(c.addTo ? J.t('adding') : J.t('orderFor')) + '</small>' +
      '<input id="cust" placeholder="' + esc(J.t('customerName')) + '" value="' + esc(c.addTo ? (c.addTo.name || '') : c.name) + '"' + (c.addTo ? ' disabled' : '') + ' autocomplete="off"></span>' +
      '<span class="tk-count">' + n + ' ' + J.t(n === 1 ? 'item' : 'items') + '</span></div>';
    if (c.addTo) { h += '<div class="addtobar">' + U.ic('link', 18) + '<span>' + esc(J.t('adding')) + ' ' + esc(c.addTo.label) + '</span><button type="button" data-act="addtoCancel">' + U.ic('x', 16) + '</button></div>'; }
    if (c.diets.length) {
      h += '<div class="dline">';
      for (i = 0; i < c.diets.length; i++) { h += '<span class="dtag"><span class="dico">' + U.dietIcon(c.diets[i]) + '</span>' + esc(J.dietClaim(c.diets[i])) + '</span>'; }
      h += '<small>' + esc(J.t('tapDot')) + '</small></div>';
    }
    h += '<div class="lines">';
    for (i = 0; i < c.lines.length; i++) { h += lineHTML(c.lines[i]); }
    if (!c.lines.length) { h += '<p class="empty">Tap a dish to start</p>'; }
    h += '</div><div class="tk-foot">';
    if (!c.addTo) {
      h += '<div class="seg2"><button type="button" class="' + (c.type === 'here' ? 'on' : '') + '" data-act="ctype" data-arg="here">' + U.ic('cup', 26) + J.t('forHere') + '</button>' +
        '<button type="button" class="' + (c.type === 'togo' ? 'on' : '') + '" data-act="ctype" data-arg="togo">' + ART.svg('menu', 'bag-on-shelf', 28) + J.t('toGo') + '</button></div>';
    }
    h += '<button type="button" class="paybtn" data-act="pay"' + (c.lines.length ? '' : ' disabled') + '><span>' + J.t('pay') + '</span><b>L ' + t.total + '</b></button>' +
      '<button type="button" class="later" data-act="paylater"' + (c.lines.length ? '' : ' disabled') + '>' + esc(c.addTo ? J.t('sendAddon') : J.t('payLater')) + '</button></div></aside>';
    return h;
  }
  function stationChips() {
    var sc = J.stationCounts(J.cart());
    return '<div class="stations"><span class="schip">' + ART.svg('menu', 'bar', 26) + J.t('barWord') + ' · ' + sc.bar + '</span><span class="schip">' + ART.svg('menu', 'kitchen', 26) + J.t('kitchenWord') + ' · ' + sc.kitchen + '</span></div>';
  }

  R.pos = function () {
    var list = cats(); if (!ui().cat && list.length) { ui().cat = list[0].id; }
    return '<div class="shell">' + U.topbar('pos') + U.band() + '<div class="reg">' + catRail(list) + mainArea(list) +
      '<div class="tkcol">' + ticketPanel() + stationChips() + '</div></div>' + sheetHTML() + '</div>';
  };

  /* ───────────── the swap sheet: tap a dot on a ticket line ───────────── */
  function sheetHTML() {
    var sh = ui().sheet; if (!sh) { return ''; }
    if (sh.kind === 'dot') { return dotSheet(sh); }
    if (sh.kind === 'cant') { return cantSheet(sh); }
    return '';
  }
  function dotSheet(sh) {
    var l = J.lineOf(sh.line); if (!l) { return ''; }
    var dots = J.lineDots(l), dt = null, i, ing = J.ix().ing[sh.ing];
    for (i = 0; i < dots.length; i++) { if (dots[i].id === sh.ing) { dt = dots[i]; } }
    if (!dt || !ing) { return ''; }
    var nameL = J.ingName(sh.ing), dietKey = dt.diet, opts = J.swapOptions(sh.ing, dietKey), h = '', removed = dt.state === 'no' || dt.state === 'swap';
    h += '<div class="scrim" data-act="sheetClose"></div><div class="sheet"><button type="button" class="sheet-x" data-act="sheetClose" aria-label="' + esc(J.t('close')) + '">' + U.ic('x', 18) + '</button>';
    h += '<div class="sheet-h">' + U.dot(sh.ing, 'in', 52) + '<span class="sheet-t"><b>' + esc(nameL) + '</b>' + (dietKey ? '<small>' + esc(J.t('offFor')) + ' ' + esc(J.dietClaim(dietKey)) + '</small>' : '') + '</span></div>';
    h += '<p class="sheet-l">' + esc(J.t('swapFor')) + '</p><div class="opts">';
    h += optRow(sh, 'no', null, J.t('noX').replace(/\s+$/, '') + ' ' + nameL.toLowerCase(), dt.state === 'no', !dietKey ? false : (dt.state === 'no' && dt.auto), ART.svg('ing', '', 0));
    for (i = 0; i < opts.length; i++) {
      h += optRow(sh, 'swap', opts[i].alternative_id, J.ingName(opts[i].alternative_id), dt.state === 'swap' && dt.with_id === opts[i].alternative_id, opts[i].is_default);
    }
    h += '</div>';
    if (removed || dt.state === 'in') {
      h += '<button type="button" class="back-anyway" data-act="sheetBack" data-arg="' + esc(sh.line + '|' + sh.ing) + '">' + (removed ? U.dot(sh.ing, 'in', 26) + '<span>' + esc(J.t('putBack')) + '</span>' : '<span>' + esc(J.t('leaveOut')) + '</span>') + '</button>';
    }
    return h + '</div>';
  }
  function optRow(sh, type, withId, label, on, isDefault) {
    var arg = sh.line + '|' + sh.ing + '|' + type + '|' + (withId || '');
    return '<button type="button" class="opt' + (on ? ' on' : '') + '" data-act="sheetPick" data-arg="' + esc(arg) + '"><span class="radio"></span>' +
      (type === 'no' ? U.dot(sh.ing, 'no', 30) : U.dot(withId, 'in', 30)) + '<span class="olab">' + esc(label.charAt(0).toUpperCase() + label.slice(1)) + '</span>' +
      (isDefault ? '<small>default</small>' : '') + '</button>';
  }
  function cantSheet() { return ''; }

  R.sheetPick = function (arg) {
    var p = arg.split('|'), line = p[0], ing = p[1], type = p[2], withId = p[3];
    if (type === 'no') { J.setEdit(line, ing, { type: 'no' }); } else { J.setEdit(line, ing, { type: 'swap', with_id: withId }); }
    ui().sheet = null; J.changed();
  };
  R.sheetBack = function (arg) {
    var p = arg.split('|'), l = J.lineOf(p[0]), dots = l ? J.lineDots(l) : [], dt = null, i;
    for (i = 0; i < dots.length; i++) { if (dots[i].id === p[1]) { dt = dots[i]; } }
    if (dt && (dt.state === 'no' || dt.state === 'swap')) { J.setEdit(p[0], p[1], { type: 'back' }); } else { J.setEdit(p[0], p[1], { type: 'no' }); }
    ui().sheet = null; J.changed();
  };

  /* ───────────── Which stick? ───────────── */
  R.stick = function () {
    var c = J.cart(), t = J.totals(c, c.type), sticks = J.sticks(), i, s, h = '<div class="shell">' + U.topbar('pos') + U.band() + '<div class="stickpage">';
    h += '<div class="stk-left"><div class="stk-card"><div class="stk-hd"><span class="tk-code">' + (ui().code || '') + '</span><b>' + esc(J.t('forHere')) + '</b></div>';
    for (i = 0; i < c.lines.length; i++) {
      var it = J.ix().itemById[c.lines[i].item_id]; if (!it) { continue; }
      h += '<div class="stk-line"><span class="lico" style="background:' + U.menuBg(U.dishKey(it)) + '">' + ART.svg('menu', U.dishKey(it), 26) + '</span><span><i>' + c.lines[i].qty + '</i> ' + esc(J.nm(it.name)) + '</span><b>L' + (Number(it.price) * c.lines[i].qty) + '</b></div>';
    }
    h += '<div class="stk-tot"><span>' + esc(J.t('total')) + '</span><b>L ' + t.total + '</b></div></div></div><div class="stk-right">' +
      '<div class="stk-title"><button type="button" class="rb" data-act="stickBack2" aria-label="' + esc(J.t('back')) + '">' + U.ic('back', 20, '#B55573') + '</button><span><small>' + esc(J.t('forHere')) + '</small><b>' + esc(J.t('whichStick')) + '</b></span></div><div class="sgrid">';
    for (i = 0; i < sticks.length; i++) {
      s = sticks[i];
      var used = s.state !== 'home', where = '';
      if (s.state === 'table') { var tb = J.tableOf(s.table_id); where = tb ? 'Table ' + tb.label : ''; } else if (s.state === 'waiting') { where = J.t('bin'); }
      h += '<button type="button" class="sbtn' + (used ? ' used' : '') + '" data-act="stickPick" data-arg="' + s.number + '"' + (used ? ' disabled' : '') + '>' +
        '<span class="shead"><span class="snum">' + s.number + '</span></span><span class="srod"></span>' + (where ? '<span class="swhere">' + esc(where) + '</span>' : '') + '</button>';
    }
    h += '</div><button type="button" class="nostick" data-act="stickPick" data-arg="0">' + ART.svg('menu', 'waiting-pot', 44) + '<b>' + esc(J.t('noStick')) + '</b></button></div></div></div>';
    return h;
  };
  R.stickPick = function (n) {
    var number = Number(n), c = J.cart();
    c.stick = number || null; J.saveCart();
    if (ui().payLater) { R.finish(null); return; }
    ui().view = 'pay'; ui().pay = { method: 'cash_hnl', given: null, tip: 0, tipMode: 0, ref: '' }; J.changed();
  };

  /* ───────────── pay ───────────── */
  function tipAmount() {
    var p = ui().pay, base = J.totals(J.cart(), J.cart().type).total;
    if (p.tipMode === 4) { return J.r2(p.tip); }
    return J.r2(Math.round(base * [0, 0.10, 0.15, 0.20][p.tipMode || 0]));
  }
  function canComplete(t) {
    var p = ui().pay; if (p.method === 'card') { return true; }
    if (p.given === null || p.given === '' || isNaN(Number(p.given))) { return false; }
    var rt = J.rate(), val = p.method === 'cash_usd' ? Number(p.given) * (rt || 0) : Number(p.given);
    return val + 0.009 >= t.total;
  }
  R.pay = function () {
    var p = ui().pay, c = J.cart(), cardTip = p.method === 'card' ? tipAmount() : 0, t = J.totals(c, c.type, cardTip), i, h;
    var payTotal = c.addTo ? t : t;
    h = '<div class="shell">' + U.topbar('pos', { back: '<button type="button" class="btn ghost" data-act="payBack">' + U.ic('back', 20, '#B55573') + '<span>' + esc(J.t('back')) + '</span></button>' }) + U.band() + '<div class="payp">';
    h += '<section class="bill"><div class="bl">';
    for (i = 0; i < c.lines.length; i++) { var it = J.ix().itemById[c.lines[i].item_id]; if (it) { h += '<div class="r"><span>' + c.lines[i].qty + ' × ' + esc(J.nm(it.name)) + '</span><span>L' + (Number(it.price) * c.lines[i].qty) + '</span></div>'; } }
    if (t.togo) { h += '<div class="r acc"><span>' + esc(J.t('toGo')) + '</span><span>L' + t.togo + '</span></div>'; }
    if (t.tip) { h += '<div class="r acc"><span>' + esc(J.t('tip')) + '</span><span>L' + t.tip + '</span></div>'; }
    h += '</div><div class="btot"><span>' + esc(J.t('total')) + '</span><b>' + money(t.grand) + '</b></div></section><section class="paymeth"><div class="methods">' +
      meth('cash_hnl', J.t('cashL')) + meth('cash_usd', J.t('cashUsd')) + meth('card', J.t('card')) + '</div>';
    h += p.method === 'card' ? cardPanel(t) : cashPanel(t, p.method === 'cash_usd');
    h += '<span class="grow"></span><button type="button" class="paybtn wide" data-act="complete"' + (canComplete(t) ? '' : ' disabled') + '><span>' + esc(J.t('completeOrder')) + '</span><b>' + money(t.grand) + '</b></button></section></div></div>';
    return h;
  };
  function meth(v, label) { return '<button type="button" class="meth' + (ui().pay.method === v ? ' on' : '') + '" data-act="method" data-arg="' + v + '">' + esc(label) + '</button>'; }
  function cashPanel(t, usd) {
    var p = ui().pay, rt = J.rate(), due, opts, given, change;
    if (usd && !rt) { return '<div class="pcard"><p>No dollar rate yet. Set one in Money.</p></div>'; }
    due = usd ? Math.ceil(t.total / rt * 100) / 100 : t.total;
    if (usd) { opts = [due, 5, 10, 20, 50, 100].filter(function (v, i) { return i === 0 || v >= due; }).slice(0, 5); }
    else {
      var a = Math.ceil(t.total / 50) * 50, b = Math.ceil(t.total / 100) * 100, c2 = Math.ceil(t.total / 500) * 500;
      opts = [t.total, a, b, c2, 1000].filter(function (v, i, arr) { return (i === 0 || v > t.total) && arr.indexOf(v) === i; }).slice(0, 5);
    }
    given = p.given === null || p.given === '' ? null : Number(p.given);
    change = given === null ? null : J.r2((usd ? given * rt : given) - t.total);
    return '<div class="pcard">' + (usd ? '<div class="usd"><span>Due in dollars <small>L ' + rt.toFixed(2) + ' per $1</small></span><b>' + money(due, '$') + '</b></div>' : '') +
      '<p class="lbl">' + esc(J.t('cashGiven')) + '</p><div class="chips">' + opts.map(function (v, i) {
        return '<button type="button" class="chip' + (given === v ? ' on' : '') + '" data-act="given" data-arg="' + v + '">' + (i === 0 ? esc(J.t('exact')) : money(v, usd ? '$' : 'L ')) + '</button>';
      }).join('') + '</div><label class="other">' + (usd ? '$' : 'L') + '<input id="givenIn" type="number" inputmode="decimal" step="0.01" value="' + (given !== null && opts.indexOf(given) < 0 ? given : '') + '"></label>' +
      '<div class="change' + (change !== null && change < 0 ? ' short' : '') + '"><span>' + (change !== null && change < 0 ? 'Still owed' : esc(J.t('change'))) + '</span><b id="changeOut">' + (change === null ? '—' : money(Math.abs(change))) + '</b></div></div>';
  }
  function cardPanel(t) {
    var p = ui().pay, base = J.totals(J.cart(), J.cart().type).total;
    return '<div class="pcard"><p class="lbl">' + esc(J.t('tip')) + '</p><div class="chips">' + ['none', '10%', '15%', '20%', 'other'].map(function (l, i) {
      var amt = i === 4 ? (p.tipMode === 4 ? money(p.tip) : '…') : money(Math.round(base * [0, 0.10, 0.15, 0.20][i]));
      return '<button type="button" class="chip tip' + (p.tipMode === i ? ' on' : '') + '" data-act="tip" data-arg="' + i + '"><b>' + (i === 0 ? esc(J.t('none')) : l) + '</b><small>' + amt + '</small></button>';
    }).join('') + '</div></div><div class="pcard"><p class="lbl">' + esc(J.t('keyIntoVerifone')) + '</p><b class="huge">' + money(t.grand) + '</b>' +
      '<label class="other wide">' + esc(J.t('approval')) + '<input id="cardRef" type="text" inputmode="numeric" value="' + esc(p.ref) + '"></label></div>';
  }
  R.givenInput = function (v) {
    var p = ui().pay; p.given = v === '' ? null : Number(v);
    var c = J.cart(), t = J.totals(c, c.type), rt = J.rate(), val = p.given === null ? null : (p.method === 'cash_usd' ? p.given * rt : p.given), out = J.$('changeOut');
    if (out) { out.innerHTML = val === null ? '—' : money(Math.abs(J.r2(val - t.total))); out.parentNode.className = 'change' + (val !== null && val < t.total ? ' short' : ''); }
    var b = d.querySelector('[data-act="complete"]'); if (b) { b.disabled = !canComplete(t); }
  };

  /* ───────────── finish: send the order (paid or not) ───────────── */
  R.finish = function (pay) {
    var c = J.cart(), stick = c.stick;
    var job = J.submitOrder({ pay: pay, stick: stick });
    ui().last = { order: job.order, change: job.change || 0, paid: !!pay, addTo: !!c.addTo };
    J.clearCart(); ui().sheet = null; ui().payLater = false; ui().view = 'done'; J.changed();
  };
  R.complete = function () {
    var p = ui().pay, ref = J.$('cardRef'); if (ref) { p.ref = ref.value; }
    var c = J.cart(), tip = p.method === 'card' ? tipAmount() : 0, t = J.totals(c, c.type, tip);
    if (!canComplete(t)) { return; }
    R.finish({ method: p.method, given: p.given, tip: tip, ref: p.ref });
  };
  R.start = function (later) {
    var c = J.cart(); if (!c.lines.length) { return; }
    var n = J.$('cust'); if (n && !c.addTo) { c.name = n.value; J.saveCart(); }
    ui().payLater = !!later;
    if (c.addTo) {
      c.stick = c.addTo.stick;
      if (later) { R.finish(null); return; }
      ui().view = 'pay'; ui().pay = { method: 'cash_hnl', given: null, tip: 0, tipMode: 0, ref: '' }; J.changed(); return;
    }
    if (c.type === 'here') {
      ui().code = '#'; ui().view = 'stick'; J.changed(); return;
    }
    c.stick = null;
    if (later) { R.finish(null); return; }
    ui().view = 'pay'; ui().pay = { method: 'cash_hnl', given: null, tip: 0, tipMode: 0, ref: '' }; J.changed();
  };

  /* ───────────── done ───────────── */
  R.done = function () {
    var l = ui().last; if (!l) { ui().view = 'pos'; return R.pos(); }
    var o = l.order, label = o.stick_number ? J.t('stickBack').replace(J.t('stickBack'), 'Stick ' + o.stick_number) : o.number;
    var h = '<div class="shell">' + U.topbar('pos') + U.band() + '<div class="donep"><div class="tick">' + U.ic('check', 54, '#FFFFFF') + '</div><h1>' + esc(label) + (o.customer_name ? ' · ' + esc(o.customer_name) : '') + '</h1>' +
      '<p class="muted">' + esc(o.order_type === 'togo' ? J.t('toGo') : J.t('forHere')) + ' · ' + (l.paid ? esc(J.t('paid')) + ' ' + money(o.total) : esc(J.t('notPaid')) + ' ' + money(o.total)) + '</p>';
    if (l.change > 0) { h += '<div class="change big"><span>' + esc(J.t('change')) + '</span><b>' + money(l.change) + '</b></div>'; }
    var to = [o.has_bar ? J.t('barWord') : '', o.has_kitchen ? J.t('kitchenWord') : ''].filter(Boolean).join(' ' + J.t('and') + ' ');
    if (to) { h += '<p class="muted">' + esc(J.t('sentTo')) + ' ' + esc(to.toLowerCase()) + (S.online ? '.' : ' — when the internet is back.') + '</p>'; }
    h += '<div class="donerow">';
    if (o.stick_number && !l.addTo) { h += '<button type="button" class="btn soft big" data-act="placeNow" data-arg="' + o.stick_number + '">' + esc(J.t('placeOnTable')) + '</button>'; }
    h += '<button type="button" class="btn soft big" data-act="print" data-arg="' + o.id + '">' + esc(J.t('receipt')) + '</button><button type="button" class="btn primary big" data-act="newOrder">' + esc(J.t('newOrder')) + '</button></div></div></div>';
    return h;
  };

  /* ───────────── receipt (prints with the browser) ───────────── */
  R.printReceipt = function (id) {
    var o = null, i, st = J.settings(), r = '';
    for (i = 0; i < S.log.length; i++) { if (S.log[i].order.id === id) { o = S.log[i]; } }
    if (!o) { return; }
    var p = o.payments[0];
    r += '<div class="rc"><h2>' + esc(st.cafe_name || "Josie's Cafe") + '</h2><p>' + esc(st.address || 'Utila, Honduras') + '</p><p>' + new Date(o.order.created_at).toLocaleString() + '</p>' +
      '<p><b>' + esc(o.order.number) + '</b>' + (o.order.customer_name ? ' · ' + esc(o.order.customer_name) : '') + '</p><hr>';
    for (i = 0; i < o.items.length; i++) { r += '<div class="rr"><span>' + o.items[i].qty + ' ' + esc(o.items[i].name) + '</span><span>' + money(o.items[i].unit_price * o.items[i].qty) + '</span></div>'; }
    if (o.order.togo_total) { r += '<div class="rr"><span>To-go</span><span>' + money(o.order.togo_total) + '</span></div>'; }
    r += '<hr><div class="rr"><span>ISV ' + Math.round(Number(st.tax_rate || 0) * 100) + '%' + (st.prices_include_tax ? ' (incl.)' : '') + '</span><span>' + money(o.order.tax) + '</span></div>';
    if (o.order.tip) { r += '<div class="rr"><span>Tip</span><span>' + money(o.order.tip) + '</span></div>'; }
    r += '<div class="rr big"><span>Total</span><span>' + money(o.order.total) + '</span></div>' + (p ? '<div class="rr"><span>' + (p.method === 'card' ? 'Card' : p.method === 'cash_usd' ? 'Cash $' : 'Cash L') + '</span><span></span></div>' : '') +
      '<hr><p>Recibo — no es factura fiscal</p><p>¡Gracias! Thank you!</p></div>';
    J.$('receipt').innerHTML = r; w.print();
  };
}(window, document, window.JC));
