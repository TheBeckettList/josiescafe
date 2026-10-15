/* Josie's World · the tutorial. Three parts, from the Help board:
   1. a welcome the first time someone signs in (Show me / Later);
   2. steps on the screen itself: the thing is lit up, one short card, Skip / Next;
   3. the ? at the top opens "On this screen": the steps as a list, tap one to see it, or "Show me again".
   Steps depend on the screen and on who is signed in (staff on the bar or kitchen only see the map and the lights). EN and ES. Plain ES5. */
(function (w, d) {
  'use strict';
  var J = w.J2, S = J.S, esc = J.esc, T = J.tour = {};

  var TXT = {
    en: {
      onScreen: 'On this screen', showAgain: 'Show me again', skip: 'Skip', next: 'Next', done: 'Got it', back: 'Back', close: 'Close',
      // register
      cats: ['Pick a group', 'Tap a group to see its dishes. The star is the favourites.'],
      tiles: ['Tap a dish to add it', 'One tap adds it. The little circles show what is in it.'],
      tk: ['Your ticket', 'Everything you tapped is here. Tap a circle on a line to leave something out, add it back, or swap it.'],
      diets: ['Diet buttons', 'Tap Vegan, Gluten free or Kosher-style and every dish shows what changes, and what it can still be.'],
      seg: ['For here or to go', 'Pick one. To go adds the box charge for each item.'],
      pay: ['Pay now', 'Take the payment now. For here, you pick a stick next.'],
      later: ['Pay later', 'Send it to the bar and kitchen now and take the payment when they finish.'],
      tabs: ['The map', 'Overview shows every stick, table, the bar and the kitchen, live. Tap things on it.'],
      help: ['The ? explains anything', 'Tap the ?, then tap the part of the screen you want explained. It shows you step by step.'],
      lang: ['English or Spanish', 'EN | ES changes every word on this screen, for you only.'],
      // which stick
      sticks: ['Pick a stick', 'Tap a free stick. It is the number the guest keeps. Orders for here go to the kitchen the moment you tap.'],
      stickTotal: ['What they ordered', 'This is the ticket the kitchen and bar will see.'],
      // pay
      methods: ['How are they paying?', 'Cash in lempiras or dollars, or card. For cash, tap what they hand you and the change shows.'],
      complete: ['Complete', 'Finish the sale. For here, the stick goes into the waiting pot until you place it on a table.'],
      // overview
      ovmap: ['The café, live', 'Everything happening right now. Tap the bar, the kitchen, the fridge, the coffee beans, the menu board, the sign or a table to look inside.'],
      ovrail: ['Right now', 'Every number: who still has to pay, who is being made, who is waiting. It updates by itself.'],
      ovcta: ['One tap per job', 'The button on a row is always the next thing: Place, Take payment, or Stick back.'],
      ovdone: ['Just done', 'Finished numbers stay here for a while. Tap Undo if one was closed by mistake.'],
      gear: ['The pencil', 'Every popup has a pencil that flips it to its setup. What you can change depends on who you are.'],
      ovkitchen: ['The kitchen', 'Tap it to read the kitchen tickets, one at a time. Nothing to press: just read, and scroll for more.'],
      ovbar: ['The bar', 'Tap it to read the bar tickets, one at a time. Nothing to press: just read, and scroll for more.'],
      ovinv: ['The lights', 'Tap the fridge or the coffee beans, pick an item, and set it to Plenty, Low or Out. The menu follows at once.'],
      // manager
      mstats: ['Today so far', 'Sales, orders, the average wait per station and the busiest 15 minutes. Station averages only, never one person.'],
      mloved: ['Most loved and running low', 'What sold most today, and what ran low or out.'],
      mphones: ['Kitchen and bar phones', 'Send the link, give the code, and a phone gets every ticket. New code stops all phones until they type it again.'],
      mpay: ['Payroll', 'Only Josie sees this: hours times rate, paid by cash or transfer, with Undo.'],
      welcomeLook: 'A quick look around. You can replay it any time with the ? at the top, then tap what you want shown.'
    },
    es: {
      onScreen: 'En esta pantalla', showAgain: 'Muéstrame otra vez', skip: 'Saltar', next: 'Siguiente', done: 'Listo', back: 'Atrás', close: 'Cerrar',
      cats: ['Elige un grupo', 'Toca un grupo para ver sus platos. La estrella son los favoritos.'],
      tiles: ['Toca un plato para agregarlo', 'Un toque lo agrega. Los circulitos muestran lo que lleva.'],
      tk: ['Tu ticket', 'Todo lo que tocaste está aquí. Toca un circulito en una línea para quitar algo, ponerlo otra vez o cambiarlo.'],
      diets: ['Botones de dieta', 'Toca Vegano, Sin gluten o Kosher-style y cada plato muestra qué cambia y qué puede seguir siendo.'],
      seg: ['Aquí o para llevar', 'Elige uno. Para llevar suma el cargo de caja por cada artículo.'],
      pay: ['Pagar ahora', 'Cobra ahora. Si es para aquí, sigues con el palito.'],
      later: ['Pagar después', 'Mándalo al bar y a la cocina ahora y cobra cuando terminen.'],
      tabs: ['El mapa', 'Mapa muestra cada palito, mesa, el bar y la cocina, en vivo. Toca las cosas.'],
      help: ['El ? explica todo', 'Toca el ?, luego toca la parte de la pantalla que quieras entender. Te lo muestra paso a paso.'],
      lang: ['Inglés o español', 'EN | ES cambia cada palabra de esta pantalla, solo para ti.'],
      sticks: ['Elige un palito', 'Toca un palito libre. Es el número que se queda el cliente. Los pedidos para aquí van a la cocina al tocar.'],
      stickTotal: ['Lo que pidieron', 'Este es el ticket que verán la cocina y el bar.'],
      methods: ['¿Cómo pagan?', 'Efectivo en lempiras o dólares, o tarjeta. Con efectivo, toca lo que te dan y se ve el cambio.'],
      complete: ['Completar', 'Termina la venta. Para aquí, el palito va a la olla de espera hasta que lo pongas en una mesa.'],
      ovmap: ['El café, en vivo', 'Todo lo que pasa ahora. Toca el bar, la cocina, el refri, los granos, el menú, el letrero o una mesa para ver adentro.'],
      ovrail: ['Ahora mismo', 'Cada número: quién falta por pagar, quién se está preparando, quién espera. Se actualiza solo.'],
      ovcta: ['Un toque por tarea', 'El botón de una fila siempre es lo siguiente: Poner, Cobrar o Devolver palito.'],
      ovdone: ['Recién terminados', 'Los números terminados se quedan aquí un rato. Toca Deshacer si cerraste uno por error.'],
      gear: ['El lápiz', 'Cada ventana tiene un lápiz que la pasa a su configuración. Lo que puedes cambiar depende de quién eres.'],
      ovkitchen: ['La cocina', 'Tócala para leer los tickets de cocina, uno por uno. Nada que presionar: solo lee y desliza para ver más.'],
      ovbar: ['El bar', 'Tócalo para leer los tickets del bar, uno por uno. Nada que presionar: solo lee y desliza para ver más.'],
      ovinv: ['Las luces', 'Toca el refri o los granos, elige un artículo y ponlo en Bastante, Poco o Agotado. El menú lo sigue al instante.'],
      mstats: ['Hoy hasta ahora', 'Ventas, pedidos, la espera promedio por estación y los 15 minutos más ocupados. Solo promedios por estación, nunca una persona.'],
      mloved: ['Lo más pedido y lo que se acaba', 'Lo que más se vendió hoy y lo que se acabó o quedó poco.'],
      mphones: ['Teléfonos de cocina y bar', 'Manda el enlace, da el código y el teléfono recibe cada ticket. Un código nuevo detiene todos hasta que lo escriban otra vez.'],
      mpay: ['Planilla', 'Solo Josie ve esto: horas por tarifa, pagado en efectivo o transferencia, con Deshacer.'],
      welcomeLook: 'Un vistazo rápido. Puedes repetirlo cuando quieras con el ? de arriba y toca lo que quieras ver.'
    }
  };
  T.TXT = TXT;
  function tx(id) { var l = (TXT[S.lang] || TXT.en); return l[id] || TXT.en[id]; }

  /* which screen are we on */
  T.screen = function () {
    var tab = S.tab;
    if (S.device && S.device.mode === 'inventory') { return 'overview'; }
    if (tab === 'manager') { return 'manager'; }
    if (tab === 'overview') { return 'overview'; }
    if (S.ui.view === 'stick') { return 'stick'; }
    if (S.ui.view === 'pay') { return 'pay'; }
    return 'pos';
  };
  function isStaffStation() { var p = J.eff(); return !!(p && p.role === 'staff' && (p.station === 'bar' || p.station === 'kitchen')); }

  /* the steps for a screen: [id, selector, union?] */
  function defs(screen) {
    var p = J.eff() || {}, list = [];
    if (screen === 'pos') {
      list = [['cats', '.cat', 1], ['tiles', '.tile'], ['tk', '.tk'], ['diets', '.dchip', 1], ['seg', '.seg2'], ['pay', '.paybtn'], ['later', '.later'], ['tabs', '.tabs'], ['lang', '.lang'], ['help', '.qbtn']];
    } else if (screen === 'stick') { list = [['sticks', '.stk-right'], ['stickTotal', '.stk-card'], ['help', '.qbtn']]; }
    else if (screen === 'pay') { list = [['methods', '.methods'], ['complete', '.paybtn.wide'], ['help', '.qbtn']]; }
    else if (screen === 'overview') {
      if (isStaffStation()) { list = [['ovmap', '.mapbox'], [p.station === 'bar' ? 'ovbar' : 'ovkitchen', '.hit[data-ov="' + (p.station === 'bar' ? 'bar' : 'kitchen') + '"]'], ['ovinv', '.hit[data-ov="fridge"]'], ['ovrail', '.orail'], ['help', '.qbtn']]; }
      else { list = [['ovmap', '.mapbox'], ['ovrail', '.orail'], ['ovcta', '.ncta'], ['ovdone', '.undo'], ['gear', null], ['help', '.qbtn']]; }
    } else if (screen === 'manager') {
      list = [['mstats', '.mstats'], ['mloved', '.mloved'], ['mphones', '.mphones']];
      if (J.can('josie')) { list.push(['mpay', '.mpayroll']); }
      list.push(['help', '.qbtn']);
    }
    return list;
  }
  T.list = function (screen) {   // only the steps whose thing is actually on screen
    var root = d.getElementById('app'), out = [], l = defs(screen), i;
    for (i = 0; i < l.length; i++) { if (!l[i][1] || root.querySelector(l[i][1])) { out.push({ id: l[i][0], sel: l[i][1], all: !!l[i][2] }); } }
    return out;
  };
  T.start = function (at) {
    var screen = T.screen(), l = T.list(screen);
    if (!l.length) { return; }
    S.ui.tutorial = false; S.ui.helpOpen = false;
    S.ui.tour = { screen: screen, ids: l, i: Math.min(at || 0, l.length - 1) };
    J.changed();
  };
  T.openHelp = function () { S.ui.tour = null; S.ui.tutorial = false; S.ui.helpOpen = true; J.changed(); };
  T.close = function (done) { var bt = S.ui.tour && S.ui.tour.bite; if (bt && J.setup) { J.setup.leave(bt, done === true); return; } S.ui.tour = null; S.ui.helpOpen = false; S.ui.tutorial = false; J.changed(); };

  /* markup: the container is always cheap; after() fills it in once the screen is painted */
  T.html = function () { return (S.ui.tour || S.ui.helpOpen) ? '<div id="tourlayer" class="tourlayer"></div>' : ''; };
  function rectOf(step) {
    var root = d.getElementById('app'), els, i, r, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    if (!step.sel) { return null; }
    els = step.all ? root.querySelectorAll(step.sel) : [root.querySelector(step.sel)];
    if (!step.all && els[0] && els[0].scrollIntoView) { r = els[0].getBoundingClientRect(); if (r.height < w.innerHeight - 200 && (r.bottom > w.innerHeight - 190 || r.top < 70)) { try { els[0].scrollIntoView({ block: 'start' }); } catch (e) {} } }
    for (i = 0; i < els.length; i++) { if (!els[i]) { continue; } r = els[i].getBoundingClientRect(); if (r.width < 2) { continue; } x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
    return x0 > 1e8 ? null : { l: x0, t: y0, w: x1 - x0, h: y1 - y0 };
  }
  T.after = function () {
    var host = d.getElementById('tourlayer'), t = S.ui.tour, h = '', i, st, r, pad = 8, cw = 330, ch, left, top, vw = w.innerWidth, vh = w.innerHeight;
    if (!host) { return; }
    host.className = 'tourlayer';
    if (S.ui.helpOpen && !t && T.pick) { T.pick(host); return; }
    if (S.ui.helpOpen && !t) {
      var l = T.list(T.screen());
      h = '<div class="tscrim" data-act="tourClose"></div><div class="thelp"><b>' + esc(tx('onScreen')) + '</b>';
      for (i = 0; i < l.length; i++) { h += '<button type="button" class="tstep" data-act="tourGo" data-arg="' + i + '"><i>' + (i + 1) + '</i><span>' + esc(tx(l[i].id)[0]) + '</span></button>'; }
      h += '<button type="button" class="btn primary wide" data-act="tourGo" data-arg="0">' + esc(tx('showAgain')) + '</button></div>';
      host.innerHTML = h; return;
    }
    if (!t) { host.innerHTML = ''; return; }
    st = t.ids[t.i]; if (!st) { T.close(); return; }
    r = rectOf(st); var txt = tx(st.id);
    var doing = st.mode === 'do';
    host.className = 'tourlayer' + (doing ? ' tdo' : '');
    h = doing ? '' : '<div class="tscrim' + (r ? ' clear' : '') + '"></div>';
    if (r) { h += '<div class="tspot' + (doing ? ' do' : '') + '" style="left:' + (r.l - pad) + 'px;top:' + (r.t - pad) + 'px;width:' + (r.w + pad * 2) + 'px;height:' + (r.h + pad * 2) + 'px"></div>'; }
    var dots = '', n = t.ids.length;
    for (i = 0; i < n; i++) { dots += '<i class="' + (i === t.i ? 'on' : '') + '"></i>'; }
    h += '<div class="tcard" id="tcard"><button type="button" class="tx" data-act="tourClose" aria-label="' + esc(tx('close')) + '">&times;</button><b>' + esc(txt[0]) + '</b><p>' + esc(txt[1]) + '</p><div class="tdots">' + dots + '</div><div class="tbtns">' +
      (t.i > 0 ? '<button type="button" class="btn soft" data-act="tourPrev">' + esc(tx('back')) + '</button>' : '<button type="button" class="btn soft" data-act="tourClose">' + esc(tx('skip')) + '</button>') +
      '<button type="button" class="btn primary" data-act="tourNext">' + esc(t.i === n - 1 ? tx('done') : tx('next')) + '</button></div></div>';
    host.innerHTML = h;
    var card = d.getElementById('tcard'); ch = card.offsetHeight;
    if (r) {
      left = Math.max(12, Math.min(vw - cw - 12, r.l + r.w / 2 - cw / 2));
      top = r.t + r.h + pad + 14; if (top + ch > vh - 12) { top = r.t - pad - 14 - ch; }
      if (top < 12) { top = Math.max(12, Math.min(vh - ch - 12, r.t + 16)); left = (r.l + r.w / 2 > vw / 2) ? Math.max(12, r.l - cw - 20) : Math.min(vw - cw - 12, r.l + r.w + 20); }
    } else { left = (vw - cw) / 2; top = (vh - ch) / 2; }
    top = Math.max(12, Math.min(top, vh - ch - 12));
    card.style.left = left + 'px'; card.style.top = top + 'px';
  };

  T.enter = function (t) { var st = t.ids[t.i]; if (st && st.go) { st.go(); } };
  T.handle = function (act, arg) {
    var t = S.ui.tour;
    switch (act) {
      case 'help': T.openHelp(); return true;
      case 'tourStart': T.start(0); return true;
      case 'tourGo': T.start(Number(arg) || 0); return true;
      case 'tourNext': if (t) { if (t.i >= t.ids.length - 1) { T.close(true); } else { t.i += 1; T.enter(t); J.changed(); } } return true;
      case 'tourPrev': if (t && t.i > 0) { t.i -= 1; T.enter(t); J.changed(); } return true;
      case 'tourClose': T.close(); return true;
    }
    return false;
  };
  T.welcomeLook = function () { return tx('welcomeLook'); };
  w.addEventListener('resize', function () { if (S.ui.tour || S.ui.helpOpen) { J.changed(); } });
}(window, document));
