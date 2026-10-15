/* Josie's World · "I have 5 minutes". A setup guide for Josie, opened with josiescafe.com/pos/?setup (or the card on the Manager tab).
   Small bites, about a minute each. Each one walks her through the real screen: the card points, she does it, Next. Where she left off is remembered.
   No scores, no streaks: a bite is either done or not. Plain ES5. */
(function (w, d) {
  'use strict';
  var J = w.J2, S = J.S, U = J.ui, esc = J.esc, T = J.tour, Z = J.setup = {};
  if (!T || !T.TXT) { return; }

  var X = {
    en: {
      startHi: 'Welcome', startTitle: 'Let’s set up your café.', startSub: 'Small bites, about a minute each. Start at the top and go down, or pick any one. Stop whenever you like: it remembers.', startGo: 'Start', startNext: 'Next bite', startList: 'Back to the list', startDone: 'Nice. That one is done.', startEnd: 'Everything is set up. The ? and the pencil are always there if you forget.',
      hi: 'Hi', five: 'I have 5 minutes.', fiveSub: 'Pick one small bite. Each takes about a minute, you do the real thing, and it remembers where you were.', min: '1 min', notNow: 'Not now', done: 'Done', again: 'Again', allDone: 'That is everything. The ? and the pencil are always there if you forget.', setupCard: 'I have 5 minutes', setupCardSub: 'Set the café up one small bite at a time.',
      b_pin: ['Your PIN', 'Choose the four digits only you know.'], b_hours: ['Hours and the sign', 'When you open, and when online orders stop.'], b_menu: ['The menu', 'Prices, favourites, what is in each dish.'], b_shelf: ['The shelf', 'What gets a light: fridge and coffee beans.'], b_pastries: ['The pastry dome', 'Counting what is in it.'],
      b_tables: ['Tables and sticks', 'Where everyone is sitting.'], b_register: ['Ringing up', 'The register in four taps.'], b_phones: ['Kitchen and bar phones', 'One link, one code.'], b_team: ['Team and wages', 'Who works here, their station, their wage, their PIN.'], b_day: ['Your day', 'Sales and who is waiting.'], b_ask: ['The ? and the pencil', 'How to ask the app, and how to change things.'],
      s_pin_1: ['Your PIN', 'This is your own row. Type four new digits in the PIN box and tap Save. Next time you sign in, use them.'],
      s_hours_1: ['Your sign', 'This is the sign on the map. Tap it any time to see if you are open. Now let us set the hours.'],
      s_hours_2: ['Which days?', 'Tap the days you open. A lit day is open.'],
      s_hours_3: ['Open and close', 'Set when the doors open and close. It saves as you go.'],
      s_hours_4: ['Online orders stop', 'Guests can order on the website until this time. It is 2 pm now.'],
      s_hours_5: ['Closed today', 'Switch this on if you have to close. The website tells guests at once.'],
      s_menu_1: ['The menu board', 'Tap it to see every dish, on or off.'],
      s_menu_2: ['Every dish', 'The star makes a favourite. The switch marks a dish out for today. Tap a dish name to open it.'],
      s_menu_3: ['The price', 'Tap minus or plus to change the price, L5 at a time.'],
      s_menu_4: ['What is in it', 'Add an ingredient and tick what goes in. The little circles on the register come from this.'],
      s_menu_5: ['Diets fit themselves', 'Vegan, gluten free and kosher-style show here. You never set them by hand.'],
      s_shelf_1: ['The fridge', 'Tap the fridge. These are the things that get a light.'],
      s_shelf_2: ['Pick what you count', 'Tap the ingredients you want a light for. Only those show up for the staff.'],
      s_shelf_3: ['The lights', 'Plenty, Low or Out. The staff set them, you can too. The menu follows at once.'],
      s_shelf_4: ['The coffee beans', 'The beans are checked at the grinder when a shift starts. It is the one check that is required.'],
      s_pastries_1: ['The pastry dome', 'It sits on the register counter with the monitor.'],
      s_pastries_2: ['How many are in it', 'Tap plus and minus to match what is in the dome. The bar hands them out.'],
      s_pastries_3: ['The squares', 'Tap the pencil. Each pastry is a square. Tap one to set its picture, price and how many, and to switch it on or off.'],
      s_pastries_4: ['Add your own', 'Tap Add a pastry, give it a name and pick a picture. It goes on the register as soon as it has a price.'],
      s_tables_1: ['The pots', 'Home holds the free sticks. Waiting holds the sticks whose food is on its way.'],
      s_tables_2: ['The tables', 'Each dashed box is a table. A light means someone is sitting there.'],
      s_tables_3: ['Right now', 'Every number, and the next job on each one: Place, Take payment, Stick back.'],
      s_register_1: ['Pick a group', 'Tap a group to see its dishes.'], s_register_2: ['Tap a dish', 'One tap adds it. The little circles are what is in it.'], s_register_3: ['The ticket', 'Everything tapped is here. Tap a circle to leave something out.'], s_register_4: ['Pay now', 'Take the payment, then pick a stick for here.'],
      s_team_1: ['Team and wages', 'Tap this button on the Manager tab. Only you see wages.'],
      s_team_2: ['Your people', 'Everyone who can sign in. Tap a person to change their station, language, wage or PIN, or to say they left.'],
      s_team_3: ['Add a person', 'Tap it, then name, station, wage per hour and a 4 digit PIN. They sign in with their name and that PIN, and their hours count from then on.'],
      s_phones_1: ['The phones', 'This is where the kitchen and bar phones get set up.'],
      s_phones_2: ['The link', 'Send this link to each phone. They add it to the home screen once.'],
      s_phones_3: ['The code', 'They type this code once. A new code stops every phone until it is typed again.'],
      s_phones_4: ['Send it', 'Tap Share link and send it to the kitchen and bar phones.'],
      s_day_1: ['Today so far', 'Sales, orders and the average wait for each station. Never one person.'],
      s_day_2: ['Most loved and running low', 'What sold the most, and what ran low.'],
      s_day_3: ['Payroll', 'Only you see this. Hours times rate, and you mark it paid.'],
      s_ask_1: ['The ?', 'Tap it on any screen, then tap the part you want explained.'],
      s_ask_2: ['The pencil', 'Every popup has a pencil. It flips the popup to its setup. What you can change depends on who you are.'],
      s_ask_3: ['This guide', 'Open this guide again from the Manager tab any time.']
    },
    es: {
      startHi: 'Bienvenida', startTitle: 'Vamos a armar tu café.', startSub: 'Pedacitos de un minuto. Empieza por arriba y sigue hacia abajo, o elige cualquiera. Para cuando quieras: recuerda dónde ibas.', startGo: 'Empezar', startNext: 'Siguiente', startList: 'Volver a la lista', startDone: 'Bien. Ese ya está.', startEnd: 'Todo está listo. El ? y el lápiz siempre están si se te olvida.',
      hi: 'Hola', five: 'Tengo 5 minutos.', fiveSub: 'Elige un pedacito. Cada uno toma un minuto, haces lo de verdad y recuerda dónde ibas.', min: '1 min', notNow: 'Ahora no', done: 'Listo', again: 'Otra vez', allDone: 'Eso es todo. El ? y el lápiz siempre están si se te olvida.', setupCard: 'Tengo 5 minutos', setupCardSub: 'Arma el café de a pedacitos.',
      b_pin: ['Tu PIN', 'Elige los cuatro dígitos que solo tú sabes.'], b_hours: ['Horario y letrero', 'Cuándo abres y cuándo paran los pedidos en línea.'], b_menu: ['El menú', 'Precios, favoritos, lo que lleva cada plato.'], b_shelf: ['El estante', 'Qué lleva luz: refri y granos de café.'], b_pastries: ['La cúpula de pasteles', 'Contar lo que hay.'],
      b_tables: ['Mesas y palitos', 'Dónde está sentado cada quien.'], b_register: ['Cobrar', 'La caja en cuatro toques.'], b_phones: ['Teléfonos de cocina y bar', 'Un enlace, un código.'], b_team: ['Equipo y salarios', 'Quién trabaja aquí, su estación, su salario, su PIN.'], b_day: ['Tu día', 'Ventas y quién espera.'], b_ask: ['El ? y el lápiz', 'Cómo preguntarle a la app y cómo cambiar cosas.'],
      s_pin_1: ['Tu PIN', 'Esta es tu fila. Escribe cuatro dígitos nuevos en el cuadro de PIN y toca Guardar. La próxima vez entras con ellos.'],
      s_hours_1: ['Tu letrero', 'Este es el letrero del mapa. Tócalo cuando quieras para ver si estás abierta. Ahora ponemos el horario.'],
      s_hours_2: ['¿Qué días?', 'Toca los días que abres. Un día encendido está abierto.'],
      s_hours_3: ['Abrir y cerrar', 'Pon la hora en que abren y cierran las puertas. Se guarda solo.'],
      s_hours_4: ['Pedidos en línea paran', 'Los clientes pueden pedir en el sitio hasta esta hora. Ahora son las 2 pm.'],
      s_hours_5: ['Cerrado hoy', 'Enciende esto si tienes que cerrar. El sitio web avisa a los clientes al instante.'],
      s_menu_1: ['El menú', 'Tócalo para ver cada plato, activo o apagado.'],
      s_menu_2: ['Cada plato', 'La estrella lo hace favorito. El interruptor lo marca agotado por hoy. Toca el nombre para abrirlo.'],
      s_menu_3: ['El precio', 'Toca menos o más para cambiar el precio, de L5 en L5.'],
      s_menu_4: ['Lo que lleva', 'Agrega un ingrediente y marca lo que lleva. Los circulitos de la caja salen de aquí.'],
      s_menu_5: ['Las dietas se calculan solas', 'Vegano, sin gluten y kosher-style aparecen aquí. Nunca las pones a mano.'],
      s_shelf_1: ['El refri', 'Toca el refri. Estas son las cosas que llevan luz.'],
      s_shelf_2: ['Elige qué contar', 'Toca los ingredientes que quieres con luz. Solo esos le salen al personal.'],
      s_shelf_3: ['Las luces', 'Bastante, Poco o Agotado. El personal las pone, tú también puedes. El menú lo sigue al instante.'],
      s_shelf_4: ['Los granos de café', 'Los granos se revisan en el molino al empezar el turno. Es la única revisión obligatoria.'],
      s_pastries_1: ['La cúpula de pasteles', 'Está en el mostrador de la caja, junto al monitor.'],
      s_pastries_2: ['Cuántos hay', 'Toca más y menos para igualar lo que hay en la cúpula. El bar los entrega.'],
      s_pastries_3: ['Los cuadros', 'Toca el lápiz. Cada pastel es un cuadro. Toca uno para poner su dibujo, precio y cuántos hay, y para encenderlo o apagarlo.'],
      s_pastries_4: ['Agrega los tuyos', 'Toca Agregar pastel, ponle nombre y elige un dibujo. Sale en la caja en cuanto tiene precio.'],
      s_tables_1: ['Las ollas', 'Casa guarda los palitos libres. Espera guarda los palitos cuyo pedido va en camino.'],
      s_tables_2: ['Las mesas', 'Cada caja punteada es una mesa. Una luz significa que alguien está sentado.'],
      s_tables_3: ['Ahora mismo', 'Cada número, y la siguiente tarea de cada uno: Poner, Cobrar, Devolver palito.'],
      s_register_1: ['Elige un grupo', 'Toca un grupo para ver sus platos.'], s_register_2: ['Toca un plato', 'Un toque lo agrega. Los circulitos son lo que lleva.'], s_register_3: ['El ticket', 'Todo lo que tocaste está aquí. Toca un circulito para quitar algo.'], s_register_4: ['Pagar ahora', 'Cobra y luego elige un palito si es para aquí.'],
      s_team_1: ['Equipo y salarios', 'Toca este botón en la pestaña de gerencia. Solo tú ves los salarios.'],
      s_team_2: ['Tu gente', 'Todos los que pueden entrar. Toca a una persona para cambiar su estación, idioma, salario o PIN, o para decir que ya se fue.'],
      s_team_3: ['Agregar persona', 'Tócalo, luego nombre, estación, salario por hora y un PIN de 4 dígitos. Entran con su nombre y ese PIN, y sus horas cuentan desde ese momento.'],
      s_phones_1: ['Los teléfonos', 'Aquí se arman los teléfonos de cocina y bar.'],
      s_phones_2: ['El enlace', 'Manda este enlace a cada teléfono. Lo agregan a la pantalla de inicio una vez.'],
      s_phones_3: ['El código', 'Lo escriben una sola vez. Un código nuevo detiene todos los teléfonos hasta que lo escriban otra vez.'],
      s_phones_4: ['Mándalo', 'Toca Compartir enlace y mándalo a los teléfonos de cocina y bar.'],
      s_day_1: ['Hoy hasta ahora', 'Ventas, pedidos y la espera promedio de cada estación. Nunca de una persona.'],
      s_day_2: ['Lo más pedido y lo que se acaba', 'Lo que más se vendió y lo que quedó poco.'],
      s_day_3: ['Planilla', 'Solo tú ves esto. Horas por tarifa, y tú marcas el pago.'],
      s_ask_1: ['El ?', 'Tócalo en cualquier pantalla y luego toca la parte que quieras entender.'],
      s_ask_2: ['El lápiz', 'Cada ventana tiene un lápiz. Pasa la ventana a su configuración. Lo que puedes cambiar depende de quién eres.'],
      s_ask_3: ['Esta guía', 'Abre esta guía otra vez desde la pestaña de gerencia cuando quieras.']
    }
  };
  var l, k;
  for (l in X) { if (X.hasOwnProperty(l)) { for (k in X[l]) { if (X[l].hasOwnProperty(k)) { T.TXT[l][k] = X[l][k]; } } } }
  function t(id) { var o = T.TXT[S.lang] || T.TXT.en; return o[id] || T.TXT.en[id] || id; }

  /* where she has been */
  function doneMap() { return w.JC.get('p2.setup.done', {}); }
  function mark(id) { var m = doneMap(); m[id] = 1; w.JC.set('p2.setup.done', m); }

  /* moving the real app to the right place */
  function ov(popup, flip, id) { S.tab = 'overview'; S.ui.view = 'pos'; S.ui.pick = null; S.ui.popup = popup ? { kind: popup, id: id || null, anchor: popup === 'dish' ? 'menu' : popup, key: id || null } : null; S.ui.flip = !!flip; }
  function firstDish() { var l = S.data.items || [], i; for (i = 0; i < l.length; i++) { if (l[i].active !== false && l[i].available !== false) { return l[i].id; } } return l.length ? l[0].id : null; }
  function hit(k) { return '.hit[data-ov="' + k + '"]'; }
  var BITES = [
    { id: 'pin', ic: 'lock', steps: [
      ['s_pin_1', 'do', '#tm_pin', function () { S.ui.popup = null; S.tab = 'manager'; if (J.team && J.team.openSelf) { J.team.openSelf(); } }]] },
    { id: 'hours', ic: 'clock', steps: [
      ['s_hours_1', 'look', hit('sign'), function () { ov(null, false); }],
      ['s_hours_2', 'do', '.daychips', function () { ov('sign', true); }],
      ['s_hours_3', 'do', '.timeboxes'], ['s_hours_4', 'do', '.pop .srow'], ['s_hours_5', 'do', '.pop .srow + .srow']] },
    { id: 'menu', ic: 'star', steps: [
      ['s_menu_1', 'look', hit('menu'), function () { ov(null, false); }],
      ['s_menu_2', 'do', '.pop', function () { ov('menu', true); }],
      ['s_menu_3', 'do', '.pop .stepper', function () { ov('dish', true, firstDish()); }],
      ['s_menu_4', 'do', '.pop .bigbtn.ghost'], ['s_menu_5', 'look', '.pop .dietfits']] },
    { id: 'shelf', ic: 'check', steps: [
      ['s_shelf_1', 'look', hit('fridge'), function () { ov(null, false); }],
      ['s_shelf_2', 'do', '.pop .igrid', function () { ov('fridge', true); }],
      ['s_shelf_3', 'look', '.pop', function () { ov('fridge', false); }],
      ['s_shelf_4', 'look', hit('grinder'), function () { ov(null, false); }]] },
    { id: 'pastries', ic: 'cup', steps: [
      ['s_pastries_1', 'look', hit('pastries'), function () { ov(null, false); }],
      ['s_pastries_2', 'do', '.pop .pstep', function () { ov('pastries', false); }],
      ['s_pastries_3', 'do', '.ptile.edit', function () { ov('pastries', true); }],
      ['s_pastries_4', 'do', '.ptile.addnew']] },
    { id: 'tables', ic: 'sticky', steps: [
      ['s_tables_1', 'look', hit('pot-home'), function () { ov(null, false); }],
      ['s_tables_2', 'look', '.hit.tbl', null, 1], ['s_tables_3', 'look', '.orail']] },
    { id: 'register', ic: 'cup', steps: [
      ['s_register_1', 'look', '.cat', function () { S.tab = 'pos'; S.ui.view = 'pos'; S.ui.popup = null; S.ui.flip = false; }, 1],
      ['s_register_2', 'look', '.tile'], ['s_register_3', 'look', '.tk'], ['s_register_4', 'look', '.paybtn']] },
    { id: 'team', ic: 'heart', steps: [
      ['s_team_1', 'look', '.mteam', function () { S.ui.popup = null; S.tab = 'manager'; J.mgr.view = 'day'; if (J.team) { J.team.edit = null; } }],
      ['s_team_2', 'look', '.teamlist', function () { J.mgr.view = 'team'; J.team.list = null; J.team.edit = null; }],
      ['s_team_3', 'do', '.paybtn[data-arg="new"]']] },
    { id: 'phones', ic: 'link', steps: [
      ['s_phones_1', 'look', '.mphones', function () { S.ui.popup = null; S.tab = 'manager'; }],
      ['s_phones_2', 'do', '.mphones .plink'], ['s_phones_3', 'look', '.mphones .pcode'], ['s_phones_4', 'do', '.mphones .prow3']] },
    { id: 'day', ic: 'heart', steps: [
      ['s_day_1', 'look', '.mstats', function () { S.ui.popup = null; S.tab = 'manager'; }],
      ['s_day_2', 'look', '.mloved'], ['s_day_3', 'look', '.mpayroll']] },
    { id: 'ask', ic: 'q', steps: [
      ['s_ask_1', 'look', '.qbtn', function () { ov(null, false); }],
      ['s_ask_2', 'look', '.rb[data-act="ovGear"]', function () { ov('menu', false); }],
      ['s_ask_3', 'look', '.tabs', function () { ov(null, false); S.tab = 'manager'; }]] }
  ];
  var START = ['pin', 'hours', 'menu', 'pastries', 'shelf', 'team', 'phones', 'tables', 'register', 'day', 'ask'];
  function nextUndone(after) { var m = doneMap(), i, k = after ? START.indexOf(after) : -1; for (i = k + 1; i < START.length; i++) { if (!m[START[i]]) { return START[i]; } } return null; }
  function biteById(id) { var i; for (i = 0; i < BITES.length; i++) { if (BITES[i].id === id) { return BITES[i]; } } return null; }

  function icon(b) {
    if (b.ic === 'q') { return '<span class="sq">?</span>'; }
    return U.ic(b.ic, 34, '#B55573');
  }
  function startMode() { return S.ui.setupMode === 'start'; }
  function ordered() { var out = [], i; if (!startMode()) { return BITES; } for (i = 0; i < START.length; i++) { out.push(biteById(START[i])); } return out; }
  Z.screen = function () { return S.ui.setup === 'next' ? Z.next() : Z.home(); };
  Z.next = function () {
    var nx = biteById(S.ui.nextBite), nm = S.person ? S.person.name : '';
    return '<div class="shell setupgl"><header class="sghead"><img class="wm" src="../img/josies-wordmark.png" alt="Josie’s" height="44"><span class="grow"></span>' + U.langToggle() + '</header><div class="sgbody sgmid">' +
      '<div class="sgbig">' + U.ic('check', 54, '#3C9A78') + '</div><h1>' + esc(t('startDone')) + '</h1><div class="sgcard sgnext" data-act="biteNext"><span class="sgic">' + icon(nx) + '</span><span class="sgt"><small>' + esc(t('startNext')) + '</small><b>' + esc(t('b_' + nx.id)[0]) + '</b><small>' + esc(t('b_' + nx.id)[1]) + '</small></span></div>' +
      '<button type="button" class="bigbtn" data-act="biteNext">' + esc(t('startGo')) + '</button><button type="button" class="bigbtn ghost sgnot" data-act="setupList">' + esc(t('startList')) + '</button></div></div>';
  };
  Z.home = function () {
    var m = doneMap(), n = 0, i, h, nm = S.person ? S.person.name : '', list = ordered(), first = startMode() ? nextUndone(null) : null;
    for (i = 0; i < list.length; i++) { if (m[list[i].id]) { n += 1; } }
    h = '<div class="shell setupgl"><header class="sghead"><img class="wm" src="../img/josies-wordmark.png" alt="Josie’s" height="44"><span class="grow"></span>' + U.langToggle() + '</header><div class="sgbody">' +
      (startMode() ? '<h1>' + esc(t('startHi')) + ', ' + esc(nm) + '. ' + esc(t('startTitle')) + '</h1><p class="psub">' + esc(t('startSub')) + '</p>' + (first ? '<button type="button" class="bigbtn sgstart" data-act="bite" data-arg="' + first + '">' + esc(t('startGo')) + ' · ' + esc(t('b_' + first)[0]) + '</button>' : '')
        : '<h1>' + esc(t('hi')) + ', ' + esc(nm) + '. ' + esc(t('five')) + '</h1><p class="psub">' + esc(t('fiveSub')) + '</p>') + '<div class="sggrid">';
    for (i = 0; i < list.length; i++) {
      h += '<button type="button" class="sgcard' + (m[list[i].id] ? ' done' : '') + '" data-act="bite" data-arg="' + list[i].id + '"><span class="sgic">' + icon(list[i]) + '</span><span class="sgt"><b>' + esc(t('b_' + list[i].id)[0]) + '</b><small>' + esc(t('b_' + list[i].id)[1]) + '</small></span>' +
        '<span class="sgm">' + (m[list[i].id] ? U.ic('check', 22, '#3C9A78') : esc(t('min'))) + '</span></button>';
    }
    h += '</div>' + (n === list.length ? '<p class="psub">' + esc(t(startMode() ? 'startEnd' : 'allDone')) + '</p>' : '') + '<button type="button" class="bigbtn ghost sgnot" data-act="setupClose">' + esc(t('notNow')) + '</button></div></div>';
    return h;
  };
  Z.card = function () {
    if (!J.can('josie')) { return ''; }
    return '<button type="button" class="pcard sgopen" data-act="setupOpen"><b>' + esc(t('setupCard')) + '</b><small>' + esc(t('setupCardSub')) + '</small></button>';
  };
  function begin(id) {
    var b = biteById(id), ids = [], i, s;
    if (!b) { return; }
    for (i = 0; i < b.steps.length; i++) { s = b.steps[i]; ids.push({ id: s[0], mode: s[1], sel: s[2], go: s[3] || null, all: !!s[4] }); }
    S.ui.setup = null; S.ui.tutorial = false; S.ui.helpOpen = false;
    S.ui.tour = { screen: 'setup', bite: id, ids: ids, i: 0 };
    T.enter(S.ui.tour); J.changed();
  }
  Z.leave = function (id, finished) {
    var nx = finished && startMode() ? nextUndoneAfter(id) : null; if (finished) { mark(id); } if (J.mgr) { J.mgr.view = 'day'; } if (J.team) { J.team.edit = null; } S.ui.tour = null; S.ui.popup = null; S.ui.flip = false; S.ui.setup = nx ? 'next' : 'home'; S.ui.nextBite = nx; J.changed(); };
  function nextUndoneAfter(id) { mark(id); return nextUndone(id); }

  /* open it from the link, once per sign-in */
  Z.check = function () {
    if (S.ui.setupChecked || !S.person) { return; }
    S.ui.setupChecked = true;
    if (/[?&]setup\b/.test(w.location.search || '') && J.can('josie')) { S.ui.setup = 'home'; S.ui.setupMode = /[?&]setup=start\b/.test(w.location.search || '') ? 'start' : null; }
  };
  Z.handle = function (act, arg) {
    switch (act) {
      case 'bite': begin(arg); return true;
      case 'biteNext': if (S.ui.nextBite) { begin(S.ui.nextBite); } return true;
      case 'setupList': S.ui.setup = 'home'; J.changed(); return true;
      case 'setupOpen': S.ui.setup = 'home'; J.changed(); return true;
      case 'setupClose': S.ui.setup = null; S.tab = 'pos'; J.changed(); return true;
    }
    return false;
  };
}(window, document));
