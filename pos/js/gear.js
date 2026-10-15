/* Josie's World · the gear. Every popup flips to its setup side; what is behind it depends on who signed in.
     Bar, Kitchen, Register: mark a dish "Out today" or an ingredient "Ran out", and bring it back. Nothing else.
     Manager (Josie gives it): the above, plus stars, hours, closed today.
     Josie: everything: prices, ingredients, diets, the inventoried list, people.
   The ingredients checklist (pick, tick, Done) is the easy way to say what is in a dish. Plain ES5. */
(function (w, d, JC) {
  'use strict';
  var J = w.J2, S = J.S, esc = J.esc, U = J.ui, ART = w.J2ART;
  var G = J.gear = {};
  function ui() { return S.ui; }
  function H(title, sub, kind) { return J.ov.head(title, sub, kind); }

  G.allowed = function (kind) {
    if (kind === 'sign') { return J.can('manager'); }
    if (kind === 'menu') { return J.can('register'); }
    if (kind === 'inv') { return J.can('josie'); }
    return false;
  };

  /* ───────────── saving things ───────────── */
  function patch(table, id, body, cb) {
    J.api('PATCH', table + '?id=eq.' + id, body, function (err) { if (err) { w.alert(S.online ? 'Couldn’t save. Try again.' : 'Changing this needs internet.'); } if (cb) { cb(err); } }, { Prefer: 'return=minimal' });
  }
  function catalogWrite(p, cb) {
    if (!S.person || !S.person.token) { w.alert('Sign in again first.'); return; }
    J.call('catalog_write', { p_token: S.person.token, p: p }, function (err) {
      if (err) { w.alert(S.online ? 'Couldn’t save. Try again.' : 'Changing this needs internet.'); if (cb) { cb(err); } return; }
      J.loadData(function () { J.changed(); if (cb) { cb(null); } });
    });
  }

  /* ───────────── sign: hours ───────────── */
  var DAYS = [['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun']];
  function parseHours(st) {
    var hrs = st.hours || {}, open = '6:15', close = '14:30', k, r;
    for (k = 0; k < DAYS.length; k++) { r = String(hrs[DAYS[k][0]] || '').replace(/\s/g, ''); if (/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/.test(r)) { open = r.split('-')[0]; close = r.split('-')[1]; break; } }
    return { open: open, close: close };
  }
  function pad(t) { var a = t.split(':'); return ('0' + a[0]).slice(-2) + ':' + a[1]; }
  function saveHours(open, close, days) {
    var st = J.settings(), hrs = {}, i;
    for (i = 0; i < DAYS.length; i++) { hrs[DAYS[i][0]] = days[DAYS[i][0]] ? open + '-' + close : 'closed'; }
    st.hours = hrs; patch('settings', 1, { hours: hrs }, function () { J.save('data'); });
    S.data.settings = st; J.changed();
  }
  G.sign = function () {
    var st = J.settings(), hp = parseHours(st), closed = !!(st.closed_until && JC.today() <= st.closed_until), i, h;
    h = H(J.t('hours'), '', 'sign') + '<div class="pb"><div class="daychips">';
    for (i = 0; i < DAYS.length; i++) {
      var on = /^\d/.test(String((st.hours || {})[DAYS[i][0]] || ''));
      h += '<button type="button" class="dchip2' + (on ? ' on' : '') + '" data-act="gDay" data-arg="' + DAYS[i][0] + '">' + DAYS[i][1] + '</button>';
    }
    h += '</div><div class="timeboxes"><label class="tbox"><small>' + esc(J.t('opens')) + '</small><input id="g_open" type="time" value="' + pad(hp.open) + '"></label><label class="tbox"><small>' + esc(J.t('closes')) + '</small><input id="g_close" type="time" value="' + pad(hp.close) + '"></label></div>' +
      '<div class="srow"><span>' + esc(J.t('onlineStops')) + '</span><input id="g_stop" type="time" value="' + esc(String(st.online_cutoff || '14:00').slice(0, 5)) + '"></div>' +
      '<div class="srow"><span>' + esc(J.t('closedToday')) + '</span>' + U.toggle(closed, 'gClosed', undefined, J.t('closedToday')) + '</div>' +
      '<button type="button" class="bigbtn" data-act="ovGear">' + esc(J.t('done')) + '</button></div>';
    return h;
  };

  /* ───────────── menu: what is on it, price, star, out today ───────────── */
  G.menu = function () {
    var items = S.data.items, cats = S.data.categories, h = H(J.t('editMenu'), '', 'menu') + '<div class="pb" data-scroll="gmenu">', c, i, list;
    if (!J.can('manager')) { h += '<p class="psub">' + esc(J.t('outToday')) + '. Nothing else.</p>'; }
    for (c = 0; c < cats.length; c++) {
      if (!cats[c].active) { continue; }
      list = items.filter(function (it) { return it.category_id === cats[c].id && it.active; }); if (!list.length) { continue; }
      list.sort(function (a, b) { return a.sort - b.sort; });
      h += '<p class="sec">' + esc(J.nm(cats[c].name)) + '</p>';
      for (i = 0; i < list.length; i++) {
        var it = list[i], key = U.dishKey(it);
        h += '<div class="grow2"><button type="button" class="gname" data-act="dishOpen" data-arg="' + it.id + '"><span class="mico" style="background:' + U.menuBg(key) + '">' + ART.svg('menu', key, 28) + '</span><b>' + esc(J.nm(it.name)) + '</b></button>' +
          (J.can('manager') ? '<span class="pricepill">L' + Number(it.price) + '</span><button type="button" class="starb' + (it.starred ? ' on' : '') + '" data-act="gStar" data-arg="' + it.id + '" aria-label="Star">' + U.ic('star', 22, it.starred ? '#E8A81F' : '#EBD5DB') + '</button>' : '') +
          U.toggle(!it.available, 'gOut', it.id, J.t('outToday')) + '</div>';
      }
    }
    return h + '</div>';
  };
  G.dish = function (id) {
    var it = J.ix().itemById[id]; if (!it) { return H('', '', 'menu'); }
    var rows = J.ix().di[id] || [], key = U.dishKey(it), i, h = H(J.nm(it.name), '', 'menu') + '<div class="pb" data-scroll="gdish">';
    if (J.can('josie')) {
      h += '<div class="srow"><span>' + esc(J.t('price')) + '</span><span class="stepper"><button type="button" data-act="gPrice" data-arg="' + id + '|-5">−</button><b>L' + Number(it.price) + '</b><button type="button" data-act="gPrice" data-arg="' + id + '|5">+</button></span></div>';
    }
    if (J.can('manager')) { h += '<div class="srow"><span>' + esc(J.t('starIt')) + '<small>' + esc(J.t('forcedFav')) + '</small></span>' + U.toggle(!!it.starred, 'gStar', id, J.t('starIt')) + '</div>'; }
    h += '<div class="srow"><span>' + esc(J.t('outToday')) + '</span>' + U.toggle(!it.available, 'gOut', id, J.t('outToday')) + '</div>';
    if (J.can('josie')) {
      h += '<p class="sec">' + esc(J.t('ingredients')) + '</p>';
      for (i = 0; i < rows.length; i++) {
        h += '<div class="ingrow">' + J.ingIcon(rows[i].ingredient_id, 40) + '<span>' + esc(J.ingName(rows[i].ingredient_id)) + (rows[i].is_core ? ' <i class="coretag">' + esc(J.t('isTheDish')) + '</i>' : '') + '</span>' +
          '<button type="button" class="xbtn" data-act="gIngX" data-arg="' + id + '|' + rows[i].ingredient_id + '" aria-label="Remove">' + U.ic('x', 14, '#B55573') + '</button></div>';
      }
      h += '<button type="button" class="bigbtn ghost" data-act="pkOpen" data-arg="' + id + '">' + esc(J.t('addIngredient')) + '</button>';
      h += '<div class="dietfits">' + dietFits(rows) + '</div>';
    }
    return h + '</div>';
  };
  function dietFits(rows) {
    var ds = S.data.diets, h = '', i, k, ok;
    for (i = 0; i < ds.length; i++) {
      ok = true; for (k = 0; k < rows.length; k++) { if (J.ix().marks[ds[i].id + ':' + rows[k].ingredient_id] === 'no') { ok = false; } }
      h += '<span class="dfit' + (ok ? ' ok' : '') + '">' + esc(J.nm(ds[i].name)) + '</span>';
    }
    return h;
  }

  /* ───────────── the ingredients checklist: pick, tick, Done ───────────── */
  G.ingredientPicker = function (itemId) {
    var pk = ui().pick; if (!pk) { return ''; }
    var it = J.ix().itemById[itemId], list = S.data.ingredients.slice(), i, q = (pk.q || '').toLowerCase(), h, shown = 0;
    list = list.concat(pk.fresh || []);
    list.sort(function (a, b) { return J.nm(a.name).toLowerCase() < J.nm(b.name).toLowerCase() ? -1 : 1; });
    h = '<div class="ph"><div class="pht"><h2>' + esc(J.t('pickIngredients')) + '</h2><small>' + esc(it ? J.nm(it.name) : '') + ' · ' + esc(J.t('tickThose')) + '</small></div>' + U.roundBtn('pkCancel', U.ic('x', 18, '#B55573'), J.t('close')) + '</div>' +
      '<div class="pkadd"><input id="pk_q" type="text" placeholder="' + esc(J.t('typeName')) + '" value="' + esc(pk.q || '') + '" autocomplete="off" autocapitalize="words"><button type="button" class="pkaddbtn" data-act="pkNew">' + esc(J.t('newIngredient')) + '</button></div>' +
      '<div class="pb pkgrid" data-scroll="pk">';
    for (i = 0; i < list.length; i++) {
      var g = list[i], nm = J.nm(g.name);
      if (q && nm.toLowerCase().indexOf(q) < 0) { continue; }
      shown += 1;
      var on = !!pk.sel[g.id];
      h += '<button type="button" class="pktile' + (on ? ' on' : '') + '" data-act="pkToggle" data-arg="' + g.id + '"><span class="pkart">' + (g.icon ? ingArt(g, 44) : '<span class="pkblank"></span>') + (on ? '<i class="pkcheck">' + U.ic('check', 14, '#FFFFFF') + '</i>' : '') + '</span><span class="pkname">' + esc(nm) + '</span></button>';
    }
    if (!shown) { h += '<p class="psub">' + esc(J.t('typeName')) + ' → ' + esc(J.t('newIngredient')) + '</p>'; }
    return h + '</div><div class="pkfoot"><button type="button" class="bigbtn" data-act="pkDone">' + esc(J.t('done')) + '</button></div>';
  };
  function ingArt(g, size) { var p = (g.icon || '').split(':'); return p.length === 2 ? ART.svg(p[0] === 'menu' ? 'menu' : 'ing', p[1], size) : ''; }
  function pkOpen(itemId) {
    var rows = J.ix().di[itemId] || [], sel = {}, core = {}, i;
    for (i = 0; i < rows.length; i++) { sel[rows[i].ingredient_id] = true; if (rows[i].is_core) { core[rows[i].ingredient_id] = true; } }
    ui().pick = { item: itemId, sel: sel, core: core, q: '', fresh: [] };
    ui().popup = { kind: 'ingpick', id: itemId, anchor: 'menu' }; ui().flip = false; J.changed();
  }
  function pkDone() {
    var pk = ui().pick; if (!pk) { return; }
    var rowsOut = [], id, fresh = [], i;
    for (id in pk.sel) { if (pk.sel.hasOwnProperty(id) && pk.sel[id]) { rowsOut.push({ ingredient_id: id, is_core: !!pk.core[id] }); } }
    for (i = 0; i < pk.fresh.length; i++) { fresh.push({ id: pk.fresh[i].id, name: pk.fresh[i].name, kind: 'element', icon: null, inventoried: false, location: 'other' }); }
    catalogWrite({ ingredients: fresh, dish_ingredients: [{ item_id: pk.item, rows: rowsOut }] }, function (err) {
      if (!err) { ui().pick = null; ui().popup = { kind: 'dish', id: pk.item, anchor: 'menu' }; ui().flip = true; J.changed(); }
    });
  }
  function pkNew() {
    var pk = ui().pick, el = J.$('pk_q'), name = el ? el.value.replace(/^\s+|\s+$/g, '') : '';
    if (!name) { return; }
    var low = name.toLowerCase(), i, l = S.data.ingredients.concat(pk.fresh);
    for (i = 0; i < l.length; i++) { if (J.nm(l[i].name).toLowerCase() === low) { pk.sel[l[i].id] = true; pk.q = ''; J.changed(); return; } }
    var g = { id: J.uuid(), name: { en: name, es: name }, icon: null, kind: 'element', light: 'green' };
    pk.fresh.push(g); pk.sel[g.id] = true; pk.q = ''; J.changed();
  }

  /* ───────────── inventory: which ingredients get a light ───────────── */
  G.inventory = function () {
    var l = S.data.ingredients, h = H(J.t('inventory') + ' · ' + J.t('setup'), 'Tap to add or drop. Only these show lights.', 'inv') + '<div class="pb"><div class="igrid">', i;
    for (i = 0; i < l.length; i++) {
      h += '<div class="itile gtile' + (l[i].inventoried ? ' on' : '') + '"><button type="button" class="gtap" data-act="gInv" data-arg="' + l[i].id + '"><span class="iart">' + J.ingIcon(l[i].id, 44) + (l[i].inventoried ? '<i class="pkcheck">' + U.ic('check', 14, '#FFFFFF') + '</i>' : '') + '</span><span class="il">' + esc(J.nm(l[i].name)) + '</span></button>' +
        '<button type="button" class="kindbtn ' + l[i].kind + '" data-act="gKind" data-arg="' + l[i].id + '">' + esc(J.t(l[i].kind)) + '</button></div>';
    }
    return h + '</div><button type="button" class="bigbtn" data-act="ovGear">' + esc(J.t('done')) + '</button></div>';
  };
  function ingBody(g, over) {
    return { id: g.id, name: g.name, icon: g.icon, kind: over.kind || g.kind, inventoried: over.inventoried !== undefined ? over.inventoried : g.inventoried,
      location: g.location, required_check: g.required_check, active: g.active, meat: g.meat, dairy: g.dairy };
  }

  /* ───────────── actions ───────────── */
  G.handle = function (act, arg) {
    var p, it, i;
    switch (act) {
      case 'gDay':
        var st = J.settings(), hp = parseHours(st), days = {};
        for (i = 0; i < DAYS.length; i++) { days[DAYS[i][0]] = /^\d/.test(String((st.hours || {})[DAYS[i][0]] || '')); }
        days[arg] = !days[arg]; saveHours(hp.open, hp.close, days); return true;
      case 'gClosed':
        var s2 = J.settings(), closed = !!(s2.closed_until && JC.today() <= s2.closed_until), val = closed ? null : JC.today();
        s2.closed_until = val; patch('settings', 1, { closed_until: val, closed_note: '' }); S.data.settings = s2; J.changed(); return true;
      case 'gStar': it = J.ix().itemById[arg]; if (it) { it.starred = !it.starred; patch('items', arg, { starred: it.starred }); J.save('data'); J.changed(); } return true;
      case 'gOut': it = J.ix().itemById[arg]; if (it) { it.available = !it.available; J.save('data'); J.recomputeDishState(); J.enqueue('dishout', { p_item: arg, p_out: !it.available }); } return true;
      case 'gPrice': p = arg.split('|'); it = J.ix().itemById[p[0]]; if (it) { it.price = Math.max(0, Number(it.price) + Number(p[1])); patch('items', p[0], { price: it.price }); J.save('data'); J.changed(); } return true;
      case 'gIngX':
        p = arg.split('|'); var rows = (J.ix().di[p[0]] || []).filter(function (r) { return r.ingredient_id !== p[1]; }).map(function (r) { return { ingredient_id: r.ingredient_id, is_core: r.is_core }; });
        catalogWrite({ dish_ingredients: [{ item_id: p[0], rows: rows }] }); return true;
      case 'pkOpen': pkOpen(arg); return true;
      case 'pkToggle': var pk = ui().pick; if (pk) { pk.sel[arg] = !pk.sel[arg]; J.changed(); } return true;
      case 'pkNew': pkNew(); return true;
      case 'pkDone': pkDone(); return true;
      case 'pkCancel': var back = ui().pick ? ui().pick.item : null; ui().pick = null; ui().popup = back ? { kind: 'dish', id: back, anchor: 'menu' } : null; ui().flip = !!back; J.changed(); return true;
      case 'gInv': var g = J.ix().ing[arg]; if (g) { catalogWrite({ ingredients: [ingBody(g, { inventoried: !g.inventoried })] }); } return true;
      case 'gKind': var g2 = J.ix().ing[arg]; if (g2) { catalogWrite({ ingredients: [ingBody(g2, { kind: g2.kind === 'base' ? 'element' : 'base' })] }); } return true;
    }
    return false;
  };
  G.input = function (el) {
    if (el.id === 'pk_q' && ui().pick) { ui().pick.q = el.value; J.changed(); return; }
    if (el.id === 'g_open' || el.id === 'g_close') {
      var st = J.settings(), days = {}, i, a = J.$('g_open'), b = J.$('g_close');
      if (!a || !b || !a.value || !b.value) { return; }
      for (i = 0; i < DAYS.length; i++) { days[DAYS[i][0]] = /^\d/.test(String((st.hours || {})[DAYS[i][0]] || '')); }
      saveHours(a.value.replace(/^0/, ''), b.value.replace(/^0/, ''), days); return;
    }
    if (el.id === 'g_stop' && el.value) { var s3 = J.settings(); s3.online_cutoff = el.value; patch('settings', 1, { online_cutoff: el.value }); S.data.settings = s3; J.save('data'); }
  };
}(window, document, window.JC));
