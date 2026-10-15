/* Josie's World · engine. Diet adaptation, the out cascade as the register sees it, the cart, and order building.
   Pure logic: no drawing. Plain ES5. */
(function (w, d, JC) {
  'use strict';
  var J = w.J2, S = J.S, r2 = J.r2;

  /* ───────────── helpers ───────────── */
  function dietObj(key) { return J.ix().dietByKey[key] || null; }
  J.dietClaim = function (key) { var dd = dietObj(key); return dd ? (JC.tr(dd.claim, S.lang) || JC.tr(dd.name, S.lang)) : key; };
  J.dietName = function (key) { var dd = dietObj(key); return dd ? JC.tr(dd.name, S.lang) : key; };
  J.ingName = function (id) { var g = J.ix().ing[id]; return g ? JC.tr(g.name, S.lang) : ''; };
  J.ingIcon = function (id, size) {
    var g = J.ix().ing[id]; if (!g || !g.icon) { return ''; }
    var p = g.icon.split(':'); return w.J2ART ? w.J2ART.svg(p[0] === 'menu' ? 'menu' : 'ing', p[1], size || 24) : '';
  };
  J.stationOf = function (item) { var c = J.ix().catById[item.category_id]; return c ? c.station : 'kitchen'; };
  J.togoFor = function (item) {
    if (item.togo_charge !== null && item.togo_charge !== undefined && item.togo_charge !== '') { return Number(item.togo_charge); }
    var c = J.ix().catById[item.category_id]; return c ? Number(c.togo_charge || 0) : 0;
  };
  J.isCounted = function (item) { var c = J.ix().catById[item.category_id]; return !!(c && c.counted); };

  /* a diet says "no" to an ingredient only if Josie marked it: unconfirmed counts as fine */
  function noFor(dietKey, ingId) { var dd = dietObj(dietKey); return !!(dd && J.ix().marks[dd.id + ':' + ingId] === 'no'); }
  function fitsAll(diets, ingId) { for (var i = 0; i < diets.length; i++) { if (noFor(diets[i], ingId)) { return false; } } return true; }
  function swapOptions(elId, dietKey) {
    var list = J.ix().swapsBy[elId] || [], dd = dietKey ? dietObj(dietKey) : null, out = [], i, s;
    for (i = 0; i < list.length; i++) {
      s = list[i];
      if ((dd ? s.diet_id === dd.id : !s.diet_id) && J.light(s.alternative_id) === 'green') { out.push(s); }
    }
    return out;
  }
  J.swapOptions = swapOptions;

  /* What a dish becomes under the active diets and today's stock.
     status: 'fine' | 'adapted' | 'cant'  ·  chips: no/swap chips made by a diet or by stock  ·  core: the ingredient that is the dish
     warn: kosher-style meat and dairy together  ·  out: the dish itself is out today */
  J.adapt = function (item, diets) {
    var rows = J.ix().di[item.id] || [], chips = [], core = null, i, r, g, opts, dk, k, blockedBy = null, warn = [];
    var st = J.dishState(item.id), removed = {};
    diets = diets || [];
    for (i = 0; i < rows.length; i++) {
      r = rows[i]; g = J.ix().ing[r.ingredient_id]; if (!g) { continue; }
      dk = null;
      for (k = 0; k < diets.length; k++) { if (noFor(diets[k], g.id)) { dk = diets[k]; break; } }
      if (dk) {
        if (r.is_core) { core = g.id; blockedBy = dk; continue; }
        opts = swapOptions(g.id, dk);
        var def = null; for (k = 0; k < opts.length; k++) { if (opts[k].is_default && fitsAll(diets, opts[k].alternative_id)) { def = opts[k]; break; } }
        if (def) { chips.push({ type: 'swap', ingredient_id: g.id, with_id: def.alternative_id, diet: dk }); }
        else { chips.push({ type: 'no', ingredient_id: g.id, diet: dk }); }
        removed[g.id] = true;
      } else if (g.kind === 'element' && J.light(g.id) === 'red') {
        chips.push({ type: 'no', ingredient_id: g.id, diet: null, stock: true }); removed[g.id] = true;
      }
    }
    if (diets.indexOf('kosher_style') >= 0) {
      var meat = false, dairy = false;
      for (i = 0; i < rows.length; i++) {
        g = J.ix().ing[rows[i].ingredient_id]; if (!g || removed[g.id]) { continue; }
        if (g.meat) { meat = true; } if (g.dairy) { dairy = true; }
      }
      if (meat && dairy) { warn.push('meatdairy'); }
    }
    return { status: core ? 'cant' : (chips.length ? 'adapted' : 'fine'), chips: chips, core: core, blockedBy: blockedBy, warn: warn, out: !!st.out };
  };

  /* The text on a dish tile: what happened, in the cafe's words */
  J.tileNote = function (item, a) {
    var diets = S.cart ? S.cart.diets : [], i, parts = [];
    if (a.out) { return { kind: 'out', text: J.t('outToday') }; }
    if (a.status === 'cant') { return { kind: 'cant', text: J.ingName(a.core).toLowerCase() + ' ' + J.t('isTheDish') }; }
    if (a.chips.length) {
      for (i = 0; i < a.chips.length; i++) { parts.push(J.t('noX') + J.ingName(a.chips[i].ingredient_id).toLowerCase()); }
      return { kind: 'adapted', text: parts.slice(0, 2).join(', ') + (parts.length > 2 ? '…' : '') };
    }
    if (diets.length) {
      var names = []; for (i = 0; i < diets.length; i++) { names.push(J.dietClaim(diets[i])); }
      return { kind: 'fine', text: '✓ ' + names.join(' · ') };
    }
    return null;
  };

  /* ───────────── the cart ───────────── */
  function newCart() { return { name: '', type: 'here', diets: [], lines: [], stick: null, addTo: null }; }
  J.newCart = newCart;
  J.cart = function () { if (!S.cart) { S.cart = newCart(); } return S.cart; };
  J.saveCart = function () { J.save('cart'); };
  J.clearCart = function () { S.cart = newCart(); J.save('cart'); };
  J.cartCount = function () { var n = 0, c = J.cart(); for (var i = 0; i < c.lines.length; i++) { n += c.lines[i].qty; } return n; };
  J.toggleDiet = function (key) {
    var c = J.cart(), i = c.diets.indexOf(key);
    if (i >= 0) { c.diets.splice(i, 1); } else { c.diets.push(key); }
    J.saveCart(); J.changed();
  };
  J.addItem = function (itemId, opts) {
    var it = J.ix().itemById[itemId], c = J.cart(), i, l, a;
    if (!it || !it.available) { return false; }
    a = J.adapt(it, c.diets);
    if (a.out) { return false; }
    if (a.status === 'cant' && !(opts && opts.anyway)) { return 'cant'; }
    for (i = 0; i < c.lines.length; i++) {
      l = c.lines[i];
      if (l.item_id === itemId && !l.note && !(l.edits && l.edits.length)) { l.qty += 1; J.saveCart(); J.changed(); return true; }
    }
    c.lines.push({ key: J.uuid(), item_id: itemId, qty: 1, note: '', edits: [], anyway: !!(opts && opts.anyway) });
    J.saveCart(); J.changed(); return true;
  };
  J.changeQty = function (key, delta) {
    var c = J.cart(), i;
    for (i = 0; i < c.lines.length; i++) {
      if (c.lines[i].key === key) {
        c.lines[i].qty += delta; if (c.lines[i].qty < 1) { c.lines.splice(i, 1); }
        break;
      }
    }
    J.saveCart(); J.changed();
  };
  J.lineOf = function (key) { var c = J.cart(); for (var i = 0; i < c.lines.length; i++) { if (c.lines[i].key === key) { return c.lines[i]; } } return null; };

  /* Edits are what the cashier did by hand on a line: take an ingredient off, swap it, put it back anyway, add one. */
  J.setEdit = function (key, ingId, e) {
    var l = J.lineOf(key); if (!l) { return; }
    var keep = [], i; l.edits = l.edits || [];
    for (i = 0; i < l.edits.length; i++) { if (!(l.edits[i].ingredient_id === ingId && l.edits[i].type !== 'add')) { keep.push(l.edits[i]); } }
    if (e) { keep.push({ type: e.type, ingredient_id: ingId, with_id: e.with_id || null }); }
    l.edits = keep; J.saveCart(); J.changed();
  };
  J.addExtra = function (key, ingId) {
    var l = J.lineOf(key); if (!l) { return; }
    l.edits = l.edits || [];
    for (var i = 0; i < l.edits.length; i++) { if (l.edits[i].type === 'add' && l.edits[i].ingredient_id === ingId) { return; } }
    l.edits.push({ type: 'add', ingredient_id: ingId }); J.saveCart(); J.changed();
  };
  J.removeExtra = function (key, ingId) {
    var l = J.lineOf(key); if (!l) { return; }
    l.edits = (l.edits || []).filter(function (e) { return !(e.type === 'add' && e.ingredient_id === ingId); });
    J.saveCart(); J.changed();
  };

  /* The ingredient dots on a ticket line, in order, each with what is happening to it:
     state: 'in' | 'no' | 'swap' | 'back' | 'add'   (diet = the diet that caused it, with = the swapped-in ingredient) */
  J.lineDots = function (line) {
    var it = J.ix().itemById[line.item_id]; if (!it) { return []; }
    var c = J.cart(), a = J.adapt(it, c.diets), rows = J.ix().di[it.id] || [], dots = [], i, r, ch, e, chipBy = {}, edBy = {}, k;
    for (i = 0; i < a.chips.length; i++) { chipBy[a.chips[i].ingredient_id] = a.chips[i]; }
    for (i = 0; i < (line.edits || []).length; i++) { if (line.edits[i].type !== 'add') { edBy[line.edits[i].ingredient_id] = line.edits[i]; } }
    for (i = 0; i < rows.length; i++) {
      r = rows[i]; ch = chipBy[r.ingredient_id]; e = edBy[r.ingredient_id];
      var dot = { id: r.ingredient_id, state: 'in', diet: null, with_id: null, core: !!r.is_core, auto: false };
      if (ch) { dot.state = ch.type; dot.diet = ch.diet; dot.with_id = ch.with_id || null; dot.auto = true; dot.stock = !!ch.stock; }
      if (e) {
        if (e.type === 'back') { dot.state = ch ? 'back' : 'in'; dot.manual = true; }
        else if (e.type === 'no') { dot.state = 'no'; dot.manual = true; dot.with_id = null; }
        else if (e.type === 'swap') { dot.state = 'swap'; dot.with_id = e.with_id; dot.manual = true; }
      }
      dots.push(dot);
    }
    for (i = 0; i < (line.edits || []).length; i++) {
      if (line.edits[i].type === 'add') { dots.push({ id: line.edits[i].ingredient_id, state: 'add', manual: true }); }
    }
    return dots;
  };
  /* Chips as saved on the order (what the cooks see): only what changed */
  J.lineChips = function (line) {
    var dots = J.lineDots(line), out = [], i, dd;
    for (i = 0; i < dots.length; i++) {
      dd = dots[i];
      if (dd.state === 'no') { out.push({ type: 'no', ingredient_id: dd.id, diet: dd.manual ? null : dd.diet }); }
      else if (dd.state === 'swap') { out.push({ type: 'swap', ingredient_id: dd.id, with_id: dd.with_id, diet: dd.manual ? null : dd.diet }); }
      else if (dd.state === 'back') { out.push({ type: 'back', ingredient_id: dd.id, diet: null }); }
      else if (dd.state === 'add') { out.push({ type: 'add', ingredient_id: dd.id, diet: null }); }
    }
    return out;
  };

  /* ───────────── money ───────────── */
  J.linePrice = function (line) { var it = J.ix().itemById[line.item_id]; return it ? Number(it.price) : 0; };
  J.totals = function (cart, type, tip) {
    var st = J.settings(), sub = 0, togo = 0, i, l, it, tax, total, rateT = Number(st.tax_rate || 0);
    for (i = 0; i < cart.lines.length; i++) {
      l = cart.lines[i]; it = J.ix().itemById[l.item_id]; if (!it) { continue; }
      sub += Number(it.price) * l.qty;
      if (type === 'togo') { togo += J.togoFor(it) * l.qty; }
    }
    sub = r2(sub); togo = r2(togo);
    if (st.prices_include_tax) { total = r2(sub + togo); tax = r2(total - total / (1 + rateT)); }
    else { tax = r2((sub + togo) * rateT); total = r2(sub + togo + tax); }
    return { sub: sub, togo: togo, tax: tax, total: total, tip: r2(tip || 0), grand: r2(total + (tip || 0)) };
  };
  J.stationCounts = function (cart) {
    var out = { bar: 0, kitchen: 0 }, i, it, st;
    for (i = 0; i < cart.lines.length; i++) { it = J.ix().itemById[cart.lines[i].item_id]; if (!it) { continue; } st = J.stationOf(it); if (out[st] !== undefined) { out[st] += cart.lines[i].qty; } }
    return out;
  };

  /* ───────────── sticks and numbers ───────────── */
  /* sticks 1..N in the bin, each with where it is now (a table, the waiting pot, or free in the home pot) */
  J.sticks = function () {
    var l = (S.floor && S.floor.sticks) || [], out = [], i;
    for (i = 0; i < l.length; i++) { out.push(l[i]); }
    return out;
  };
  J.nextFreeStick = function () {
    var l = J.sticks(), i;
    for (i = 0; i < l.length; i++) { if (l[i].state === 'home') { return l[i].number; } }
    return null;
  };
  var seqKey = 'pos.seq';
  J.peekCode = function () {
    var seq = JC.get(seqKey, { day: '', n: 0 }), today = JC.today();
    return (S.device.code || 'A') + ((seq.day === today ? seq.n : 0) + 1);
  };
  J.nextCode = function () {
    var seq = JC.get(seqKey, { day: '', n: 0 }), today = JC.today();
    if (seq.day !== today) { seq = { day: today, n: 0 }; }
    seq.n += 1; JC.set(seqKey, seq);
    return (S.device.code || 'A') + seq.n;
  };

  /* ───────────── build the order that goes to the server (and into the local floor at once) ───────────── */
  /* opts: { pay: { method, given, tip, ref } | null, stick: number|null }  ->  the job payload for sync_order2 */
  J.buildOrder = function (opts) {
    var c = J.cart(), type = c.type, now = new Date().toISOString(), id = J.uuid(), items = [], pieces = {}, i, l, it, st, pid, pay = opts.pay || null;
    var tip = pay && pay.method === 'card' ? (pay.tip || 0) : 0, t = J.totals(c, type, tip), rt = J.rate(), hasBar = false, hasKit = false;
    for (i = 0; i < c.lines.length; i++) {
      l = c.lines[i]; it = J.ix().itemById[l.item_id]; if (!it) { continue; }
      st = J.stationOf(it);
      if (st === 'bar' || st === 'kitchen') {
        if (!pieces[st]) { pieces[st] = J.uuid(); }
        if (st === 'bar') { hasBar = true; } else { hasKit = true; }
      }
      items.push({ id: J.uuid(), item_id: it.id, name: JC.tr(it.name, 'en'), qty: l.qty, unit_price: Number(it.price),
        togo_charge: type === 'togo' ? J.togoFor(it) : 0, note: l.note || '', station: st, chips: J.lineChips(l), piece_id: pieces[st] || null });
    }
    var stick = c.addTo ? c.addTo.stick : (opts.stick || null);
    var pieceList = []; for (pid in pieces) { if (pieces.hasOwnProperty(pid)) { pieceList.push({ id: pieces[pid], station: pid, kind: c.addTo ? 'addon' : 'original' }); } }
    var number = c.addTo ? (c.addTo.number + '+') : (stick ? String(stick) : J.nextCode());
    var order = { id: id, device: S.device.code, number: number, customer_name: c.name || (c.addTo ? c.addTo.name : '') || null, order_type: c.addTo ? c.addTo.type : type,
      status: pay ? 'paid' : 'open', subtotal: t.sub, togo_total: t.togo, tax: t.tax, tip: t.tip, total: t.grand, staff_name: S.person ? S.person.name : null,
      created_by: S.person ? S.person.id : null, created_at: now, paid_at: pay ? now : null, has_bar: hasBar, has_kitchen: hasKit, stick_number: stick,
      diets: c.diets.slice(), note: null };
    var job = { order: order, items: items, pieces: pieceList, payments: [] };
    if (pay) {
      var given = pay.method === 'card' ? t.grand : (pay.method === 'cash_usd' ? r2(Number(pay.given) * rt) : Number(pay.given));
      job.payments.push({ id: J.uuid(), method: pay.method, amount: t.grand, tip: t.tip, usd_amount: pay.method === 'cash_usd' ? Number(pay.given) : null,
        usd_rate: pay.method === 'cash_usd' ? rt : null, card_ref: pay.ref || null, created_at: now });
      job.change = pay.method === 'card' ? 0 : r2(given - t.total);
    }
    return job;
  };

  /* apply a just-made order to our own picture of the floor so every screen updates at once, even offline */
  J.applyOrderLocally = function (job) {
    var f = S.floor; if (!f) { f = S.floor = { tables: [], sticks: [], open: [], done: [], lights: {}, dish_state: {} }; }
    var o = job.order, texts = [], i;
    for (i = 0; i < job.items.length; i++) { texts.push(job.items[i].qty + ' ' + job.items[i].name); }
    f.open.push({ id: o.id, number: o.number, name: o.customer_name, type: o.order_type, source: 'pos', stick: o.stick_number, status: o.status,
      total: o.total, diets: o.diets, created_at: o.created_at, items: texts.join(' · ') });
    if (o.stick_number) { var s = J.stickInfo(o.stick_number); if (s && s.state === 'home') { s.state = 'waiting'; } }
    J.save('floor');
  };
  J.submitOrder = function (opts) {
    var job = J.buildOrder(opts);
    S.log.unshift({ order: job.order, items: job.items, payments: job.payments, change: job.change || 0, synced: false });
    if (S.log.length > 150) { S.log.length = 150; }
    J.save('log');
    J.applyOrderLocally(job);
    // counted items (pastries) come off the local count at once
    for (var i = 0; i < job.items.length; i++) { var it = J.ix().itemById[job.items[i].item_id]; if (it && J.isCounted(it)) { it.stock = Number(it.stock || 0) - job.items[i].qty; } }
    J.save('data');
    J.enqueue('order', { order: job.order, items: job.items, pieces: job.pieces, payments: job.payments });
    return job;
  };

  /* ───────────── floor actions: do it here first, queue it, the server catches up ───────────── */
  J.placeStick = function (stick, tableId) {
    var s = J.stickInfo(stick); if (!s) { return; }
    var tbl = null, i, l = J.sticks();
    if (tableId) { for (i = 0; i < l.length; i++) { if (l[i].table_id === tableId && l[i].number !== stick) { tbl = l[i]; } } }
    if (tbl) { return false; }                      // a table holds one stick
    s.state = tableId ? 'table' : 'waiting'; s.table_id = tableId || null; J.save('floor');
    J.enqueue('place', { stick: stick, table_id: tableId || null });
    return true;
  };
  J.completeNumber = function (key) {
    var g = J.numberOf(key); if (!g || !g.paid) { return false; }
    var f = S.floor, ids = [], i, at = new Date().toISOString(), restore = null, s = g.stick ? J.stickInfo(g.stick) : null;
    for (i = 0; i < g.orders.length; i++) { ids.push(g.orders[i].id); }
    if (g.stick) { restore = { stick: g.stick, table_id: s ? s.table_id : null }; }
    f.open = f.open.filter(function (o) { return ids.indexOf(o.id) < 0; });
    for (i = 0; i < g.orders.length; i++) { var o = g.orders[i]; f.done.unshift({ id: o.id, number: o.number, name: o.name, type: o.type, stick: o.stick, total: o.total, completed_at: at, created_at: o.created_at, table_id: restore ? restore.table_id : null }); }
    if (s) { s.state = 'home'; s.table_id = null; }
    J.save('floor');
    J.enqueue('complete', { order_ids: ids, at: at, token: S.person ? S.person.token : null });
    return true;
  };
  J.undoDone = function (key) {
    var groups = J.justDone(), g = null, i;
    for (i = 0; i < groups.length; i++) { if (groups[i].key === key) { g = groups[i]; } }
    if (!g) { return; }
    var f = S.floor, ids = [], restore = null;
    for (i = 0; i < g.orders.length; i++) { ids.push(g.orders[i].id); }
    f.done = f.done.filter(function (o) { return ids.indexOf(o.id) < 0; });
    for (i = 0; i < g.orders.length; i++) {
      var o = g.orders[i];
      f.open.push({ id: o.id, number: o.number, name: o.name, type: o.type, source: 'pos', stick: o.stick, status: 'paid', total: o.total, diets: [], created_at: o.created_at, items: '' });
    }
    if (g.stick) {
      var s = J.stickInfo(g.stick), tid = g.table_id || null;
      if (s) { s.state = tid ? 'table' : 'waiting'; s.table_id = tid; }
      restore = { stick: g.stick, table_id: tid };
    }
    J.save('floor');
    J.enqueue('undo', { order_ids: ids, restore: restore });
  };
  J.takePayment = function (orderIds, pay) {
    var f = S.floor, now = new Date().toISOString(), pays = [], i, t, rt = J.rate(), tip = pay.method === 'card' ? (pay.tip || 0) : 0, firstTip = true;
    for (i = 0; i < orderIds.length; i++) {
      var o = null, k; for (k = 0; k < f.open.length; k++) { if (f.open[k].id === orderIds[i]) { o = f.open[k]; } }
      if (!o) { continue; }
      var tp = firstTip ? tip : 0; firstTip = false;
      pays.push({ id: J.uuid(), order_id: o.id, method: pay.method, amount: r2(Number(o.total) + tp), tip: tp,
        usd_amount: pay.method === 'cash_usd' && i === 0 ? Number(pay.given) : null, usd_rate: pay.method === 'cash_usd' && i === 0 ? rt : null, card_ref: pay.ref || null, created_at: now });
      o.status = 'paid'; o.total = r2(Number(o.total) + tp);
    }
    J.save('floor');
    J.enqueue('pay', { payments: pays });
  };
}(window, document, window.JC));
