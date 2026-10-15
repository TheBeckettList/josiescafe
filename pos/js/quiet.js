/* Josie's World · quiet-time inventory prompts for the bar and the kitchen.
   The idea: stock gets looked at often enough, and nobody's break or cool-down is ever interrupted.
   - Nothing at all while the station has tickets, or for a while after (longer after a rush, so the cooks can breathe).
   - Then one small, silent card at a time: "Quick look: Milk. Plenty / Low / Out". No sound, no buzz, no push, no timer, no score.
   - Only things that are actually due (coffee beans at the grinder about every 90 minutes; fridge items about every 2 and a half hours; dry goods about every 4),
     the most overdue first, at most 3 an hour per station, and at least 20 minutes between them.
   - "Later" waits 20 minutes (longer if it is put off again); "On break" waits 30. Closing time is left alone.
   A check that finds nothing changed ("still plenty") counts. Plain ES5. */
(function (w) {
  'use strict';
  var J = w.J2, S = J.S, esc = J.esc, JC = w.JC, Q = J.quiet = {};
  var K = 'p2.quiet', MIN = 60000;
  var RULES = { cool: 3, coolAfterRush: 8, rushTickets: 3, rushWindow: 30, gap: 20, perHour: 3, later: 20, laterMax: 60, onBreak: 30, beans: 90, fridge: 150, dry: 240, closeAfter: 14 * 60 + 15 };
  var st = JC.get(K, null) || { snooze: 0, brk: 0, shown: [], asked: {}, checked: {} };
  var busy = { bar: { last: 0, rush: 0 }, kitchen: { last: 0, rush: 0 } };
  var stationMap = null, stationMapFor = null;
  function save() { JC.set(K, st); }
  var X = {
    en: { look: 'Quick look', last: 'Last checked', ago: 'ago', never: 'a while ago', plenty: 'Plenty', low: 'Low', out: 'Out', later: 'Later', brk: 'I’m on break', min: 'min', hr: 'h', calm: 'Only when it is quiet. No rush.' },
    es: { look: 'Un vistazo', last: 'Revisado hace', ago: '', never: 'hace rato', plenty: 'Hay', low: 'Poco', out: 'Se acabó', later: 'Luego', brk: 'Estoy en descanso', min: 'min', hr: 'h', calm: 'Solo cuando está tranquilo. Sin prisa.' }
  };
  function t(k) { return (X[S.lang] || X.en)[k]; }

  function myStation() {
    var p = J.eff && J.eff();
    if (!p || p.role !== 'staff') { return null; }
    return p.station === 'bar' || p.station === 'kitchen' ? p.station : null;
  }
  /* which station an ingredient belongs to: the stations of the dishes that use it (beans at the grinder are the bar's) */
  function stationsOf() {
    var dt = S.data; if (!dt) { return {}; }
    if (stationMap && stationMapFor === dt.items) { return stationMap; }
    var m = {}, di = J.ix().di, id, rows, i, it, c, stn;
    for (id in di) {
      if (!di.hasOwnProperty(id)) { continue; }
      it = J.ix().itemById[id]; if (!it) { continue; }
      c = J.ix().catById[it.category_id]; stn = c ? c.station : null; if (stn !== 'bar' && stn !== 'kitchen') { continue; }
      rows = di[id]; for (i = 0; i < rows.length; i++) { (m[rows[i].ingredient_id] = m[rows[i].ingredient_id] || {})[stn] = 1; }
    }
    stationMap = m; stationMapFor = dt.items; return m;
  }
  function sampleBusy(stn) {
    var f = J.ov && J.ov.feed && J.ov.feed[stn], b = busy[stn], n = f && f.tickets ? f.tickets.length : 0, now = Date.now();
    if (n > 0) { b.last = now; }
    if (n >= RULES.rushTickets) { b.rush = now; }
    return n;
  }
  function quietNow(stn) {
    var n = sampleBusy(stn), b = busy[stn], now = Date.now(), cool;
    if (n > 0) { return false; }
    cool = (now - b.rush < RULES.rushWindow * MIN) ? RULES.coolAfterRush : RULES.cool;
    return now - b.last >= cool * MIN;
  }
  function openHours() { var n = J.hnNow(), m = n.getUTCHours() * 60 + n.getUTCMinutes(); return m < RULES.closeAfter; }
  function ageOf(g) { var at = g.light_set_at ? new Date(g.light_set_at).getTime() : 0, c = st.checked[g.id] || 0; return Date.now() - Math.max(at, c); }
  function thresholdOf(g) { return (g.required_check || g.location === 'grinder' ? RULES.beans : g.location === 'fridge' ? RULES.fridge : RULES.dry) * MIN; }
  function dueItem(stn) {
    var l = (S.data && S.data.ingredients) || [], sm = stationsOf(), best = null, bestR = 1, i, g, r, mine;
    for (i = 0; i < l.length; i++) {
      g = l[i]; if (!g.inventoried || g.active === false) { continue; }
      mine = sm[g.id] ? !!sm[g.id][stn] : (g.location === 'grinder' ? stn === 'bar' : true);
      if (g.location === 'grinder' && stn !== 'bar') { mine = false; }
      if (!mine) { continue; }
      r = ageOf(g) / thresholdOf(g); if (r >= bestR) { best = g; bestR = r; }
    }
    return best;
  }
  /* the one card to show right now, or null (also a pure check for tests) */
  Q.current = function () {
    var stn = myStation(), now = Date.now(), recent, i;
    if (!stn || !S.data || !openHours()) { return null; }
    if (!quietNow(stn)) { return null; }
    if (now < st.snooze || now < st.brk) { return null; }
    recent = 0; for (i = 0; i < st.shown.length; i++) { if (now - st.shown[i] < 60 * MIN) { recent += 1; } }
    if (recent >= RULES.perHour) { return null; }
    if (st.shown.length && now - st.shown[st.shown.length - 1] < RULES.gap * MIN) { return null; }
    return dueItem(stn);
  };
  function agoText(g) {
    var m = Math.round(ageOf(g) / MIN);
    if (!g.light_set_at && !st.checked[g.id]) { return t('never'); }
    return t('last') + ' ' + (m >= 90 ? Math.round(m / 6) / 10 + ' ' + t('hr') : m + ' ' + t('min')) + (S.lang === 'es' ? '' : ' ' + t('ago'));
  }
  Q.card = function () {
    var g = Q.current(), lt;
    if (!g) { return ''; }
    lt = J.light(g.id);
    return '<section class="rcard quiet"><small>' + esc(t('look')) + '</small><div class="qrow">' + J.ingIcon(g.id, 54) + '<span class="qt"><b>' + esc(J.nm(g.name)) + '</b><i>' + esc(agoText(g)) + '</i></span></div>' +
      '<div class="qbtns">' + [['green', 'plenty'], ['amber', 'low'], ['red', 'out']].map(function (x) { return '<button type="button" class="lg ' + x[0] + (lt === x[0] ? ' cur' : '') + '" data-act="quietSet" data-arg="' + g.id + '|' + x[0] + '"><i></i>' + esc(t(x[1])) + '</button>'; }).join('') + '</div>' +
      '<div class="qlinks"><button type="button" data-act="quietLater" data-arg="' + g.id + '">' + esc(t('later')) + '</button><button type="button" data-act="quietBreak">' + esc(t('brk')) + '</button></div></section>';
  };
  Q.handle = function (act, arg) {
    var p, now = Date.now(), a;
    if (act === 'quietSet') { p = String(arg).split('|'); J.setLight(p[0], p[1]); st.checked[p[0]] = now; st.shown.push(now); st.shown = st.shown.slice(-12); delete st.asked[p[0]]; save(); J.changed(); return true; }
    if (act === 'quietLater') { a = st.asked[arg] = (st.asked[arg] || 0) + 1; st.snooze = now + Math.min(RULES.laterMax, RULES.later * a) * MIN; save(); J.changed(); return true; }
    if (act === 'quietBreak') { st.brk = now + RULES.onBreak * MIN; save(); J.changed(); return true; }
    return false;
  };
  Q.rules = RULES;
  Q.reset = function () { st = { snooze: 0, brk: 0, shown: [], asked: {}, checked: {} }; busy = { bar: { last: 0, rush: 0 }, kitchen: { last: 0, rush: 0 } }; save(); };
}(window));
