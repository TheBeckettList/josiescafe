/* Josie's World · the ? on top. Tap it, then tap the part of the screen you want explained, and a short
   walkthrough of just that part plays. "Show me everything" still plays the whole screen. EN and ES. Plain ES5. */
(function (w, d) {
  'use strict';
  var J = w.J2, S = J.S, esc = J.esc, T = J.tour;
  if (!T || !T.TXT) { return; }

  var X = {
    en: {
      pickTitle: 'Tap what you want explained', pickSub: 'Anything with a dashed line has a walkthrough.', everything: 'Show me everything', cancel: 'Close',
      // register
      z_cats1: ['The groups', 'Each group is a part of the menu: coffee, breakfast, pastries and so on. The one that is lit is the one you are looking at.'],
      z_cats2: ['The star', 'The star group is the favourites, the dishes people order most. It is the fastest way to ring up the usual.'],
      z_tiles1: ['A dish', 'One tap adds it to the ticket. Tap again for two. Each dish has its own picture so you know it at a glance.'],
      z_tiles2: ['The little circles', 'Those are what is inside the dish. A circle that is faded is what we are low on or out of.'],
      z_tiles3: ['Out of something', 'When an ingredient runs out the dish says so, and a dish that cannot be made is greyed out on its own. Nothing to switch off.'],
      z_tk1: ['The ticket', 'This is the order so far. The name box at the top is who it is for, or leave it empty.'],
      z_tk2: ['Change a line', 'Tap the circles on a line to leave something out, add it back or swap it. The kitchen sees exactly what you set.'],
      z_tk3: ['Take a line off', 'Swipe or tap the minus on a line to remove one. The total follows at once.'],
      z_diets1: ['Diet buttons', 'Vegan, Gluten free and Kosher-style. Tap one and every dish shows what would change.'],
      z_diets2: ['What it can still be', 'A dish that cannot follow the diet is greyed out. The ones that can show the change, such as no cheese or tempeh for bacon.'],
      z_seg1: ['For here or to go', 'Pick one before you pay. For here gives the guest a stick. To go gets a box.'],
      z_seg2: ['The box charge', 'To go adds the box charge for each item, and the total shows it before the guest pays.'],
      z_pay1: ['Pay now', 'Take the payment while the guest is at the counter. It opens the payment screen.'],
      z_pay2: ['Then the stick', 'For here, you pick a stick next. The kitchen and bar get the order the moment you do.'],
      z_later1: ['Pay later', 'Send it to the bar and kitchen now and take the payment when they are done. Good for tables that keep ordering.'],
      z_later2: ['Add to an order', 'If the guest already has an order, add to it instead of starting a new one. Guests can only add before they pay.'],
      z_tabs1: ['Register and map', 'Register is where you ring up. Overview is the live café.'],
      z_tabs2: ['Who can see what', 'Staff on the bar or kitchen only see the map. The manager tab only shows for the people who run the café.'],
      z_lang1: ['English or Spanish', 'Every word on every screen changes. It only changes for you, not for anyone else.'],
      // stick / pay
      z_stick1: ['Free sticks', 'Tap a free stick for this order. The number is what the guest keeps and what the kitchen calls out.'],
      z_stick2: ['Taken sticks', 'A stick that is already on a table or waiting cannot be picked. It comes back when the guest is done.'],
      z_stick3: ['The ticket on the left', 'This is exactly what the kitchen and bar will read. Check it once here.'],
      z_pay_m1: ['Cash or card', 'Pick how they pay. Cash can be lempiras or dollars, each with its own buttons.'],
      z_pay_m2: ['Cash given', 'Tap what they hand you, or Exact. The change is worked out for you and shown big.'],
      z_pay_m3: ['Complete', 'Finishes the sale. Nothing is sent twice, even if the connection drops.'],
      // overview: the map things
      z_bar1: ['The bar', 'Tap it to read the bar tickets, one at a time. Drinks, smoothies and pastries.'],
      z_bar2: ['Nothing to press', 'The bar only reads. The cashier is the runner, so there is no Ready button and nothing to tap.'],
      z_kitchen1: ['The kitchen', 'Tap it to read the kitchen tickets, one at a time. Food only.'],
      z_kitchen2: ['Changes and stops', 'If a guest changes their mind, a STOP or CHANGED card shows up on top. Read it, that is all.'],
      z_fridge1: ['The fridge', 'The lights for milk, juice, eggs and the rest. Tap an item to set Plenty, Low or Out.'],
      z_fridge2: ['Why it matters', 'When something is Out, the dishes that need it grey out on the register and on the website by themselves.'],
      z_grinder1: ['The coffee beans', 'The beans are checked at the grinder. Tap it and set Plenty, Low or Out.'],
      z_grinder2: ['The check', 'This one is required at the start of a shift. The fridge is only when you have a minute.'],
      z_menu1: ['The menu board', 'Tap it to look at the whole menu with what is on and off right now.'],
      z_menu2: ['Change it', 'The pencil on the popup lets the right people edit dishes, prices and ingredients.'],
      z_pastries1: ['The pastry stand', 'Everything in the dome, with how many are left. Tap one to change the count.'],
      z_pastries2: ['The bar hands them out', 'Pastries are made by the bar, so the bar tickets show them.'],
      z_register1: ['The register', 'Tap it to jump back to ringing up an order.'],
      z_sign1: ['The sign', 'Open or closed, and the hours. Online orders stop at 2 pm on their own.'],
      z_sign2: ['Change it', 'The pencil lets a manager close early or change the hours. The website follows.'],
      z_pot1: ['The pots', 'The home pot holds sticks that are free. The waiting pot holds sticks whose food is on its way to a table.'],
      z_pot2: ['Placing a stick', 'Tap a stick in the waiting pot, then tap the table. It leaves the pot and the table lights up.'],
      z_table1: ['A table', 'Tap a table to see who is sitting there and what they ordered.'],
      z_table2: ['Put a stick here', 'When a stick is waiting, the tables light up. Tap the one the guest sat at.'],
      z_table3: ['Take payment, stick back', 'The table popup has the next job: Take payment, or Stick back when they leave.'],
      z_crit1: ['Say hi', 'The animals are real ones from Utila. They do not do anything, they just live here.'],
      // rail
      z_rail1: ['Right now', 'Every number in the café. Who still has to pay, who is being made, who is waiting.'],
      z_rail2: ['For here and to go', 'The two lists, so you can see which stick is where.'],
      z_rail3: ['It updates itself', 'Nothing to refresh. When something changes on another device, it shows up here.'],
      z_row1: ['A number', 'Tap the row to open it: what they ordered, the table, the payment.'],
      z_cta1: ['The next job', 'The button on the right is always the next thing: Place, Take payment or Stick back. One tap per job.'],
      z_undo1: ['Just done', 'Finished numbers stay here a while. Tap Undo if you closed one by mistake.'],
      z_low1: ['Running low', 'A short list of the items that are Low or Out, so you can see what needs a call to the supplier.'],
      z_viewas1: ['View as', 'Josie can look at the screen the way a cashier, the bar or the kitchen sees it. Nothing changes, it is only a look.'],
      z_quiet1: ['Quiet-time check', 'When it is quiet, the bar and kitchen get one small question about what is low. Answer, or tap Later. No one is chased.'],
      // popups
      z_pop1: ['This popup', 'Everything here is about the thing you tapped. Tap outside it, or the cross, to close.'],
      z_pop2: ['The pencil', 'The pencil flips the popup to its setup. What you see there depends on who you are.'],
      z_pop3: ['Tickets', 'Cards are in the order they came in. Scroll for more, there is nothing to press.'],
      z_pop4: ['Lights', 'Plenty, Low or Out. Set what you see on the shelf. The menu follows at once.'],
      // manager
      z_mstats1: ['Today so far', 'Sales, orders, and the average wait for each station. Averages are by station, never by person.'],
      z_mstats2: ['Busiest 15 minutes', 'The busiest stretch of the day, so you know when to have another pair of hands.'],
      z_mloved1: ['Most loved', 'What sold the most today, with the numbers.'],
      z_mloved2: ['Running low', 'What ran low or out today, and when it was set.'],
      z_mphones1: ['Kitchen and bar phones', 'Send the link to a phone and give it the code. It then gets every ticket, with an alert.'],
      z_mphones2: ['New code', 'Making a new code stops every phone until the new code is typed in. Use it if a phone is lost.'],
      z_mpay1: ['Payroll', 'Only Josie sees this. Hours times rate, per person.'],
      z_mpay2: ['Paid', 'Mark it paid by cash or transfer. Undo is there for a mistake.'],
      z_dot1: ['The dots', 'Green is fine. Orange means take a look. Red needs you now. Grey is quiet. A number is a count, like orders being made.'],
      z_ptile1: ['Pastry squares', 'Each square is a pastry. The dot is green when there are plenty, orange when low, red when none. Tap minus and plus to match what is in the dome.'],
      z_ptile2: ['Set up a pastry', 'Josie taps the pencil, then a square, to set its picture, price and how many, and to switch it on or off.'],
      z_padd: ['Add a pastry', 'Tap Add a pastry, name it and pick a picture. It shows on the register as soon as it has a price.'],
      z_team1: ['Your people', 'Everyone who can sign in. Tap one to change their station, wage or PIN.'],
      z_mday1: ['The day', 'Move between days to see any day you want.']
    },
    es: {
      pickTitle: 'Toca lo que quieras entender', pickSub: 'Todo lo que tiene línea punteada tiene su explicación.', everything: 'Muéstrame todo', cancel: 'Cerrar',
      z_cats1: ['Los grupos', 'Cada grupo es una parte del menú: café, desayuno, pasteles y más. El que está marcado es el que estás viendo.'],
      z_cats2: ['La estrella', 'El grupo de la estrella son los favoritos, lo que más piden. Es la forma más rápida de cobrar lo de siempre.'],
      z_tiles1: ['Un plato', 'Un toque lo agrega al ticket. Otro toque, dos. Cada plato tiene su dibujo para reconocerlo de un vistazo.'],
      z_tiles2: ['Los circulitos', 'Eso es lo que lleva el plato. Un circulito apagado es algo que se está acabando o se acabó.'],
      z_tiles3: ['Algo agotado', 'Cuando se acaba un ingrediente el plato lo dice, y un plato que no se puede hacer sale gris solo. No hay que apagar nada.'],
      z_tk1: ['El ticket', 'Este es el pedido hasta ahora. La casilla del nombre es para quién es, o déjala vacía.'],
      z_tk2: ['Cambiar una línea', 'Toca los circulitos de una línea para quitar algo, ponerlo otra vez o cambiarlo. La cocina ve exactamente lo que dejaste.'],
      z_tk3: ['Quitar una línea', 'Toca el menos de una línea para quitar uno. El total cambia al instante.'],
      z_diets1: ['Botones de dieta', 'Vegano, Sin gluten y Kosher-style. Toca uno y cada plato muestra qué cambiaría.'],
      z_diets2: ['Qué puede seguir siendo', 'Un plato que no cumple la dieta sale gris. Los que sí, muestran el cambio, como sin queso o tempeh en vez de tocino.'],
      z_seg1: ['Aquí o para llevar', 'Elige uno antes de cobrar. Aquí le da un palito al cliente. Para llevar lleva caja.'],
      z_seg2: ['El cargo de caja', 'Para llevar suma el cargo de caja por artículo, y el total lo muestra antes de que paguen.'],
      z_pay1: ['Pagar ahora', 'Cobra mientras el cliente está en el mostrador. Abre la pantalla de pago.'],
      z_pay2: ['Luego el palito', 'Si es para aquí, sigues con el palito. La cocina y el bar reciben el pedido en cuanto lo eliges.'],
      z_later1: ['Pagar después', 'Mándalo al bar y a la cocina ahora y cobra cuando terminen. Sirve para mesas que siguen pidiendo.'],
      z_later2: ['Agregar a un pedido', 'Si el cliente ya tiene un pedido, agrégale en vez de abrir otro. Los clientes solo pueden agregar antes de pagar.'],
      z_tabs1: ['Caja y mapa', 'Caja es donde cobras. Mapa es el café en vivo.'],
      z_tabs2: ['Quién ve qué', 'El personal del bar o la cocina solo ve el mapa. La pestaña de gerencia solo aparece para quienes llevan el café.'],
      z_lang1: ['Inglés o español', 'Cambia cada palabra de cada pantalla. Solo cambia para ti, no para los demás.'],
      z_stick1: ['Palitos libres', 'Toca un palito libre para este pedido. El número es el que se queda el cliente y el que canta la cocina.'],
      z_stick2: ['Palitos ocupados', 'Un palito que ya está en una mesa o en espera no se puede elegir. Regresa cuando el cliente termina.'],
      z_stick3: ['El ticket de la izquierda', 'Esto es exactamente lo que leerán la cocina y el bar. Revísalo una vez aquí.'],
      z_pay_m1: ['Efectivo o tarjeta', 'Elige cómo pagan. El efectivo puede ser lempiras o dólares, cada uno con sus botones.'],
      z_pay_m2: ['Efectivo recibido', 'Toca lo que te dan, o Exacto. El cambio se calcula y se muestra grande.'],
      z_pay_m3: ['Completar', 'Termina la venta. Nada se manda dos veces, aunque se caiga la conexión.'],
      z_bar1: ['El bar', 'Tócalo para leer los tickets del bar, uno por uno. Bebidas, batidos y pasteles.'],
      z_bar2: ['Nada que presionar', 'El bar solo lee. La caja es quien lleva los pedidos, así que no hay botón de Listo ni nada que tocar.'],
      z_kitchen1: ['La cocina', 'Tócala para leer los tickets de cocina, uno por uno. Solo comida.'],
      z_kitchen2: ['Cambios y paradas', 'Si un cliente cambia de idea, aparece una tarjeta de PARAR o CAMBIO arriba. Léela, eso es todo.'],
      z_fridge1: ['El refri', 'Las luces de leche, jugo, huevos y lo demás. Toca un artículo y ponlo en Bastante, Poco o Agotado.'],
      z_fridge2: ['Por qué importa', 'Cuando algo se agota, los platos que lo necesitan se ponen grises solos en la caja y en el sitio web.'],
      z_grinder1: ['Los granos de café', 'Los granos se revisan en el molino. Tócalo y ponlos en Bastante, Poco o Agotado.'],
      z_grinder2: ['La revisión', 'Esta es obligatoria al empezar el turno. El refri es solo cuando tengas un minuto.'],
      z_menu1: ['El menú', 'Tócalo para ver todo el menú, con lo que está activo o apagado ahora.'],
      z_menu2: ['Cambiarlo', 'El lápiz de la ventana deja que las personas indicadas editen platos, precios e ingredientes.'],
      z_pastries1: ['El puesto de pasteles', 'Todo lo que hay en la cúpula y cuántos quedan. Toca uno para cambiar la cuenta.'],
      z_pastries2: ['El bar los entrega', 'Los pasteles los atiende el bar, así que aparecen en los tickets del bar.'],
      z_register1: ['La caja', 'Tócala para volver a cobrar un pedido.'],
      z_sign1: ['El letrero', 'Abierto o cerrado, y el horario. Los pedidos en línea paran a las 2 pm solos.'],
      z_sign2: ['Cambiarlo', 'El lápiz deja que gerencia cierre temprano o cambie el horario. El sitio web lo sigue.'],
      z_pot1: ['Las ollas', 'La olla de casa guarda los palitos libres. La olla de espera guarda los palitos cuyo pedido va camino a una mesa.'],
      z_pot2: ['Poner un palito', 'Toca un palito de la olla de espera y luego la mesa. Sale de la olla y la mesa se ilumina.'],
      z_table1: ['Una mesa', 'Toca una mesa para ver quién está sentado y qué pidió.'],
      z_table2: ['Poner un palito aquí', 'Cuando hay un palito esperando, las mesas se iluminan. Toca la donde se sentó el cliente.'],
      z_table3: ['Cobrar, devolver palito', 'La ventana de la mesa tiene lo siguiente: Cobrar, o Devolver palito cuando se van.'],
      z_crit1: ['Saluda', 'Los animalitos son de verdad de Utila. No hacen nada, solo viven aquí.'],
      z_rail1: ['Ahora mismo', 'Cada número del café. Quién falta por pagar, quién se prepara, quién espera.'],
      z_rail2: ['Aquí y para llevar', 'Las dos listas, para ver qué palito está dónde.'],
      z_rail3: ['Se actualiza solo', 'No hay que refrescar. Cuando algo cambia en otro aparato, aparece aquí.'],
      z_row1: ['Un número', 'Toca la fila para abrirla: lo que pidieron, la mesa, el pago.'],
      z_cta1: ['La siguiente tarea', 'El botón de la derecha siempre es lo que sigue: Poner, Cobrar o Devolver palito. Un toque por tarea.'],
      z_undo1: ['Recién terminados', 'Los números terminados se quedan un rato. Toca Deshacer si cerraste uno por error.'],
      z_low1: ['Se está acabando', 'Una lista corta de lo que está Poco o Agotado, para saber a quién llamar.'],
      z_viewas1: ['Ver como', 'Josie puede ver la pantalla como la ve la caja, el bar o la cocina. Nada cambia, es solo para mirar.'],
      z_quiet1: ['Revisión en la calma', 'Cuando hay calma, el bar y la cocina reciben una pregunta chica sobre lo que se acaba. Contestan, o tocan Después. Nadie es perseguido.'],
      z_pop1: ['Esta ventana', 'Todo aquí es sobre lo que tocaste. Toca afuera, o la cruz, para cerrar.'],
      z_pop2: ['El lápiz', 'El lápiz pasa la ventana a su configuración. Lo que ves ahí depende de quién eres.'],
      z_pop3: ['Tickets', 'Las tarjetas van en el orden en que llegaron. Desliza para ver más, no hay nada que presionar.'],
      z_pop4: ['Luces', 'Bastante, Poco o Agotado. Pon lo que ves en el estante. El menú lo sigue al instante.'],
      z_mstats1: ['Hoy hasta ahora', 'Ventas, pedidos y la espera promedio de cada estación. Los promedios son por estación, nunca por persona.'],
      z_mstats2: ['Los 15 minutos más ocupados', 'El tramo más ocupado del día, para saber cuándo hacen falta más manos.'],
      z_mloved1: ['Lo más pedido', 'Lo que más se vendió hoy, con los números.'],
      z_mloved2: ['Lo que se acaba', 'Lo que quedó poco o se acabó hoy, y cuándo se marcó.'],
      z_mphones1: ['Teléfonos de cocina y bar', 'Manda el enlace a un teléfono y dale el código. Después recibe cada ticket, con aviso.'],
      z_mphones2: ['Código nuevo', 'Un código nuevo detiene todos los teléfonos hasta que lo escriban. Úsalo si se pierde un teléfono.'],
      z_mpay1: ['Planilla', 'Solo Josie ve esto. Horas por tarifa, por persona.'],
      z_mpay2: ['Pagado', 'Márcalo pagado en efectivo o transferencia. Deshacer está para un error.'],
      z_dot1: ['Los puntos', 'Verde está bien. Naranja es para echar un vistazo. Rojo te necesita ya. Gris es tranquilo. Un número es una cuenta, como pedidos en preparación.'],
      z_ptile1: ['Cuadros de pasteles', 'Cada cuadro es un pastel. El punto es verde si hay bastante, naranja si hay poco, rojo si no hay. Toca menos y más para igualar lo que hay en la cúpula.'],
      z_ptile2: ['Configurar un pastel', 'Josie toca el lápiz y luego un cuadro para poner su dibujo, precio y cuántos hay, y encenderlo o apagarlo.'],
      z_padd: ['Agregar un pastel', 'Toca Agregar pastel, ponle nombre y elige un dibujo. Sale en la caja en cuanto tiene precio.'],
      z_team1: ['Tu gente', 'Todos los que pueden entrar. Toca uno para cambiar su estación, salario o PIN.'],
      z_mday1: ['El día', 'Muévete entre días para ver el que quieras.']
    }
  };
  var k, l;
  for (l in X) { if (X.hasOwnProperty(l)) { for (k in X[l]) { if (X[l].hasOwnProperty(k)) { T.TXT[l][k] = X[l][k]; } } } }
  function tx(id) { var t = T.TXT[S.lang] || T.TXT.en; return t[id] || T.TXT.en[id] || id; }

  /* zones: the first one whose selector matches the tapped thing wins, so the narrow ones come first.
     steps: [textId, selector, union?] and only steps whose thing is on screen are played. */
  function ov(key) { return '.hit[data-ov="' + key + '"]'; }
  function popKind() { var p = S.ui.popup; return p ? p.kind : null; }
  function popSteps() {
    var k = popKind(), s = [];
    if (k === 'kitchen' || k === 'bar') { s.push(['z_pop3', '.pop']); }
    if (k === 'inv' || k === 'fridge' || k === 'grinder') { s.push(['z_pop4', '.pop']); }
    s.push(['z_pop1', '.pop']);
    s.push(['z_pop2', '.pop']);
    return s;
  }
  var ZONES = {
    pos: [
      { sel: '.paybtn', steps: [['z_pay1', '.paybtn'], ['z_pay2', '.paybtn']] },
      { sel: '.later', steps: [['z_later1', '.later'], ['z_later2', '.later']] },
      { sel: '.seg2', steps: [['z_seg1', '.seg2'], ['z_seg2', '.seg2']] },
      { sel: '.tk', steps: [['z_tk1', '.tk'], ['z_tk2', '.tk'], ['z_tk3', '.tk']] },
      { sel: '.cat', all: 1, steps: [['z_cats1', '.cat', 1], ['z_cats2', '.cat', 1]] },
      { sel: '.dchip', all: 1, steps: [['z_diets1', '.dchip', 1], ['z_diets2', '.dchip', 1]] },
      { sel: '.tile', all: 1, steps: [['z_tiles1', '.tile'], ['z_tiles2', '.tile'], ['z_tiles3', '.tile']] },
      { sel: '.tabs', steps: [['z_tabs1', '.tabs'], ['z_tabs2', '.tabs']] },
      { sel: '.lang', steps: [['z_lang1', '.lang']] }
    ],
    stick: [
      { sel: '.stk-card, .stk-left', steps: [['z_stick3', '.stk-card']] },
      { sel: '.stk-right', steps: [['z_stick1', '.stk-right'], ['z_stick2', '.stk-right'], ['z_stick3', '.stk-card']] },
      { sel: '.lang', steps: [['z_lang1', '.lang']] }
    ],
    pay: [
      { sel: '.paybtn', steps: [['z_pay_m3', '.paybtn.wide']] },
      { sel: '.methods, .pcard, .r, .payp', steps: [['z_pay_m1', '.methods'], ['z_pay_m2', '.methods'], ['z_pay_m3', '.paybtn.wide']] },
      { sel: '.lang', steps: [['z_lang1', '.lang']] }
    ],
    overview: [
      { sel: '.ptile.addnew', steps: [['z_padd', '.ptile.addnew'], ['z_pop2', '.pop']] },
      { sel: '.ptile', all: 1, steps: [['z_ptile1', '.ptile'], ['z_ptile2', '.ptile']] },
      { sel: '.pop', steps: popSteps },
      { sel: '.sbadge', steps: [['z_dot1', '.sbadge']] },
      { sel: '.hit[data-ov="bar"]', steps: [['z_bar1', ov('bar')], ['z_bar2', ov('bar')]] },
      { sel: '.hit[data-ov="kitchen"]', steps: [['z_kitchen1', ov('kitchen')], ['z_kitchen2', ov('kitchen')]] },
      { sel: '.hit[data-ov="fridge"]', steps: [['z_fridge1', ov('fridge')], ['z_fridge2', ov('fridge')]] },
      { sel: '.hit[data-ov="grinder"]', steps: [['z_grinder1', ov('grinder')], ['z_grinder2', ov('grinder')]] },
      { sel: '.hit[data-ov="menu"]', steps: [['z_menu1', ov('menu')], ['z_menu2', ov('menu')]] },
      { sel: '.hit[data-ov="pastries"]', steps: [['z_pastries1', ov('pastries')], ['z_pastries2', ov('bar')]] },
      { sel: '.hit[data-ov="register"]', steps: [['z_register1', ov('register')]] },
      { sel: '.hit[data-ov="sign"]', steps: [['z_sign1', ov('sign')], ['z_sign2', ov('sign')]] },
      { sel: '.hit[data-ov="pot-home"], .hit[data-ov="pot-wait"]', steps: [['z_pot1', ov('pot-home')], ['z_pot2', ov('pot-wait')]] },
      { sel: '.hit.tbl', steps: [['z_table1', '.hit.tbl', 1], ['z_table2', '.hit.tbl', 1], ['z_table3', '.hit.tbl', 1]] },
      { sel: '.hit.crit', steps: [['z_crit1', null]] },
      { sel: '.ncta', steps: [['z_cta1', '.ncta']] },
      { sel: '.undo, .nrow .undo', steps: [['z_undo1', '.undo']] },
      { sel: '.rcard.quiet', steps: [['z_quiet1', '.rcard.quiet']] },
      { sel: '.nrow', steps: [['z_row1', '.nrow'], ['z_cta1', '.ncta']] },
      { sel: '.orail', steps: [['z_rail1', '.orail'], ['z_rail2', '.orail'], ['z_rail3', '.orail']] },
      { sel: '.mapbox', steps: [['z_crit1', null]] },
      { sel: '.lang', steps: [['z_lang1', '.lang']] }
    ],
    manager: [
      { sel: '.teamlist', steps: [['z_team1', '.teamlist']] },
      { sel: '.mstats', steps: [['z_mstats1', '.mstats'], ['z_mstats2', '.mstats']] },
      { sel: '.mloved', steps: [['z_mloved1', '.mloved'], ['z_mloved2', '.mloved']] },
      { sel: '.mphones', steps: [['z_mphones1', '.mphones'], ['z_mphones2', '.mphones']] },
      { sel: '.mpayroll', steps: [['z_mpay1', '.mpayroll'], ['z_mpay2', '.mpayroll']] },
      { sel: '.lang', steps: [['z_lang1', '.lang']] }
    ]
  };
  var QUICK = {   // pick mode: also light up these even when they are not the zone's own selector
    overview: ['.hit[data-ov]', '.orail', '.nrow', '.pop']
  };

  function zonesNow() {
    var root = d.getElementById('app'), list = ZONES[T.screen()] || [], out = [], i;
    for (i = 0; i < list.length; i++) { if (root.querySelector(list[i].sel)) { out.push(list[i]); } }
    return out;
  }
  function play(z) {
    var root = d.getElementById('app'), st = typeof z.steps === 'function' ? z.steps() : z.steps, ids = [], i;
    for (i = 0; i < st.length; i++) { if (!st[i][1] || root.querySelector(st[i][1])) { ids.push({ id: st[i][0], sel: st[i][1], all: !!st[i][2] }); } }
    if (!ids.length) { return; }
    S.ui.tutorial = false; S.ui.helpOpen = false;
    S.ui.tour = { screen: T.screen(), ids: ids, i: 0 };
    J.changed();
  }
  function hit(x, y, host) {
    var el, zs, i;
    host.style.display = 'none';
    el = d.elementFromPoint(x, y);
    host.style.display = '';
    if (!el || !el.closest) { return null; }
    zs = zonesNow();
    for (i = 0; i < zs.length; i++) { if (el.closest(zs[i].sel)) { return zs[i]; } }
    return null;
  }

  /* pick mode */
  T.pick = function (host) {
    var root = d.getElementById('app'), zs = zonesNow(), h = '', i, j, els, r, x0, y0, x1, y1, n;
    h += '<div class="pickcap"></div>';
    for (i = 0; i < zs.length; i++) {
      els = root.querySelectorAll(zs[i].sel); x0 = 1e9; y0 = 1e9; x1 = -1e9; y1 = -1e9; n = 0;
      for (j = 0; j < els.length; j++) {
        r = els[j].getBoundingClientRect(); if (r.width < 6 || r.height < 6) { continue; }
        if (zs[i].all || els.length > 14) { x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); n++; }
        else { h += '<i class="pickbox" style="left:' + (r.left - 4) + 'px;top:' + (r.top - 4) + 'px;width:' + (r.width + 8) + 'px;height:' + (r.height + 8) + 'px"></i>'; }
      }
      if (n) { h += '<i class="pickbox" style="left:' + (x0 - 4) + 'px;top:' + (y0 - 4) + 'px;width:' + (x1 - x0 + 8) + 'px;height:' + (y1 - y0 + 8) + 'px"></i>'; }
    }
    h += '<div class="pickbar"><b>' + esc(tx('pickTitle')) + '</b><small>' + esc(tx('pickSub')) + '</small>' +
      '<span><button type="button" class="btn soft" data-act="tourClose">' + esc(tx('cancel')) + '</button> <button type="button" class="btn primary" data-act="tourGo" data-arg="0">' + esc(tx('everything')) + '</button></span></div>';
    host.innerHTML = h;
    host.querySelector('.pickcap').addEventListener('click', function (e) {
      var z = hit(e.clientX, e.clientY, host);
      if (z) { play(z); } else { T.close(); }
    });
  };
  void QUICK;
}(window, document));
