/* josiescafe.com — home, menu and order ahead. Plain ES5 (old phones and iPads welcome).
   Reads the same menu, hours and open/closed switch the POS edits; online orders go to
   rpc/place_online_order and show up on the POS as open tickets, paid at the counter. */
(function (w, d, JC) {
  'use strict';

  /* ───────────── words (10 languages; English is the source) ───────────── */
  var T = {
    en: {
      tagline: 'Coffee · Breakfast · Lunch', home: 'Home', menu: 'Menu', order: 'Order', lang: 'Language',
      little: 'A little bit', ofhome: 'of home.',
      lead: 'Coffee, breakfast and lunch on Utila. We open early, so you can eat before your dive and still make the boat.',
      orderAhead: 'Order ahead', seeMenu: 'See the menu',
      b1h: 'Before your dive', b1p: 'Order tonight, pick it up on your way to the dock.',
      b2h: 'Stay a while', b2p: 'Benches, plants and Wi-Fi. Bring a book. Nobody’s rushing you.',
      b3h: 'Lunch, too', b3p: 'Sandwiches, salads and smoothies until we close.',
      hours: 'Hours', hoursH: 'Mornings, mostly', hnTime: 'Honduras time.', find: 'Find us', findH: 'In Utila Town',
      pay: 'We take lempiras, US dollars and cards.', map: 'Open in Maps', closedDay: 'Closed',
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      openUntil: 'Open now · until {t}', opensToday: 'Opens at {t} today', backAt: 'Closed now · back {d} at {t}', closedNow: 'Closed for now',
      today: 'today', tomorrow: 'tomorrow',
      menuH: 'What’s cooking', menuHand: 'made this morning.', prices: 'Prices in lempiras (L). We take US dollars and cards too.',
      soldout: 'Out today', add: '+ Add', viewOrder: 'View order', loading: 'Loading the menu…', error: 'The menu couldn’t load. Please try again in a moment.',
      orderH: 'Pick it up hot', yourOrder: 'Your order', empty: 'Nothing yet. Pick a few things from the menu.', addMore: 'Add from the menu',
      subtotal: 'Food & drinks', togoCharges: 'To-go cups & boxes', isv: 'ISV', total: 'Total',
      details: 'Your details', name: 'Name', phone: 'WhatsApp number', phoneHelp: 'Only if something’s wrong with your order.',
      pickup: 'Pick up', asap: 'As soon as it’s ready (about 15 min)', forDay: 'We’re closed right now, so this is for {d}.',
      eating: 'Eating', here: 'Here', togo: 'To go', note: 'Anything else?', payCounter: 'Pay at the counter when you pick up: lempiras, dollars or card.',
      place: 'Place order', sending: 'Sending…',
      eItems: 'Add something from the menu first.', eName: 'We need a name to call out.', ePhone: 'Add a WhatsApp number in case something’s off.',
      eTime: 'Pick a time.', paused: 'Online orders are paused for a bit. Come by the counter, we’re still cooking.',
      noTimes: 'No pick-up times right now. Check back when we’re open.', eFail: 'That didn’t go through. Try again in a moment.',
      eGone: 'Something in your order just sold out. Have a look and try again.', eMany: 'You already have orders waiting. Come say hi at the counter.',
      eClosedThen: 'We’re closed at that time. Pick another.',
      gotIt: 'Got it. See you soon.', readyMsg: 'It’s ready. Come grab it.', paidMsg: 'Enjoy. See you tomorrow.', voidMsg: 'We couldn’t do this one. Come say hi at the counter.',
      orderNo: 'Order {n}', pickupWhen: 'Pick up {w}.', sent: 'Sent', ready: 'Ready', another: 'Start another order'
    },
    es: {
      tagline: 'Café · Desayuno · Almuerzo', home: 'Inicio', menu: 'Menú', order: 'Pedir', lang: 'Idioma',
      little: 'Un poquito', ofhome: 'de hogar.',
      lead: 'Café, desayuno y almuerzo en Utila. Abrimos temprano, para que comas antes de bucear y llegues al bote.',
      orderAhead: 'Pide antes', seeMenu: 'Ver el menú',
      b1h: 'Antes de bucear', b1p: 'Pide esta noche y recógelo camino al muelle.',
      b2h: 'Quédate un rato', b2p: 'Bancas, plantas y Wi-Fi. Trae un libro. Nadie te apura.',
      b3h: 'Almuerzo también', b3p: 'Sándwiches, ensaladas y batidos hasta que cerramos.',
      hours: 'Horario', hoursH: 'Sobre todo mañanas', hnTime: 'Hora de Honduras.', find: 'Dónde estamos', findH: 'En el pueblo de Utila',
      pay: 'Aceptamos lempiras, dólares y tarjetas.', map: 'Abrir en Mapas', closedDay: 'Cerrado',
      days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      openUntil: 'Abierto · hasta las {t}', opensToday: 'Abre hoy a las {t}', backAt: 'Cerrado · volvemos {d} a las {t}', closedNow: 'Cerrado por ahora',
      today: 'hoy', tomorrow: 'mañana',
      menuH: 'Qué hay de comer', menuHand: 'hecho esta mañana.', prices: 'Precios en lempiras (L). También aceptamos dólares y tarjetas.',
      soldout: 'Se acabó', add: '+ Añadir', viewOrder: 'Ver pedido', loading: 'Cargando el menú…', error: 'No se pudo cargar el menú. Intenta de nuevo en un momento.',
      orderH: 'Recógelo calientito', yourOrder: 'Tu pedido', empty: 'Nada todavía. Escoge algo del menú.', addMore: 'Añadir del menú',
      subtotal: 'Comida y bebida', togoCharges: 'Vasos y cajas para llevar', isv: 'ISV', total: 'Total',
      details: 'Tus datos', name: 'Nombre', phone: 'Número de WhatsApp', phoneHelp: 'Solo por si hay un problema con tu pedido.',
      pickup: 'Recoger', asap: 'Apenas esté listo (unos 15 min)', forDay: 'Ahora estamos cerrados, así que es para {d}.',
      eating: 'Para', here: 'Aquí', togo: 'Llevar', note: '¿Algo más?', payCounter: 'Pagas en el mostrador al recoger: lempiras, dólares o tarjeta.',
      place: 'Hacer pedido', sending: 'Enviando…',
      eItems: 'Primero añade algo del menú.', eName: 'Necesitamos un nombre para llamarte.', ePhone: 'Añade un número de WhatsApp por si acaso.',
      eTime: 'Escoge una hora.', paused: 'Los pedidos en línea están pausados un ratito. Ven al mostrador, seguimos cocinando.',
      noTimes: 'No hay horas para recoger ahora. Vuelve cuando estemos abiertos.', eFail: 'No se pudo enviar. Intenta de nuevo en un momento.',
      eGone: 'Algo de tu pedido se acaba de terminar. Revísalo e intenta de nuevo.', eMany: 'Ya tienes pedidos esperando. Pasa por el mostrador.',
      eClosedThen: 'A esa hora estamos cerrados. Escoge otra.',
      gotIt: 'Listo. Nos vemos pronto.', readyMsg: 'Ya está listo. Ven por él.', paidMsg: 'Disfruta. Nos vemos mañana.', voidMsg: 'No pudimos hacer este. Pasa por el mostrador.',
      orderNo: 'Pedido {n}', pickupWhen: 'Recoger {w}.', sent: 'Enviado', ready: 'Listo', another: 'Hacer otro pedido'
    },
    fr: {
      tagline: 'Café · Petit-déjeuner · Déjeuner', home: 'Accueil', menu: 'Menu', order: 'Commander', lang: 'Langue',
      little: 'Un petit peu', ofhome: 'de chez soi.',
      lead: 'Café, petit-déjeuner et déjeuner à Utila. On ouvre tôt : mangez avant la plongée et attrapez quand même le bateau.',
      orderAhead: 'Commander à l’avance', seeMenu: 'Voir le menu',
      b1h: 'Avant la plongée', b1p: 'Commandez ce soir, récupérez en allant au quai.',
      b2h: 'Restez un moment', b2p: 'Bancs, plantes et Wi-Fi. Apportez un livre. Personne ne vous presse.',
      b3h: 'Le déjeuner aussi', b3p: 'Sandwichs, salades et smoothies jusqu’à la fermeture.',
      hours: 'Horaires', hoursH: 'Surtout le matin', hnTime: 'Heure du Honduras.', find: 'Nous trouver', findH: 'Au village d’Utila',
      pay: 'Lempiras, dollars US et cartes acceptés.', map: 'Ouvrir dans Plans', closedDay: 'Fermé',
      days: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      openUntil: 'Ouvert · jusqu’à {t}', opensToday: 'Ouvre aujourd’hui à {t}', backAt: 'Fermé · retour {d} à {t}', closedNow: 'Fermé pour le moment',
      today: 'aujourd’hui', tomorrow: 'demain',
      menuH: 'Au menu', menuHand: 'fait ce matin.', prices: 'Prix en lempiras (L). Dollars US et cartes acceptés.',
      soldout: 'Épuisé', add: '+ Ajouter', viewOrder: 'Voir la commande', loading: 'Chargement du menu…', error: 'Le menu n’a pas pu se charger. Réessayez dans un instant.',
      orderH: 'À emporter tout chaud', yourOrder: 'Votre commande', empty: 'Rien pour l’instant. Choisissez dans le menu.', addMore: 'Ajouter depuis le menu',
      subtotal: 'Plats et boissons', togoCharges: 'Gobelets et boîtes à emporter', isv: 'ISV', total: 'Total',
      details: 'Vos coordonnées', name: 'Prénom', phone: 'Numéro WhatsApp', phoneHelp: 'Seulement en cas de souci avec la commande.',
      pickup: 'Retrait', asap: 'Dès que c’est prêt (environ 15 min)', forDay: 'Nous sommes fermés, c’est donc pour {d}.',
      eating: 'Sur place ?', here: 'Sur place', togo: 'À emporter', note: 'Autre chose ?', payCounter: 'Vous payez au comptoir au retrait : lempiras, dollars ou carte.',
      place: 'Commander', sending: 'Envoi…',
      eItems: 'Ajoutez d’abord quelque chose du menu.', eName: 'Il nous faut un prénom à appeler.', ePhone: 'Ajoutez un numéro WhatsApp au cas où.',
      eTime: 'Choisissez une heure.', paused: 'Les commandes en ligne sont en pause. Passez au comptoir, on cuisine toujours.',
      noTimes: 'Aucun créneau pour le moment. Revenez quand nous sommes ouverts.', eFail: 'Ça n’est pas passé. Réessayez dans un instant.',
      eGone: 'Un article vient d’être épuisé. Vérifiez et réessayez.', eMany: 'Vous avez déjà des commandes en attente. Passez au comptoir.',
      eClosedThen: 'Nous sommes fermés à cette heure-là. Choisissez-en une autre.',
      gotIt: 'C’est noté. À tout de suite.', readyMsg: 'C’est prêt. Venez le chercher.', paidMsg: 'Bon appétit. À demain.', voidMsg: 'Nous n’avons pas pu la préparer. Passez au comptoir.',
      orderNo: 'Commande {n}', pickupWhen: 'Retrait {w}.', sent: 'Envoyée', ready: 'Prête', another: 'Nouvelle commande'
    },
    de: {
      tagline: 'Kaffee · Frühstück · Mittagessen', home: 'Start', menu: 'Speisekarte', order: 'Bestellen', lang: 'Sprache',
      little: 'Ein kleines Stück', ofhome: 'Zuhause.',
      lead: 'Kaffee, Frühstück und Mittagessen auf Utila. Wir öffnen früh, damit du vor dem Tauchen isst und trotzdem das Boot erwischst.',
      orderAhead: 'Vorbestellen', seeMenu: 'Zur Speisekarte',
      b1h: 'Vor dem Tauchen', b1p: 'Heute Abend bestellen, auf dem Weg zum Steg abholen.',
      b2h: 'Bleib ein bisschen', b2p: 'Bänke, Pflanzen und WLAN. Bring ein Buch mit. Niemand hetzt dich.',
      b3h: 'Auch Mittagessen', b3p: 'Sandwiches, Salate und Smoothies bis wir schließen.',
      hours: 'Öffnungszeiten', hoursH: 'Vor allem morgens', hnTime: 'Honduras-Zeit.', find: 'So findest du uns', findH: 'Im Ort Utila',
      pay: 'Wir nehmen Lempira, US-Dollar und Karten.', map: 'In Karten öffnen', closedDay: 'Geschlossen',
      days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
      openUntil: 'Geöffnet · bis {t}', opensToday: 'Öffnet heute um {t}', backAt: 'Geschlossen · wieder {d} um {t}', closedNow: 'Gerade geschlossen',
      today: 'heute', tomorrow: 'morgen',
      menuH: 'Was es gibt', menuHand: 'heute früh gemacht.', prices: 'Preise in Lempira (L). Wir nehmen auch US-Dollar und Karten.',
      soldout: 'Heute aus', add: '+ Dazu', viewOrder: 'Bestellung ansehen', loading: 'Speisekarte wird geladen…', error: 'Die Speisekarte konnte nicht geladen werden. Bitte gleich noch einmal versuchen.',
      orderH: 'Heiß abholen', yourOrder: 'Deine Bestellung', empty: 'Noch nichts. Such dir etwas auf der Speisekarte aus.', addMore: 'Von der Speisekarte',
      subtotal: 'Essen & Getränke', togoCharges: 'Becher & Boxen zum Mitnehmen', isv: 'ISV', total: 'Gesamt',
      details: 'Deine Angaben', name: 'Name', phone: 'WhatsApp-Nummer', phoneHelp: 'Nur falls mit der Bestellung etwas nicht stimmt.',
      pickup: 'Abholen', asap: 'Sobald es fertig ist (ca. 15 Min.)', forDay: 'Gerade haben wir zu, also ist das für {d}.',
      eating: 'Essen', here: 'Hier', togo: 'Mitnehmen', note: 'Sonst noch was?', payCounter: 'Bezahlt wird an der Theke beim Abholen: Lempira, Dollar oder Karte.',
      place: 'Bestellen', sending: 'Wird gesendet…',
      eItems: 'Erst etwas von der Speisekarte wählen.', eName: 'Wir brauchen einen Namen zum Aufrufen.', ePhone: 'Gib eine WhatsApp-Nummer an, für alle Fälle.',
      eTime: 'Wähle eine Uhrzeit.', paused: 'Online-Bestellungen sind kurz pausiert. Komm an die Theke, wir kochen weiter.',
      noTimes: 'Gerade keine Abholzeiten. Schau wieder rein, wenn wir offen haben.', eFail: 'Das hat nicht geklappt. Versuch es gleich noch mal.',
      eGone: 'Etwas aus deiner Bestellung ist gerade ausverkauft. Schau nach und versuch es noch mal.', eMany: 'Du hast schon Bestellungen offen. Komm einfach an die Theke.',
      eClosedThen: 'Zu der Zeit haben wir zu. Wähle eine andere.',
      gotIt: 'Alles klar. Bis gleich.', readyMsg: 'Fertig. Komm sie holen.', paidMsg: 'Guten Appetit. Bis morgen.', voidMsg: 'Die konnten wir nicht machen. Komm an die Theke.',
      orderNo: 'Bestellung {n}', pickupWhen: 'Abholen {w}.', sent: 'Gesendet', ready: 'Fertig', another: 'Neue Bestellung'
    },
    nl: {
      tagline: 'Koffie · Ontbijt · Lunch', home: 'Home', menu: 'Menu', order: 'Bestellen', lang: 'Taal',
      little: 'Een klein beetje', ofhome: 'thuis.',
      lead: 'Koffie, ontbijt en lunch op Utila. We gaan vroeg open, zodat je voor het duiken eet en de boot toch haalt.',
      orderAhead: 'Vooruit bestellen', seeMenu: 'Bekijk het menu',
      b1h: 'Voor je duik', b1p: 'Bestel vanavond, haal het op op weg naar de steiger.',
      b2h: 'Blijf even', b2p: 'Bankjes, planten en wifi. Neem een boek mee. Niemand jaagt je op.',
      b3h: 'Ook lunch', b3p: 'Sandwiches, salades en smoothies tot we sluiten.',
      hours: 'Openingstijden', hoursH: 'Vooral ’s ochtends', hnTime: 'Hondurese tijd.', find: 'Waar we zijn', findH: 'In Utila Town',
      pay: 'We nemen lempira, dollars en kaarten aan.', map: 'Openen in Kaarten', closedDay: 'Gesloten',
      days: ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'],
      openUntil: 'Nu open · tot {t}', opensToday: 'Vandaag open om {t}', backAt: 'Nu dicht · weer open {d} om {t}', closedNow: 'Even gesloten',
      today: 'vandaag', tomorrow: 'morgen',
      menuH: 'Wat er op het vuur staat', menuHand: 'vanochtend gemaakt.', prices: 'Prijzen in lempira (L). We accepteren ook dollars en kaarten.',
      soldout: 'Op voor vandaag', add: '+ Toevoegen', viewOrder: 'Bekijk bestelling', loading: 'Menu laden…', error: 'Het menu kon niet laden. Probeer het zo opnieuw.',
      orderH: 'Haal het warm op', yourOrder: 'Je bestelling', empty: 'Nog niets. Kies iets van het menu.', addMore: 'Toevoegen van het menu',
      subtotal: 'Eten & drinken', togoCharges: 'Bekers & bakjes om mee te nemen', isv: 'ISV', total: 'Totaal',
      details: 'Je gegevens', name: 'Naam', phone: 'WhatsApp-nummer', phoneHelp: 'Alleen als er iets mis is met je bestelling.',
      pickup: 'Ophalen', asap: 'Zodra het klaar is (ongeveer 15 min)', forDay: 'We zijn nu dicht, dus dit is voor {d}.',
      eating: 'Eten', here: 'Hier', togo: 'Meenemen', note: 'Verder nog iets?', payCounter: 'Betalen doe je bij de toonbank: lempira, dollars of kaart.',
      place: 'Bestellen', sending: 'Versturen…',
      eItems: 'Voeg eerst iets van het menu toe.', eName: 'We hebben een naam nodig om om te roepen.', ePhone: 'Voeg een WhatsApp-nummer toe, voor het geval dat.',
      eTime: 'Kies een tijd.', paused: 'Online bestellen ligt even stil. Kom naar de toonbank, we koken gewoon door.',
      noTimes: 'Nu geen ophaaltijden. Kijk weer als we open zijn.', eFail: 'Dat lukte niet. Probeer het zo opnieuw.',
      eGone: 'Iets uit je bestelling is net uitverkocht. Kijk even en probeer opnieuw.', eMany: 'Je hebt al bestellingen klaarstaan. Kom even langs de toonbank.',
      eClosedThen: 'Op dat tijdstip zijn we dicht. Kies een ander.',
      gotIt: 'Komt goed. Tot zo.', readyMsg: 'Het is klaar. Kom het halen.', paidMsg: 'Eet smakelijk. Tot morgen.', voidMsg: 'Deze konden we niet maken. Kom even langs de toonbank.',
      orderNo: 'Bestelling {n}', pickupWhen: 'Ophalen {w}.', sent: 'Verstuurd', ready: 'Klaar', another: 'Nieuwe bestelling'
    },
    'nl-BE': {
      tagline: 'Koffie · Ontbijt · Lunch', home: 'Home', menu: 'Menu', order: 'Bestellen', lang: 'Taal',
      little: 'Een klein beetje', ofhome: 'thuis.',
      lead: 'Koffie, ontbijt en lunch op Utila. We gaan vroeg open, zodat ge voor het duiken eet en de boot toch haalt.',
      b2p: 'Bankskes, planten en wifi. Breng een boek mee. Niemand jaagt u op.',
      menuH: 'Wat er op het vuur staat', yourOrder: 'Uw bestelling', details: 'Uw gegevens', note: 'Nog iets?'
    },
    it: {
      tagline: 'Caffè · Colazione · Pranzo', home: 'Home', menu: 'Menù', order: 'Ordina', lang: 'Lingua',
      little: 'Un pezzettino', ofhome: 'di casa.',
      lead: 'Caffè, colazione e pranzo a Utila. Apriamo presto: mangi prima dell’immersione e prendi comunque la barca.',
      orderAhead: 'Ordina prima', seeMenu: 'Guarda il menù',
      b1h: 'Prima dell’immersione', b1p: 'Ordina stasera, ritira andando al molo.',
      b2h: 'Resta un po’', b2p: 'Panche, piante e Wi-Fi. Porta un libro. Nessuno ti mette fretta.',
      b3h: 'Anche pranzo', b3p: 'Panini, insalate e frullati fino alla chiusura.',
      hours: 'Orari', hoursH: 'Soprattutto di mattina', hnTime: 'Ora dell’Honduras.', find: 'Dove siamo', findH: 'A Utila Town',
      pay: 'Accettiamo lempira, dollari USA e carte.', map: 'Apri in Mappe', closedDay: 'Chiuso',
      days: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
      openUntil: 'Aperto · fino alle {t}', opensToday: 'Apre oggi alle {t}', backAt: 'Chiuso · riapriamo {d} alle {t}', closedNow: 'Chiuso per ora',
      today: 'oggi', tomorrow: 'domani',
      menuH: 'Cosa c’è', menuHand: 'fatto stamattina.', prices: 'Prezzi in lempira (L). Accettiamo anche dollari USA e carte.',
      soldout: 'Finito', add: '+ Aggiungi', viewOrder: 'Vedi ordine', loading: 'Caricamento del menù…', error: 'Impossibile caricare il menù. Riprova tra poco.',
      orderH: 'Ritiralo caldo', yourOrder: 'Il tuo ordine', empty: 'Ancora niente. Scegli qualcosa dal menù.', addMore: 'Aggiungi dal menù',
      subtotal: 'Cibo e bevande', togoCharges: 'Bicchieri e vaschette da asporto', isv: 'ISV', total: 'Totale',
      details: 'I tuoi dati', name: 'Nome', phone: 'Numero WhatsApp', phoneHelp: 'Solo se c’è un problema con l’ordine.',
      pickup: 'Ritiro', asap: 'Appena è pronto (circa 15 min)', forDay: 'Ora siamo chiusi, quindi è per {d}.',
      eating: 'Mangi', here: 'Qui', togo: 'Da asporto', note: 'Altro?', payCounter: 'Paghi al banco al ritiro: lempira, dollari o carta.',
      place: 'Ordina', sending: 'Invio…',
      eItems: 'Prima aggiungi qualcosa dal menù.', eName: 'Ci serve un nome da chiamare.', ePhone: 'Aggiungi un numero WhatsApp, non si sa mai.',
      eTime: 'Scegli un orario.', paused: 'Gli ordini online sono in pausa. Vieni al banco, stiamo cucinando.',
      noTimes: 'Nessun orario di ritiro ora. Torna quando siamo aperti.', eFail: 'Non è andato a buon fine. Riprova tra poco.',
      eGone: 'Qualcosa nel tuo ordine è appena finito. Controlla e riprova.', eMany: 'Hai già ordini in attesa. Passa al banco.',
      eClosedThen: 'A quell’ora siamo chiusi. Scegline un’altra.',
      gotIt: 'Fatto. A presto.', readyMsg: 'È pronto. Vieni a prenderlo.', paidMsg: 'Buon appetito. A domani.', voidMsg: 'Questo non siamo riusciti a farlo. Passa al banco.',
      orderNo: 'Ordine {n}', pickupWhen: 'Ritiro {w}.', sent: 'Inviato', ready: 'Pronto', another: 'Nuovo ordine'
    },
    pt: {
      tagline: 'Café · Café da manhã · Almoço', home: 'Início', menu: 'Cardápio', order: 'Pedir', lang: 'Idioma',
      little: 'Um pouquinho', ofhome: 'de casa.',
      lead: 'Café, café da manhã e almoço em Utila. A gente abre cedo, pra você comer antes do mergulho e ainda pegar o barco.',
      orderAhead: 'Peça antes', seeMenu: 'Ver o cardápio',
      b1h: 'Antes do mergulho', b1p: 'Peça hoje à noite e retire a caminho do píer.',
      b2h: 'Fique um pouco', b2p: 'Bancos, plantas e Wi-Fi. Traga um livro. Ninguém tá com pressa.',
      b3h: 'Almoço também', b3p: 'Sanduíches, saladas e vitaminas até a gente fechar.',
      hours: 'Horários', hoursH: 'Principalmente de manhã', hnTime: 'Horário de Honduras.', find: 'Onde estamos', findH: 'Na cidade de Utila',
      pay: 'Aceitamos lempiras, dólares e cartões.', map: 'Abrir no Mapas', closedDay: 'Fechado',
      days: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      openUntil: 'Aberto · até {t}', opensToday: 'Abre hoje às {t}', backAt: 'Fechado · voltamos {d} às {t}', closedNow: 'Fechado por enquanto',
      today: 'hoje', tomorrow: 'amanhã',
      menuH: 'O que tem hoje', menuHand: 'feito hoje cedo.', prices: 'Preços em lempiras (L). Também aceitamos dólares e cartões.',
      soldout: 'Acabou', add: '+ Adicionar', viewOrder: 'Ver pedido', loading: 'Carregando o cardápio…', error: 'Não foi possível carregar o cardápio. Tente de novo em instantes.',
      orderH: 'Retire quentinho', yourOrder: 'Seu pedido', empty: 'Nada ainda. Escolha algo do cardápio.', addMore: 'Adicionar do cardápio',
      subtotal: 'Comida e bebida', togoCharges: 'Copos e caixas pra viagem', isv: 'ISV', total: 'Total',
      details: 'Seus dados', name: 'Nome', phone: 'Número de WhatsApp', phoneHelp: 'Só se tiver algum problema com o pedido.',
      pickup: 'Retirada', asap: 'Assim que ficar pronto (uns 15 min)', forDay: 'Estamos fechados agora, então é pra {d}.',
      eating: 'Comer', here: 'Aqui', togo: 'Pra viagem', note: 'Mais alguma coisa?', payCounter: 'Você paga no balcão na retirada: lempiras, dólares ou cartão.',
      place: 'Fazer pedido', sending: 'Enviando…',
      eItems: 'Adicione algo do cardápio primeiro.', eName: 'Precisamos de um nome pra chamar.', ePhone: 'Coloque um número de WhatsApp, por via das dúvidas.',
      eTime: 'Escolha um horário.', paused: 'Os pedidos online estão pausados um pouquinho. Venha ao balcão, a gente continua cozinhando.',
      noTimes: 'Sem horários de retirada agora. Volte quando estivermos abertos.', eFail: 'Não deu certo. Tente de novo em instantes.',
      eGone: 'Algo do seu pedido acabou de esgotar. Confira e tente de novo.', eMany: 'Você já tem pedidos esperando. Passe no balcão.',
      eClosedThen: 'Estamos fechados nesse horário. Escolha outro.',
      gotIt: 'Anotado. Até já.', readyMsg: 'Tá pronto. Pode vir buscar.', paidMsg: 'Bom apetite. Até amanhã.', voidMsg: 'Não conseguimos fazer esse. Passe no balcão.',
      orderNo: 'Pedido {n}', pickupWhen: 'Retirada {w}.', sent: 'Enviado', ready: 'Pronto', another: 'Fazer outro pedido'
    },
    nb: {
      tagline: 'Kaffe · Frokost · Lunsj', home: 'Hjem', menu: 'Meny', order: 'Bestill', lang: 'Språk',
      little: 'Litt', ofhome: 'hjemme.',
      lead: 'Kaffe, frokost og lunsj på Utila. Vi åpner tidlig, så du rekker å spise før dykket og fortsatt når båten.',
      orderAhead: 'Forhåndsbestill', seeMenu: 'Se menyen',
      b1h: 'Før dykket', b1p: 'Bestill i kveld, hent på vei til brygga.',
      b2h: 'Bli en stund', b2p: 'Benker, planter og wifi. Ta med en bok. Ingen har det travelt.',
      b3h: 'Lunsj også', b3p: 'Sandwicher, salater og smoothies til vi stenger.',
      hours: 'Åpningstider', hoursH: 'Mest om morgenen', hnTime: 'Honduras-tid.', find: 'Finn oss', findH: 'I Utila Town',
      pay: 'Vi tar lempira, dollar og kort.', map: 'Åpne i Kart', closedDay: 'Stengt',
      days: ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'],
      openUntil: 'Åpent · til {t}', opensToday: 'Åpner i dag kl. {t}', backAt: 'Stengt · tilbake {d} kl. {t}', closedNow: 'Stengt nå',
      today: 'i dag', tomorrow: 'i morgen',
      menuH: 'Hva vi lager', menuHand: 'laget i morges.', prices: 'Priser i lempira (L). Vi tar også dollar og kort.',
      soldout: 'Tomt i dag', add: '+ Legg til', viewOrder: 'Se bestilling', loading: 'Laster menyen…', error: 'Menyen kunne ikke lastes. Prøv igjen om litt.',
      orderH: 'Hent den varm', yourOrder: 'Din bestilling', empty: 'Ingenting ennå. Velg noe fra menyen.', addMore: 'Legg til fra menyen',
      subtotal: 'Mat og drikke', togoCharges: 'Kopper og bokser til å ta med', isv: 'ISV', total: 'Totalt',
      details: 'Dine opplysninger', name: 'Navn', phone: 'WhatsApp-nummer', phoneHelp: 'Bare hvis noe er galt med bestillingen.',
      pickup: 'Henting', asap: 'Så snart den er klar (ca. 15 min)', forDay: 'Vi er stengt nå, så dette er for {d}.',
      eating: 'Spise', here: 'Her', togo: 'Ta med', note: 'Noe mer?', payCounter: 'Du betaler i disken når du henter: lempira, dollar eller kort.',
      place: 'Bestill', sending: 'Sender…',
      eItems: 'Legg til noe fra menyen først.', eName: 'Vi trenger et navn å rope opp.', ePhone: 'Legg inn et WhatsApp-nummer, for sikkerhets skyld.',
      eTime: 'Velg et tidspunkt.', paused: 'Nettbestilling er satt på pause en liten stund. Kom til disken, vi lager fortsatt mat.',
      noTimes: 'Ingen hentetider nå. Sjekk igjen når vi er åpne.', eFail: 'Det gikk ikke. Prøv igjen om litt.',
      eGone: 'Noe i bestillingen ble akkurat utsolgt. Sjekk og prøv igjen.', eMany: 'Du har allerede bestillinger som venter. Kom innom disken.',
      eClosedThen: 'Vi er stengt da. Velg et annet tidspunkt.',
      gotIt: 'Notert. Vi ses snart.', readyMsg: 'Den er klar. Kom og hent.', paidMsg: 'Kos deg. Vi ses i morgen.', voidMsg: 'Den klarte vi ikke å lage. Kom innom disken.',
      orderNo: 'Bestilling {n}', pickupWhen: 'Hent {w}.', sent: 'Sendt', ready: 'Klar', another: 'Ny bestilling'
    },
    ga: {
      tagline: 'Caife · Bricfeasta · Lón', home: 'Baile', menu: 'Biachlár', order: 'Ordaigh', lang: 'Teanga',
      little: 'Beagán', ofhome: 'den bhaile.',
      lead: 'Caife, bricfeasta agus lón ar Utila. Osclaímid go luath, ionas gur féidir leat ithe roimh do thumadh agus an bád a fháil fós.',
      orderAhead: 'Ordaigh roimh ré', seeMenu: 'Féach ar an mbiachlár',
      b1h: 'Roimh do thumadh', b1p: 'Ordaigh anocht, bailigh é ar do bhealach chuig an gcé.',
      b2h: 'Fan tamall', b2p: 'Binsí, plandaí agus Wi-Fi. Tabhair leabhar leat. Níl aon deifir ort.',
      b3h: 'Lón freisin', b3p: 'Ceapairí, sailéid agus smúitithe go dtí go ndúnaimid.',
      hours: 'Uaireanta', hoursH: 'Ar maidin den chuid is mó', hnTime: 'Am Hondúras.', find: 'Cá bhfuilimid', findH: 'I mbaile Utila',
      pay: 'Glacaimid le lempira, dollair SAM agus cártaí.', map: 'Oscail i Léarscáileanna', closedDay: 'Dúnta',
      days: ['Dé Domhnaigh', 'Dé Luain', 'Dé Máirt', 'Dé Céadaoin', 'Déardaoin', 'Dé hAoine', 'Dé Sathairn'],
      openUntil: 'Ar oscailt anois · go dtí {t}', opensToday: 'Osclaíonn inniu ag {t}', backAt: 'Dúnta anois · ar ais {d} ag {t}', closedNow: 'Dúnta faoi láthair',
      today: 'inniu', tomorrow: 'amárach',
      menuH: 'Cad atá á chócaráil', menuHand: 'déanta ar maidin.', prices: 'Praghsanna i lempira (L). Glacaimid le dollair SAM agus cártaí freisin.',
      soldout: 'Díolta amach', add: '+ Cuir leis', viewOrder: 'Féach ar an ordú', loading: 'Ag lódáil an bhiachláir…', error: 'Níorbh fhéidir an biachlár a lódáil. Bain triail eile as i gceann nóiméid.',
      orderH: 'Bailigh te é', yourOrder: 'D’ordú', empty: 'Faic fós. Roghnaigh rud éigin ón mbiachlár.', addMore: 'Cuir leis ón mbiachlár',
      subtotal: 'Bia agus deochanna', togoCharges: 'Cupáin agus boscaí le tabhairt leat', isv: 'ISV', total: 'Iomlán',
      details: 'Do shonraí', name: 'Ainm', phone: 'Uimhir WhatsApp', phoneHelp: 'Ach amháin má bhíonn fadhb le d’ordú.',
      pickup: 'Bailiú', asap: 'A luaithe is féidir (~15 nóim.)', forDay: 'Táimid dúnta anois, mar sin is do {d} é seo.',
      eating: 'Ag ithe', here: 'Anseo', togo: 'Le tabhairt leat', note: 'Aon rud eile?', payCounter: 'Íoc ag an gcuntar nuair a bhailíonn tú: lempira, dollair nó cárta.',
      place: 'Cuir an t-ordú isteach', sending: 'Á sheoladh…',
      eItems: 'Cuir rud éigin ón mbiachlár leis ar dtús.', eName: 'Teastaíonn ainm uainn le glaoch amach.', ePhone: 'Cuir uimhir WhatsApp leis, ar eagla na heagla.',
      eTime: 'Roghnaigh am.', paused: 'Tá orduithe ar líne ar sos tamall. Tar chuig an gcuntar, táimid fós ag cócaráil.',
      noTimes: 'Níl aon amanna bailithe ann faoi láthair. Féach arís nuair a bheimid ar oscailt.', eFail: 'Níor éirigh leis sin. Bain triail eile as i gceann nóiméid.',
      eGone: 'Díoladh amach rud éigin i d’ordú díreach anois. Féach air agus bain triail eile as.', eMany: 'Tá orduithe ag fanacht cheana féin agat. Tar chuig an gcuntar.',
      eClosedThen: 'Táimid dúnta ag an am sin. Roghnaigh am eile.',
      gotIt: 'Fuaireamar é. Feicfimid go luath thú.', readyMsg: 'Tá sé réidh. Tar agus faigh é.', paidMsg: 'Bain taitneamh as. Feicfimid amárach thú.', voidMsg: 'Níorbh fhéidir linn an ceann seo a dhéanamh. Tar chuig an gcuntar.',
      orderNo: 'Ordú {n}', pickupWhen: 'Bailigh {w}.', sent: 'Seolta', ready: 'Réidh', another: 'Ordú eile'
    },
    he: {
      tagline: 'קפה · ארוחת בוקר · ארוחת צהריים', home: 'בית', menu: 'תפריט', order: 'הזמנה', lang: 'שפה',
      little: 'קצת', ofhome: 'בית.',
      lead: 'קפה, ארוחת בוקר וצהריים באוטילה. פותחים מוקדם, כדי שתאכלו לפני הצלילה ועדיין תספיקו לסירה.',
      orderAhead: 'להזמין מראש', seeMenu: 'לתפריט',
      b1h: 'לפני הצלילה', b1p: 'מזמינים בערב, אוספים בדרך לרציף.',
      b2h: 'להישאר קצת', b2p: 'ספסלים, צמחים ו-Wi-Fi. תביאו ספר. אף אחד לא ממהר.',
      b3h: 'גם צהריים', b3p: 'כריכים, סלטים ושייקים עד הסגירה.',
      hours: 'שעות פתיחה', hoursH: 'בעיקר בבקרים', hnTime: 'שעון הונדורס.', find: 'איפה אנחנו', findH: 'בעיירה של אוטילה',
      pay: 'מקבלים למפירות, דולרים וכרטיסי אשראי.', map: 'פתיחה במפות', closedDay: 'סגור',
      days: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
      openUntil: 'פתוח עכשיו · עד {t}', opensToday: 'נפתח היום ב-{t}', backAt: 'סגור · חוזרים ב{d} ב-{t}', closedNow: 'סגור כרגע',
      today: 'היום', tomorrow: 'מחר',
      menuH: 'מה יש היום', menuHand: 'הוכן הבוקר.', prices: 'המחירים בלמפירות (L). מקבלים גם דולרים וכרטיסי אשראי.',
      soldout: 'נגמר היום', add: '+ הוספה', viewOrder: 'להזמנה', loading: 'טוען את התפריט…', error: 'לא הצלחנו לטעון את התפריט. נסו שוב בעוד רגע.',
      orderH: 'לאסוף חם', yourOrder: 'ההזמנה שלך', empty: 'עדיין כלום. בחרו משהו מהתפריט.', addMore: 'הוספה מהתפריט',
      subtotal: 'אוכל ושתייה', togoCharges: 'כוסות וקופסאות לקחת', isv: 'מע״מ', total: 'סה״כ',
      details: 'הפרטים שלך', name: 'שם', phone: 'מספר וואטסאפ', phoneHelp: 'רק אם יש בעיה עם ההזמנה.',
      pickup: 'איסוף', asap: 'ברגע שזה מוכן (כ-15 דקות)', forDay: 'אנחנו סגורים כרגע, אז זה ל{d}.',
      eating: 'אוכלים', here: 'כאן', togo: 'לקחת', note: 'עוד משהו?', payCounter: 'משלמים בדלפק באיסוף: למפירות, דולרים או אשראי.',
      place: 'להזמין', sending: 'שולח…',
      eItems: 'קודם הוסיפו משהו מהתפריט.', eName: 'צריך שם כדי לקרוא לכם.', ePhone: 'הוסיפו מספר וואטסאפ, ליתר ביטחון.',
      eTime: 'בחרו שעה.', paused: 'ההזמנות באתר בהפסקה קצרה. בואו לדלפק, אנחנו ממשיכים לבשל.',
      noTimes: 'אין כרגע שעות איסוף. בדקו שוב כשנהיה פתוחים.', eFail: 'זה לא עבר. נסו שוב בעוד רגע.',
      eGone: 'משהו מההזמנה בדיוק נגמר. בדקו ונסו שוב.', eMany: 'כבר יש לכם הזמנות שמחכות. קפצו לדלפק.',
      eClosedThen: 'בשעה הזו אנחנו סגורים. בחרו שעה אחרת.',
      gotIt: 'קיבלנו. נתראה בקרוב.', readyMsg: 'מוכן. בואו לקחת.', paidMsg: 'בתיאבון. נתראה מחר.', voidMsg: 'לא הצלחנו להכין את זה. קפצו לדלפק.',
      orderNo: 'הזמנה {n}', pickupWhen: 'איסוף {w}.', sent: 'נשלחה', ready: 'מוכנה', another: 'הזמנה חדשה'
    }
  };

  function pickLang() {
    var m = /[?&]lang=([a-zA-Z\-]+)/.exec(w.location.search), i, nav, codes = [];
    for (i = 0; i < JC.langs.length; i++) { codes.push(JC.langs[i].code); }
    if (m && codes.indexOf(m[1]) >= 0) { JC.set('lang', m[1]); return m[1]; }
    var saved = JC.get('lang', null);
    if (saved && codes.indexOf(saved) >= 0) { return saved; }
    nav = (w.navigator.language || w.navigator.userLanguage || 'en');
    if (nav === 'nl-BE') { return 'nl-BE'; }
    nav = nav.split('-')[0];
    if (nav === 'no' || nav === 'nn') { nav = 'nb'; }
    if (nav === 'iw') { nav = 'he'; }
    return codes.indexOf(nav) >= 0 ? nav : 'en';
  }
  var lang = pickLang();
  // Every key falls back: Flemish → Dutch → English, anything missing → English.
  function t(k, vars) {
    var chain = JC.fallbacks(lang), i, s;
    for (i = 0; i < chain.length; i++) { if (T[chain[i]] && T[chain[i]][k] !== undefined) { s = T[chain[i]][k]; break; } }
    if (s === undefined) { s = T.en[k]; }
    if (vars && typeof s === 'string') { s = s.replace(/\{(\w+)\}/g, function (a, b) { return vars[b] === undefined ? a : vars[b]; }); }
    return s;
  }

  var page = d.body.getAttribute('data-page');
  function $(id) { return d.getElementById(id); }
  function show(el, on) { if (el) { el.style.display = on ? '' : 'none'; } }

  /* ───────────── time (Honduras is UTC-6 all year) ───────────── */
  var DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  function hnNow() {
    var n = new Date(), x = new Date(n.getTime() - 6 * 3600000);
    return { date: x.toISOString().slice(0, 10), min: x.getUTCHours() * 60 + x.getUTCMinutes(), dow: x.getUTCDay() };
  }
  function addDays(date, n) { var x = new Date(date + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  function dowOf(date) { return new Date(date + 'T12:00:00Z').getUTCDay(); }
  function parseRange(s) {
    var m = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/.exec(String(s || '').replace(/\s/g, ''));
    return m ? { from: (+m[1]) * 60 + (+m[2]), to: (+m[3]) * 60 + (+m[4]) } : null;
  }
  function fmt(min) {
    var h = Math.floor(min / 60), m = min % 60;
    if (lang === 'en') { return (h % 12 || 12) + (m ? ':' + ('0' + m).slice(-2) : '') + (h >= 12 ? 'pm' : 'am'); }
    return h + ':' + ('0' + m).slice(-2);
  }
  function dayWord(date, today) {
    if (date === today) { return t('today'); }
    if (date === addDays(today, 1)) { return t('tomorrow'); }
    return t('days')[dowOf(date)];
  }

  /* ───────────── data ───────────── */
  var D = JC.get('site.data', null) || { settings: null, categories: [], items: [], fx: [] };
  var cart = JC.get('site.cart', {});
  if (!cart || typeof cart !== 'object') { cart = {}; }
  function saveCart() { JC.set('site.cart', cart); }

  function closedOn(date) { var c = D.settings && D.settings.closed_until; return !!c && date <= c; }
  function hoursOn(date) {
    if (!D.settings || closedOn(date)) { return null; }
    return parseRange((D.settings.hours || {})[DAY_KEYS[dowOf(date)]]);
  }
  function nextWindow() {
    var n = hnNow(), i, date, hr;
    for (i = 0; i < 15; i++) {
      date = addDays(n.date, i); hr = hoursOn(date);
      if (!hr || (i === 0 && n.min >= hr.to)) { continue; }
      return { date: date, from: hr.from, to: hr.to, isToday: i === 0 };
    }
    return null;
  }
  function status() {
    var n = hnNow(), hr = hoursOn(n.date), nw = nextWindow();
    if (!D.settings) { return null; }
    if (hr && n.min >= hr.from && n.min < hr.to) { return { cls: 'open', text: t('openUntil', { t: fmt(hr.to) }) }; }
    if (nw && nw.isToday) { return { cls: 'soon', text: t('opensToday', { t: fmt(nw.from) }) }; }
    if (!nw) { return { cls: 'closed', text: t('closedNow') }; }
    return { cls: 'closed', text: t('backAt', { d: dayWord(nw.date, n.date), t: fmt(nw.from) }) };
  }

  function catOf(it) { for (var i = 0; i < D.categories.length; i++) { if (D.categories[i].id === it.category_id) { return D.categories[i]; } } return null; }
  function itemById(id) { for (var i = 0; i < D.items.length; i++) { if (D.items[i].id === id) { return D.items[i]; } } return null; }
  function togoFor(it) {
    if (it.togo_charge !== null && it.togo_charge !== undefined) { return Number(it.togo_charge); }
    var c = catOf(it); return c ? Number(c.togo_charge || 0) : 0;
  }
  function lines() {
    var out = [], id, it;
    for (id in cart) {
      if (cart.hasOwnProperty(id)) { it = itemById(id); if (it && it.available && cart[id] > 0) { out.push({ item: it, qty: cart[id] }); } }
    }
    return out;
  }
  function count() { var n = 0, l = lines(), i; for (i = 0; i < l.length; i++) { n += l[i].qty; } return n; }
  // Same sums as the POS (and the server, which has the final say).
  function totals(type) {
    var st = D.settings || {}, l = lines(), sub = 0, togo = 0, i, total, tax, r = Number(st.tax_rate || 0);
    for (i = 0; i < l.length; i++) { sub += Number(l[i].item.price) * l[i].qty; if (type === 'togo') { togo += togoFor(l[i].item) * l[i].qty; } }
    if (st.prices_include_tax !== false) { total = JC.round2(sub + togo); tax = JC.round2(total - total / (1 + r)); }
    else { tax = JC.round2((sub + togo) * r); total = JC.round2(sub + togo + tax); }
    return { sub: JC.round2(sub), togo: JC.round2(togo), tax: tax, total: total };
  }

  function load(cb) {
    var fresh = {}, pending = 4, failed = false;
    function done(err) {
      if (err) { failed = true; }
      pending -= 1;
      if (pending) { return; }
      if (!failed) { D = fresh; JC.set('site.data', D); }
      cb(failed);
    }
    JC.rest('GET', 'settings?select=hours,address,tax_rate,prices_include_tax,usd_fee,usd_rate_manual,closed_until,closed_note,online_orders', null, null, function (e, r) {
      if (e && e.status === 400) {
        // Database not updated to v1.1 yet (003_online_orders.sql): show hours and menu, keep ordering off.
        JC.rest('GET', 'settings?select=hours,address,tax_rate,prices_include_tax,usd_fee,usd_rate_manual', null, null, function (e2, r2) {
          fresh.settings = r2 && r2[0]; if (fresh.settings) { fresh.settings.online_orders = false; } done(e2);
        });
        return;
      }
      fresh.settings = r && r[0]; done(e);
    });
    JC.rest('GET', 'categories?select=id,name,togo_charge,sort&order=sort.asc', null, null, function (e, r) { fresh.categories = r || []; done(e); });
    JC.rest('GET', 'items?select=id,category_id,name,description,price,togo_charge,available,sort&order=sort.asc', null, null, function (e, r) { fresh.items = r || []; done(e); });
    JC.rest('GET', 'fx_rates?select=day,bank_buy&order=day.desc&limit=7', null, null, function (e, r) { fresh.fx = r || []; done(e); });
  }

  /* ───────────── shared header ───────────── */
  function paintCommon() {
    var c = count(), nc = $('navCount');
    if (nc) { nc.innerHTML = String(c); show(nc, c > 0); }
  }

  /* ───────────── home ───────────── */
  function paintHome() {
    var st = status(), el = $('status'), n = hnNow(), rows = '', order = [1, 2, 3, 4, 5, 6, 0], i, dd, r, note;
    if (st) { el.className = 'status ' + st.cls; el.innerHTML = '<span class="dot"></span>' + JC.esc(st.text); }
    note = D.settings && D.settings.closed_note;
    show($('closedNote'), !!(note && closedOn(n.date)));
    if (note) { $('closedNote').firstChild.innerHTML = JC.esc(note); }
    if (D.settings) {
      for (i = 0; i < 7; i++) {
        dd = order[i]; r = parseRange((D.settings.hours || {})[DAY_KEYS[dd]]);
        rows += '<tr' + (dd === n.dow ? ' class="today"' : '') + '><td>' + JC.esc(t('days')[dd]) + '</td><td>' +
          JC.esc(r ? fmt(r.from) + ' – ' + fmt(r.to) : t('closedDay')) + '</td></tr>';
      }
      $('hours').innerHTML = rows;
      if (D.settings.address) { $('address').innerHTML = JC.esc(D.settings.address); }
    }
  }

  /* ───────────── menu ───────────── */
  function qtyHtml(id) {
    var q = cart[id] || 0;
    if (!q) { return '<button class="btn small soft" data-act="add" data-id="' + id + '">' + JC.esc(t('add')) + '</button>'; }
    return '<span class="qty"><button data-act="dec" data-id="' + id + '" aria-label="−">−</button><span>' + q + '</span>' +
      '<button data-act="inc" data-id="' + id + '" aria-label="+">+</button></span>';
  }
  function paintMenu(failed) {
    var html = '', nav = '', i, j, c, list, it, rate = JC.usdRate(D.settings, D.fx), canOrder = !!(D.settings && D.settings.online_orders !== false);
    for (i = 0; i < D.categories.length; i++) {
      c = D.categories[i]; list = [];
      for (j = 0; j < D.items.length; j++) { if (D.items[j].category_id === c.id) { list.push(D.items[j]); } }
      if (!list.length) { continue; }
      nav += '<a href="#c-' + c.id + '">' + JC.esc(JC.tr(c.name, lang)) + '</a>';
      html += '<section class="cat" id="c-' + c.id + '"><h2>' + JC.esc(JC.tr(c.name, lang)) + '</h2><div class="items flex wrapflex">';
      for (j = 0; j < list.length; j++) {
        it = list[j];
        html += '<div class="item' + (it.available ? '' : ' out') + '"><div class="item-in flex"><div class="grow"><h3>' + JC.esc(JC.tr(it.name, lang)) + '</h3>' +
          (JC.tr(it.description, lang) ? '<p class="d">' + JC.esc(JC.tr(it.description, lang)) + '</p>' : '') + '</div><div class="side flex center-y">' +
          (it.available ? '<div class="pr"><span class="p">' + JC.money(it.price) + '</span>' + (rate ? '<span class="usd">≈ ' + JC.money(it.price / rate, '$') + '</span>' : '') + '</div>' +
            (canOrder ? '<div class="q">' + qtyHtml(it.id) + '</div>' : '') : '<span class="out-tag">' + JC.esc(t('soldout')) + '</span>') + '</div></div></div>';
      }
      html += '</div></section>';
    }
    $('catnav').innerHTML = nav;
    $('menu-list').innerHTML = html || '<p class="empty">' + JC.esc(failed ? t('error') : t('loading')) + '</p>';
    var c2 = count();
    show($('bar'), c2 > 0 && canOrder);
    $('barCount').innerHTML = JC.esc(t('viewOrder')) + ' · ' + c2;
    $('barTotal').innerHTML = JC.money(totals('here').total);
  }

  /* ───────────── order ───────────── */
  var placing = false;
  function eatType() { return $('eatGo').checked ? 'togo' : 'here'; }
  function slots() {
    var nw = nextWindow(), n = hnNow(), start, out = [], m;
    if (!nw) { return { w: null, list: out }; }
    start = nw.from;
    if (nw.isToday) { start = Math.max(nw.from, Math.ceil((n.min + 15) / 15) * 15); }
    for (m = start; m <= nw.to - 15; m += 15) { out.push(m); }
    return { w: nw, list: out };
  }
  function paintOrder() {
    var l = lines(), h = '', i, tt = totals(eatType()), sel = $('fTime'), keep = sel.value, sl = slots(), n = hnNow(), o = '', st = status(),
      paused = D.settings && D.settings.online_orders === false, why = '';
    for (i = 0; i < l.length; i++) {
      h += '<div class="li flex"><b class="grow">' + JC.esc(JC.tr(l[i].item.name, lang)) + '</b>' + qtyHtml(l[i].item.id) +
        '<span class="p">' + JC.money(l[i].item.price * l[i].qty) + '</span></div>';
    }
    $('lines').innerHTML = h || '<p class="empty">' + JC.esc(t('empty')) + '</p>';
    h = '<div class="r flex"><span>' + JC.esc(t('subtotal')) + '</span><span>' + JC.money(tt.sub) + '</span></div>';
    if (tt.togo) { h += '<div class="r flex"><span>' + JC.esc(t('togoCharges')) + '</span><span>' + JC.money(tt.togo) + '</span></div>'; }
    if (D.settings && D.settings.prices_include_tax === false) { h += '<div class="r flex"><span>' + JC.esc(t('isv')) + '</span><span>' + JC.money(tt.tax) + '</span></div>'; }
    $('sum').innerHTML = h + '<div class="r tot flex"><span>' + JC.esc(t('total')) + '</span><span>' + JC.money(tt.total) + '</span></div>';
    if (sl.w) {
      for (i = 0; i < sl.list.length; i++) {
        var label = (i === 0 && sl.w.isToday && st && st.cls === 'open') ? t('asap') :
          (sl.w.isToday ? '' : cap(dayWord(sl.w.date, n.date)) + ', ') + fmt(sl.list[i]);
        o += '<option value="' + sl.w.date + '|' + sl.list[i] + '">' + JC.esc(label) + '</option>';
      }
      $('timeHint').innerHTML = sl.w.isToday ? '' : JC.esc(t('forDay', { d: dayWord(sl.w.date, n.date) }));
    }
    sel.innerHTML = o;
    if (keep) { for (i = 0; i < sel.options.length; i++) { if (sel.options[i].value === keep) { sel.value = keep; } } }
    if (paused) { why = t('paused'); } else if (D.settings && !sl.list.length) { why = t('noTimes'); }
    $('placeBtn').disabled = placing || !l.length || !!why || !D.settings;
    if (!placing) { setErr(why); }
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function setErr(m) { var e = $('orderErr'); e.innerHTML = JC.esc(m || ''); show(e, !!m); }

  function place() {
    var name = $('fName').value.replace(/^\s+|\s+$/g, ''), phone = $('fPhone').value.replace(/^\s+|\s+$/g, ''), tv = $('fTime').value, l = lines(), i, parts, body, btn = $('placeBtn');
    if (!l.length) { return setErr(t('eItems')); }
    if (!name) { return setErr(t('eName')); }
    if (phone.replace(/\D/g, '').length < 7) { return setErr(t('ePhone')); }
    if (!tv) { return setErr(t('eTime')); }
    parts = tv.split('|');
    var mins = +parts[1], iso = parts[0] + 'T' + ('0' + Math.floor(mins / 60)).slice(-2) + ':' + ('0' + mins % 60).slice(-2) + ':00-06:00';
    var pending = JC.get('site.pending', null);
    body = { id: pending && pending.sig === JSON.stringify([cart, name, phone, tv]) ? pending.id : JC.uuid(),
      name: name, phone: phone, order_type: eatType(), pickup_at: iso, note: $('fNote').value, lines: [] };
    for (i = 0; i < l.length; i++) { body.lines.push({ item_id: l[i].item.id, qty: l[i].qty }); }
    // Remember the id so a retry after a dropped connection can't make two orders.
    JC.set('site.pending', { id: body.id, sig: JSON.stringify([cart, name, phone, tv]) });
    JC.set('site.me', { name: name, phone: phone });
    placing = true; btn.disabled = true; btn.innerHTML = JC.esc(t('sending')); setErr('');
    JC.rest('POST', 'rpc/place_online_order', { p: body }, null, function (err, data) {
      placing = false; btn.innerHTML = JC.esc(t('place'));
      if (err) {
        var msg = String((err.data && (err.data.message || err.data.hint)) || '');
        setErr(/orders_paused/.test(msg) ? t('paused') : /item_unavailable/.test(msg) ? t('eGone') : /too_many/.test(msg) ? t('eMany') :
          /closed_then|bad_time/.test(msg) ? t('eClosedThen') : t('eFail'));
        if (/item_unavailable|orders_paused|closed_then/.test(msg)) { load(function () { paintOrder(); }); } else { paintOrder(); }
        return;
      }
      JC.del('site.pending');
      cart = {}; saveCart(); $('fNote').value = '';
      JC.set('site.lastOrder', { id: data.id, number: data.number, total: data.total, pickup: iso, name: name, items: l.map(function (x) { return x.qty + ' × ' + JC.tr(x.item.name, lang); }), status: 'open', ready: false });
      paintAll(); w.scrollTo(0, 0); pollOrder();
    });
  }

  var pollTimer = null;
  function pollOrder() {
    var last = JC.get('site.lastOrder', null);
    if (pollTimer) { w.clearTimeout(pollTimer); pollTimer = null; }
    if (!last || last.status !== 'open') { return; }
    JC.rest('POST', 'rpc/online_order_status', { p_id: last.id }, null, function (err, r) {
      if (!err && r) { last.status = r.status; last.ready = !!r.ready; JC.set('site.lastOrder', last); paintDone(); }
      if (last.status === 'open') { pollTimer = w.setTimeout(pollOrder, 15000); }
    });
  }
  function paintDone() {
    var last = JC.get('site.lastOrder', null), box = $('orderDone'), n = hnNow(), msg, when, pick, pd, pm;
    show($('orderForm'), !last); show(box, !!last);
    if (!last) { return; }
    pick = new Date(new Date(last.pickup).getTime() - 6 * 3600000);
    pd = pick.toISOString().slice(0, 10); pm = pick.getUTCHours() * 60 + pick.getUTCMinutes();
    when = (pd === n.date ? '' : dayWord(pd, n.date) + ' ') + fmt(pm);
    msg = last.status === 'paid' ? t('paidMsg') : last.status === 'void' ? t('voidMsg') : last.ready ? t('readyMsg') : t('gotIt');
    box.innerHTML = '<div class="card done"><span class="hand">' + JC.esc(msg) + '</span>' +
      '<p class="num">' + JC.esc(t('orderNo', { n: last.number })) + ' · ' + JC.esc(last.name) + '</p>' +
      (last.status === 'void' ? '' : '<div class="steps"><span class="on">' + JC.esc(t('sent')) + '</span><span class="' + (last.ready || last.status === 'paid' ? 'on' : '') + '">' + JC.esc(t('ready')) + '</span></div>') +
      '<p class="muted">' + JC.esc(t('pickupWhen', { w: when })) + ' ' + JC.esc(t('payCounter')) + '</p>' +
      '<ul>' + (last.items || []).map(function (s) { return '<li>' + JC.esc(s) + '</li>'; }).join('') + '</ul>' +
      '<p style="margin-top:20px"><button class="btn soft" data-act="another">' + JC.esc(t('another')) + '</button></p></div>';
  }

  /* ───────────── wiring ───────────── */
  function paintAll(failed) {
    paintCommon();
    if (page === 'home') { paintHome(); }
    else if (page === 'menu') { paintMenu(failed); }
    else if (page === 'order') { paintOrder(); paintDone(); }
  }
  function onClick(ev) {
    var el = ev.target, act, id;
    while (el && el !== d.body && !(el.getAttribute && el.getAttribute('data-act'))) { el = el.parentNode; }
    if (!el || el === d.body || !el.getAttribute) { return; }
    act = el.getAttribute('data-act'); id = el.getAttribute('data-id');
    ev.preventDefault();
    if (act === 'add') { cart[id] = 1; }
    else if (act === 'inc') { cart[id] = Math.min((cart[id] || 0) + 1, 20); }
    else if (act === 'dec') { cart[id] = (cart[id] || 0) - 1; if (cart[id] <= 0) { delete cart[id]; } }
    else if (act === 'another') { JC.del('site.lastOrder'); }
    saveCart(); paintAll();
  }
  function bounce() {
    var els = d.querySelectorAll('.bounce'), i, j, txt, seed, s, r, r2;
    for (i = 0; i < els.length; i++) {
      txt = els[i].textContent; seed = 7; els[i].innerHTML = '';
      for (j = 0; j < txt.length; j++) {
        s = d.createElement('span'); s.appendChild(d.createTextNode(txt.charAt(j) === ' ' ? ' ' : txt.charAt(j)));
        seed = (seed * 9301 + 49297) % 233280; r = seed / 233280; r2 = ((seed * 7) % 233280) / 233280;
        s.style.webkitTransform = s.style.transform = 'rotate(' + ((r - 0.5) * 7).toFixed(1) + 'deg) translateY(' + ((r2 - 0.5) * 0.08).toFixed(3) + 'em)';
        els[i].appendChild(s);
      }
    }
  }
  function init() {
    var html = d.documentElement, sel = $('lang'), i, o, keys, k, me;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
    for (i = 0; i < JC.langs.length; i++) {
      o = d.createElement('option'); o.value = JC.langs[i].code; o.appendChild(d.createTextNode(JC.langs[i].label));
      if (JC.langs[i].code === lang) { o.selected = true; }
      sel.appendChild(o);
    }
    sel.onchange = function () { JC.set('lang', sel.value); w.location.search = '?lang=' + sel.value; };
    keys = d.querySelectorAll('[data-t]');
    for (i = 0; i < keys.length; i++) { k = keys[i].getAttribute('data-t'); if (typeof t(k) === 'string') { keys[i].innerHTML = JC.esc(t(k)); } }
    bounce();
    $('year').innerHTML = String(new Date().getFullYear());
    d.addEventListener('click', onClick, false);
    if (page === 'order') {
      me = JC.get('site.me', null);
      if (me) { $('fName').value = me.name || ''; $('fPhone').value = me.phone || ''; }
      $('details').onsubmit = function (e) { e.preventDefault(); if (!placing) { place(); } };
      $('eatHere').onchange = $('eatGo').onchange = function () { paintOrder(); };
      pollOrder();
    }
    paintAll();
    load(function (failed) { paintAll(failed && !D.settings); });
    w.setInterval(function () { if (!placing) { load(function () { paintAll(); }); } }, 120000);
  }

  if (d.readyState === 'loading') { d.addEventListener('DOMContentLoaded', init); } else { init(); }
}(window, document, window.JC));
