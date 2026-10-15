/* Josie's World · the website. The map is the home page; tap the menu board, pick what you like, send it, watch it being made.
   A guest is a name. Pay at the counter. After 2 pm the site only shows the menu. Plain ES5. */
(function (w, d, JC) {
  'use strict';
  var ART = w.J2ART, T = w.J2T;
  var STR = {
    en: { open: 'Open', openTill: 'Open · till', closed: 'Closed', justMenu: 'Just the menu', lang: 'Language', help: 'How it works', yourOrder: 'Your order', review: 'Review', add: 'Add', out: 'Out today', ranOut: 'ran out today',
      here: 'For here', togo: 'To go', yourName: 'Your name', send: 'Send to the kitchen', paySoon: 'Pay at the counter when you pick it up.', total: 'Total', back: 'Back', close: 'Close', remove: 'Remove', empty: 'Nothing yet. Tap a dish.',
      nameNeeded: 'Please add your name so we know whose it is.', closedAfter: 'Online orders are closed for today. Come see us until 2:30, or look at the menu.', closedNow: 'We are closed right now. The menu is here to look at.', paused: 'Online orders are paused. Come by the counter.', 
      gone: 'Something in your order just ran out. Please look it over and try again.', many: 'There are a few orders waiting already. Please come by the counter.', fail: 'That did not go through. Please try again.', 
      yourOrderAt: 'Your order at Josie’s', making: 'Making it', pickedUp: 'Picked up', cancelled: 'Cancelled at the counter', addSomething: '+ Add something', kitchenNow: 'Josie’s kitchen, right now', barNow: 'At the bar', payPickup: 'Pay when you pick up', gate: 'Come in by the small gate, under the pink sign.',
      newOrder: 'Order something else', no: 'NO', core: 'is the dish', vegan: 'Vegan', helpText: '', h1: 'Tap the menu board on the map', h2: 'Tap a dish to see what is in it', h3: 'Tap an ingredient to leave it out, or a diet button to see what changes', h4: 'Tap Add, then Review. Type your name and pick For here or To go', h5: 'Send it, then watch it being made. Pay at the counter when you pick it up',
      addingTo: 'Adding to your order', sendAdd: 'Add to my order', tapIngredient: 'Tap an ingredient to leave it out.', meatDairy: 'This has meat and dairy together, which is not kosher-style.', mon: 'Mon', sat: 'Sat', dishIs: 'is what this dish is built on. You can add it anyway.', bar: 'Bar', kitchen: 'Kitchen', bayMap: 'Utila Bay', cafeMap: 'Josie’s' },
    es: { open: 'Abierto', openTill: 'Abierto · hasta', closed: 'Cerrado', justMenu: 'Solo el menú', lang: 'Idioma', help: 'Cómo funciona', yourOrder: 'Tu pedido', review: 'Revisar', add: 'Agregar', out: 'Agotado hoy', ranOut: 'se acabó hoy',
      here: 'Para aquí', togo: 'Para llevar', yourName: 'Tu nombre', send: 'Enviar a la cocina', paySoon: 'Pagas en el mostrador al recogerlo.', total: 'Total', back: 'Atrás', close: 'Cerrar', remove: 'Quitar', empty: 'Nada todavía. Toca un plato.',
      nameNeeded: 'Pon tu nombre para saber de quién es.', closedAfter: 'Los pedidos en línea están cerrados por hoy. Pasa hasta las 2:30, o mira el menú.', closedNow: 'Estamos cerrados ahora. El menú está aquí para mirar.', paused: 'Los pedidos en línea están en pausa. Pasa por el mostrador.',
      gone: 'Algo de tu pedido se acaba de agotar. Revísalo e inténtalo otra vez.', many: 'Ya hay varios pedidos esperando. Pasa por el mostrador.', fail: 'No se pudo enviar. Inténtalo otra vez.',
      yourOrderAt: 'Tu pedido en Josie’s', making: 'Lo estamos haciendo', pickedUp: 'Recogido', cancelled: 'Cancelado en el mostrador', addSomething: '+ Agregar algo', kitchenNow: 'La cocina de Josie’s, ahora', barNow: 'En el bar', payPickup: 'Pagas al recogerlo', gate: 'Entra por el portón pequeño, bajo el letrero rosado.',
      newOrder: 'Pedir otra cosa', no: 'SIN', core: 'es el plato', vegan: 'Vegano', helpText: '', h1: 'Toca el menú en el mapa', h2: 'Toca un plato para ver qué lleva', h3: 'Toca un ingrediente para quitarlo, o un botón de dieta para ver qué cambia', h4: 'Toca Agregar y luego Revisar. Escribe tu nombre y elige Aquí o Para llevar', h5: 'Envíalo y mira cómo lo preparan. Pagas en el mostrador al recogerlo',
      addingTo: 'Agregando a tu pedido', sendAdd: 'Agregar a mi pedido', tapIngredient: 'Toca un ingrediente para quitarlo.', meatDairy: 'Lleva carne y lácteos juntos, no es estilo kosher.', mon: 'Lun', sat: 'Sáb', dishIs: 'es la base de este plato. Puedes agregarlo igual.', bar: 'Bar', kitchen: 'Cocina', bayMap: 'Bahía de Utila', cafeMap: 'Josie’s' },
    'fr': {"open": "Ouvert", "openTill": "Ouvert · jusqu’à", "closed": "Fermé", "justMenu": "Juste le menu", "lang": "Langue", "help": "Comment ça marche", "yourOrder": "Votre commande", "review": "Voir", "add": "Ajouter", "out": "Épuisé aujourd’hui", "ranOut": "épuisé aujourd’hui", "here": "Sur place", "togo": "À emporter", "yourName": "Votre prénom", "send": "Envoyer en cuisine", "paySoon": "Vous payez au comptoir en venant la chercher.", "total": "Total", "back": "Retour", "close": "Fermer", "remove": "Retirer", "empty": "Rien pour l’instant. Touchez un plat.", "nameNeeded": "Ajoutez votre prénom pour qu’on sache à qui c’est.", "closedAfter": "Les commandes en ligne sont fermées pour aujourd’hui. Passez nous voir jusqu’à 14 h 30, ou regardez le menu.", "closedNow": "Nous sommes fermés pour le moment. Le menu est là pour regarder.", "paused": "Les commandes en ligne sont en pause. Passez au comptoir.", "gone": "Quelque chose dans votre commande vient de s’épuiser. Vérifiez et réessayez.", "many": "Il y a déjà plusieurs commandes en attente. Passez au comptoir.", "fail": "Ça n’a pas marché. Réessayez.", "yourOrderAt": "Votre commande chez Josie’s", "making": "En préparation", "pickedUp": "Récupérée", "cancelled": "Annulée au comptoir", "addSomething": "+ Ajouter quelque chose", "kitchenNow": "La cuisine de Josie’s, en direct", "barNow": "Au bar", "payPickup": "Vous payez en venant la chercher", "gate": "Entrez par le petit portail, sous l’enseigne rose.", "newOrder": "Commander autre chose", "no": "SANS", "core": "c’est le plat", "vegan": "Végan", "h1": "Touchez le menu sur la carte", "h2": "Touchez un plat pour voir ce qu’il contient", "h3": "Touchez un ingrédient pour l’enlever, ou un bouton de régime pour voir ce qui change", "h4": "Touchez Ajouter, puis Voir. Tapez votre prénom et choisissez Sur place ou À emporter", "h5": "Envoyez-la et regardez-la se préparer. Vous payez au comptoir en venant la chercher", "addingTo": "Ajout à votre commande", "sendAdd": "Ajouter à ma commande", "tapIngredient": "Touchez un ingrédient pour l’enlever.", "meatDairy": "Ce plat contient viande et produits laitiers ensemble, ce n’est pas casher.", "mon": "Lun", "sat": "Sam", "dishIs": "est la base de ce plat. Vous pouvez l’ajouter quand même.", "bar": "Bar", "kitchen": "Cuisine", "bayMap": "Baie d’Utila", "cafeMap": "Josie’s"},
    'de': {"open": "Geöffnet", "openTill": "Geöffnet · bis", "closed": "Geschlossen", "justMenu": "Nur die Speisekarte", "lang": "Sprache", "help": "So funktioniert’s", "yourOrder": "Deine Bestellung", "review": "Prüfen", "add": "Hinzufügen", "out": "Heute aus", "ranOut": "heute aus", "here": "Hier essen", "togo": "Zum Mitnehmen", "yourName": "Dein Name", "send": "An die Küche schicken", "paySoon": "Bezahlt wird an der Theke, wenn du abholst.", "total": "Gesamt", "back": "Zurück", "close": "Schließen", "remove": "Entfernen", "empty": "Noch nichts. Tipp auf ein Gericht.", "nameNeeded": "Bitte gib deinen Namen an, damit wir wissen, für wen es ist.", "closedAfter": "Online-Bestellungen sind für heute geschlossen. Komm bis 14:30 Uhr vorbei oder schau in die Speisekarte.", "closedNow": "Wir haben gerade geschlossen. Die Speisekarte kannst du dir trotzdem ansehen.", "paused": "Online-Bestellungen sind pausiert. Komm bitte an die Theke.", "gone": "Etwas aus deiner Bestellung ist gerade ausgegangen. Bitte prüfe sie und versuche es noch einmal.", "many": "Es warten schon einige Bestellungen. Bitte komm an die Theke.", "fail": "Das hat nicht geklappt. Bitte versuche es noch einmal.", "yourOrderAt": "Deine Bestellung bei Josie’s", "making": "Wird zubereitet", "pickedUp": "Abgeholt", "cancelled": "An der Theke storniert", "addSomething": "+ Noch etwas", "kitchenNow": "Josie’s Küche, jetzt gerade", "barNow": "An der Bar", "payPickup": "Bezahlt wird bei der Abholung", "gate": "Komm durch das kleine Tor, unter dem rosa Schild.", "newOrder": "Etwas anderes bestellen", "no": "OHNE", "core": "ist das Gericht", "vegan": "Vegan", "h1": "Tipp auf die Speisetafel im Café-Plan", "h2": "Tipp auf ein Gericht, um zu sehen, was drin ist", "h3": "Tipp auf eine Zutat, um sie wegzulassen, oder auf eine Ernährungsform, um zu sehen, was sich ändert", "h4": "Tipp auf Hinzufügen, dann Prüfen. Gib deinen Namen ein und wähle Hier essen oder Zum Mitnehmen", "h5": "Abschicken und beim Zubereiten zuschauen. Bezahlt wird an der Theke bei der Abholung", "addingTo": "Zu deiner Bestellung hinzufügen", "sendAdd": "Zu meiner Bestellung", "tapIngredient": "Tipp auf eine Zutat, um sie wegzulassen.", "meatDairy": "Das Gericht enthält Fleisch und Milchprodukte zusammen, das ist nicht koscher.", "mon": "Mo", "sat": "Sa", "dishIs": "ist die Grundlage dieses Gerichts. Du kannst es trotzdem hinzufügen.", "bar": "Bar", "kitchen": "Küche", "bayMap": "Utila-Bucht", "cafeMap": "Josie’s"},
    'nl': {"open": "Open", "openTill": "Open · tot", "closed": "Gesloten", "justMenu": "Alleen het menu", "lang": "Taal", "help": "Hoe werkt het", "yourOrder": "Jouw bestelling", "review": "Controleren", "add": "Toevoegen", "out": "Vandaag op", "ranOut": "vandaag op", "here": "Hier opeten", "togo": "Meenemen", "yourName": "Jouw naam", "send": "Naar de keuken sturen", "paySoon": "Je betaalt aan de balie als je het ophaalt.", "total": "Totaal", "back": "Terug", "close": "Sluiten", "remove": "Verwijderen", "empty": "Nog niets. Tik op een gerecht.", "nameNeeded": "Vul je naam in, dan weten we van wie het is.", "closedAfter": "Online bestellen is voor vandaag gesloten. Kom langs tot 14:30 of bekijk het menu.", "closedNow": "We zijn nu gesloten. Het menu kun je gewoon bekijken.", "paused": "Online bestellen staat op pauze. Kom even naar de balie.", "gone": "Er is iets uit je bestelling net op geraakt. Controleer het en probeer het opnieuw.", "many": "Er wachten al een paar bestellingen. Kom even naar de balie.", "fail": "Dat is niet gelukt. Probeer het opnieuw.", "yourOrderAt": "Jouw bestelling bij Josie’s", "making": "Wordt gemaakt", "pickedUp": "Opgehaald", "cancelled": "Geannuleerd aan de balie", "addSomething": "+ Nog iets toevoegen", "kitchenNow": "De keuken van Josie’s, nu", "barNow": "Aan de bar", "payPickup": "Betalen bij het ophalen", "gate": "Kom binnen via het kleine hek, onder het roze bord.", "newOrder": "Iets anders bestellen", "no": "ZONDER", "core": "is het gerecht", "vegan": "Vegan", "h1": "Tik op het menubord op de kaart", "h2": "Tik op een gerecht om te zien wat erin zit", "h3": "Tik op een ingrediënt om het weg te laten, of op een dieetknop om te zien wat er verandert", "h4": "Tik op Toevoegen, dan Controleren. Vul je naam in en kies Hier opeten of Meenemen", "h5": "Verstuur het en kijk hoe het gemaakt wordt. Betalen aan de balie bij het ophalen", "addingTo": "Toevoegen aan je bestelling", "sendAdd": "Toevoegen aan mijn bestelling", "tapIngredient": "Tik op een ingrediënt om het weg te laten.", "meatDairy": "Dit bevat vlees en zuivel samen, en dat is niet koosjer.", "mon": "Ma", "sat": "Za", "dishIs": "is waar dit gerecht op is gebouwd. Je kunt het toch toevoegen.", "bar": "Bar", "kitchen": "Keuken", "bayMap": "Baai van Utila", "cafeMap": "Josie’s"},
    'it': {"open": "Aperto", "openTill": "Aperto · fino alle", "closed": "Chiuso", "justMenu": "Solo il menù", "lang": "Lingua", "help": "Come funziona", "yourOrder": "Il tuo ordine", "review": "Controlla", "add": "Aggiungi", "out": "Finito oggi", "ranOut": "finito oggi", "here": "Qui", "togo": "Da asporto", "yourName": "Il tuo nome", "send": "Manda in cucina", "paySoon": "Paghi al banco quando lo ritiri.", "total": "Totale", "back": "Indietro", "close": "Chiudi", "remove": "Rimuovi", "empty": "Ancora niente. Tocca un piatto.", "nameNeeded": "Scrivi il tuo nome così sappiamo di chi è.", "closedAfter": "Gli ordini online sono chiusi per oggi. Passa da noi fino alle 14:30, o guarda il menù.", "closedNow": "Siamo chiusi in questo momento. Il menù è qui da guardare.", "paused": "Gli ordini online sono in pausa. Passa al banco.", "gone": "Qualcosa del tuo ordine è appena finito. Controlla e riprova.", "many": "Ci sono già diversi ordini in attesa. Passa al banco.", "fail": "Non è andata a buon fine. Riprova.", "yourOrderAt": "Il tuo ordine da Josie’s", "making": "Lo stiamo preparando", "pickedUp": "Ritirato", "cancelled": "Annullato al banco", "addSomething": "+ Aggiungi qualcosa", "kitchenNow": "La cucina di Josie’s, adesso", "barNow": "Al bar", "payPickup": "Paghi quando lo ritiri", "gate": "Entra dal cancelletto, sotto l’insegna rosa.", "newOrder": "Ordina qualcos’altro", "no": "SENZA", "core": "è il piatto", "vegan": "Vegano", "h1": "Tocca il menù sulla mappa", "h2": "Tocca un piatto per vedere cosa contiene", "h3": "Tocca un ingrediente per toglierlo, o un pulsante dieta per vedere cosa cambia", "h4": "Tocca Aggiungi, poi Controlla. Scrivi il tuo nome e scegli Qui o Da asporto", "h5": "Invialo e guarda come lo preparano. Paghi al banco quando lo ritiri", "addingTo": "Aggiunta al tuo ordine", "sendAdd": "Aggiungi al mio ordine", "tapIngredient": "Tocca un ingrediente per toglierlo.", "meatDairy": "Contiene carne e latticini insieme, non è kosher.", "mon": "Lun", "sat": "Sab", "dishIs": "è la base di questo piatto. Puoi aggiungerlo comunque.", "bar": "Bar", "kitchen": "Cucina", "bayMap": "Baia di Utila", "cafeMap": "Josie’s"},
    'pt': {"open": "Aberto", "openTill": "Aberto · até", "closed": "Fechado", "justMenu": "Só o cardápio", "lang": "Idioma", "help": "Como funciona", "yourOrder": "O seu pedido", "review": "Rever", "add": "Adicionar", "out": "Esgotado hoje", "ranOut": "esgotou hoje", "here": "Para comer aqui", "togo": "Para levar", "yourName": "O seu nome", "send": "Enviar para a cozinha", "paySoon": "Paga no balcão quando for buscar.", "total": "Total", "back": "Voltar", "close": "Fechar", "remove": "Remover", "empty": "Ainda nada. Toque num prato.", "nameNeeded": "Escreva o seu nome para sabermos de quem é.", "closedAfter": "Os pedidos online estão fechados por hoje. Passe por cá até às 14:30, ou veja o cardápio.", "closedNow": "Estamos fechados neste momento. O cardápio está aqui para ver.", "paused": "Os pedidos online estão em pausa. Passe pelo balcão.", "gone": "Algo do seu pedido acabou de esgotar. Reveja e tente de novo.", "many": "Já há vários pedidos à espera. Passe pelo balcão.", "fail": "Não foi possível enviar. Tente de novo.", "yourOrderAt": "O seu pedido na Josie’s", "making": "A preparar", "pickedUp": "Levantado", "cancelled": "Cancelado no balcão", "addSomething": "+ Adicionar algo", "kitchenNow": "A cozinha da Josie’s, agora", "barNow": "No bar", "payPickup": "Paga ao levantar", "gate": "Entre pelo portãozinho, debaixo da placa rosa.", "newOrder": "Pedir outra coisa", "no": "SEM", "core": "é o prato", "vegan": "Vegano", "h1": "Toque no cardápio no mapa", "h2": "Toque num prato para ver o que leva", "h3": "Toque num ingrediente para o tirar, ou num botão de dieta para ver o que muda", "h4": "Toque em Adicionar e depois em Rever. Escreva o seu nome e escolha Para comer aqui ou Para levar", "h5": "Envie e veja como o preparam. Paga no balcão ao levantar", "addingTo": "A adicionar ao seu pedido", "sendAdd": "Adicionar ao meu pedido", "tapIngredient": "Toque num ingrediente para o tirar.", "meatDairy": "Leva carne e laticínios juntos, não é kosher.", "mon": "Seg", "sat": "Sáb", "dishIs": "é a base deste prato. Pode adicioná-lo na mesma.", "bar": "Bar", "kitchen": "Cozinha", "bayMap": "Baía de Utila", "cafeMap": "Josie’s"},
    'nb': {"open": "Åpent", "openTill": "Åpent · til", "closed": "Stengt", "justMenu": "Bare menyen", "lang": "Språk", "help": "Slik fungerer det", "yourOrder": "Din bestilling", "review": "Se over", "add": "Legg til", "out": "Utsolgt i dag", "ranOut": "tok slutt i dag", "here": "Spise her", "togo": "Ta med", "yourName": "Ditt navn", "send": "Send til kjøkkenet", "paySoon": "Du betaler i disken når du henter.", "total": "Totalt", "back": "Tilbake", "close": "Lukk", "remove": "Fjern", "empty": "Ingenting ennå. Trykk på en rett.", "nameNeeded": "Skriv navnet ditt, så vet vi hvem den er til.", "closedAfter": "Nettbestillinger er stengt for i dag. Kom innom til 14.30, eller se på menyen.", "closedNow": "Vi har stengt akkurat nå. Menyen kan du se på her.", "paused": "Nettbestillinger er satt på pause. Kom innom disken.", "gone": "Noe i bestillingen din tok akkurat slutt. Se over og prøv igjen.", "many": "Det venter allerede noen bestillinger. Kom innom disken.", "fail": "Det gikk ikke. Prøv igjen.", "yourOrderAt": "Din bestilling hos Josie’s", "making": "Lages nå", "pickedUp": "Hentet", "cancelled": "Kansellert i disken", "addSomething": "+ Legg til noe", "kitchenNow": "Josie’s kjøkken, akkurat nå", "barNow": "I baren", "payPickup": "Betal når du henter", "gate": "Kom inn gjennom den lille porten, under det rosa skiltet.", "newOrder": "Bestill noe annet", "no": "UTEN", "core": "er retten", "vegan": "Vegansk", "h1": "Trykk på menytavlen på kartet", "h2": "Trykk på en rett for å se hva som er i", "h3": "Trykk på en ingrediens for å ta den bort, eller en kostknapp for å se hva som endres", "h4": "Trykk Legg til, så Se over. Skriv navnet ditt og velg Spise her eller Ta med", "h5": "Send den og se den bli laget. Betal i disken når du henter", "addingTo": "Legger til i bestillingen din", "sendAdd": "Legg til i bestillingen min", "tapIngredient": "Trykk på en ingrediens for å ta den bort.", "meatDairy": "Denne har kjøtt og meieri sammen, det er ikke kosher.", "mon": "Man", "sat": "Lør", "dishIs": "er det retten er bygget på. Du kan legge den til likevel.", "bar": "Bar", "kitchen": "Kjøkken", "bayMap": "Utila-bukta", "cafeMap": "Josie’s"},
    'ga': {"open": "Oscailte", "openTill": "Oscailte · go dtí", "closed": "Dúnta", "justMenu": "An biachlár amháin", "lang": "Teanga", "help": "Conas a oibríonn sé", "yourOrder": "Do chuid ordaithe", "review": "Athbhreithnigh", "add": "Cuir leis", "out": "Díolta amach inniu", "ranOut": "a bhí díolta amach inniu", "here": "Anseo", "togo": "Le tabhairt leat", "yourName": "D’ainm", "send": "Seol chuig an gcistin", "paySoon": "Íoc ag an gcuntar nuair a thógann tú é.", "total": "Iomlán", "back": "Ar ais", "close": "Dún", "remove": "Bain", "empty": "Faic fós. Tapáil mias.", "nameNeeded": "Cuir d’ainm leis le go mbeidh a fhios againn cé leis é.", "closedAfter": "Tá ordaithe ar líne dúnta don lá inniu. Tar chugainn go dtí 2:30, nó féach ar an mbiachlár.", "closedNow": "Táimid dúnta anois. Tá an biachlár anseo le breathnú air.", "paused": "Tá ordaithe ar líne ar sos. Tar chuig an gcuntar.", "gone": "Tá rud éigin i d’ordú díolta amach díreach anois. Seiceáil é agus bain triail eile as.", "many": "Tá roinnt ordaithe ag fanacht cheana féin. Tar chuig an gcuntar.", "fail": "Níor éirigh leis sin. Bain triail eile as.", "yourOrderAt": "Do chuid ordaithe ag Josie’s", "making": "Á dhéanamh", "pickedUp": "Tógtha", "cancelled": "Cealaithe ag an gcuntar", "addSomething": "+ Cuir rud éigin leis", "kitchenNow": "Cistin Josie’s, anois", "barNow": "Ag an mbarra", "payPickup": "Íoc nuair a thógann tú é", "gate": "Tar isteach ag an ngeata beag, faoin chomhartha bándearg.", "newOrder": "Ordaigh rud éigin eile", "no": "GAN", "core": "an mhias féin", "vegan": "Vegan", "h1": "Tapáil an clár biachláir ar an léarscáil", "h2": "Tapáil mias le feiceáil céard atá ann", "h3": "Tapáil comhábhar chun é a fhágáil amach, nó cnaipe réime chun a athraíonn a fheiceáil", "h4": "Tapáil Cuir leis, ansin Athbhreithnigh. Clóscríobh d’ainm agus roghnaigh Anseo nó Le tabhairt leat", "h5": "Seol é agus féach á dhéanamh. Íoc ag an gcuntar nuair a thógann tú é", "addingTo": "Ag cur le d’ordú", "sendAdd": "Cuir le m’ordú", "tapIngredient": "Tapáil comhábhar chun é a fhágáil amach.", "meatDairy": "Tá feoil agus déiríocht le chéile sa mhias seo, ní kosher é.", "mon": "Luan", "sat": "Sath", "dishIs": "an bonn atá faoin mias seo. Is féidir leat é a chur leis ar aon nós.", "bar": "Barra", "kitchen": "Cistin", "bayMap": "Bá Utila", "cafeMap": "Josie’s"},
    'he': {"open": "פתוח", "openTill": "פתוח · עד", "closed": "סגור", "justMenu": "רק התפריט", "lang": "שפה", "help": "איך זה עובד", "yourOrder": "ההזמנה שלך", "review": "סקירה", "add": "הוספה", "out": "אזל היום", "ranOut": "אזל היום", "here": "לשבת כאן", "togo": "לקחת", "yourName": "השם שלך", "send": "שליחה למטבח", "paySoon": "משלמים בדלפק כשאוספים.", "total": "סה״כ", "back": "חזרה", "close": "סגירה", "remove": "הסרה", "empty": "עדיין כלום. הקש על מנה.", "nameNeeded": "הוסיפו את שמכם כדי שנדע של מי זה.", "closedAfter": "הזמנות אונליין סגורות להיום. בואו אלינו עד 14:30, או הציצו בתפריט.", "closedNow": "אנחנו סגורים כרגע. אפשר להסתכל בתפריט.", "paused": "הזמנות אונליין מושהות. בואו לדלפק.", "gone": "משהו בהזמנה שלך הרגע אזל. עברו עליה ונסו שוב.", "many": "כבר יש כמה הזמנות שממתינות. בואו לדלפק.", "fail": "זה לא עבר. נסו שוב.", "yourOrderAt": "ההזמנה שלך ב־Josie’s", "making": "בהכנה", "pickedUp": "נאסף", "cancelled": "בוטל בדלפק", "addSomething": "+ להוסיף משהו", "kitchenNow": "המטבח של Josie’s, עכשיו", "barNow": "בבר", "payPickup": "משלמים באיסוף", "gate": "היכנסו דרך השער הקטן, מתחת לשלט הוורוד.", "newOrder": "להזמין עוד משהו", "no": "בלי", "core": "זו המנה עצמה", "vegan": "טבעוני", "h1": "הקש על לוח התפריט במפה", "h2": "הקש על מנה כדי לראות מה יש בה", "h3": "הקש על רכיב כדי להוריד אותו, או על כפתור תזונה כדי לראות מה משתנה", "h4": "הקש על הוספה ואז סקירה. הקלידו שם ובחרו לשבת כאן או לקחת", "h5": "שלחו וצפו איך מכינים. משלמים בדלפק באיסוף", "addingTo": "מוסיפים להזמנה שלך", "sendAdd": "להוסיף להזמנה שלי", "tapIngredient": "הקש על רכיב כדי להוריד אותו.", "meatDairy": "יש כאן בשר וחלב יחד, וזה לא כשר.", "mon": "ב׳", "sat": "ש׳", "dishIs": "זה הבסיס של המנה. אפשר להוסיף אותו בכל זאת.", "bar": "בר", "kitchen": "מטבח", "bayMap": "מפרץ אוטילה", "cafeMap": "Josie’s"}
  };
  var DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  var W = { lang: JC.get('w.lang', /^es/i.test(w.navigator.language || '') ? 'es' : 'en'), data: null, cat: 'star', sel: null, cart: JC.get('w.cart', []), diets: {}, off: {}, type: JC.get('w.type', 'here'),
    name: JC.get('w.name', ''), order: JC.get('w.order', null), status: null, sheet: null, err: '', busy: false, adding: false, qty: 1 };
  var app = d.getElementById('app');

  STR['nl-BE'] = STR.nl;
  function s(k) { return (STR[W.lang] || STR.en)[k] || STR.en[k] || k; }
  function esc(x) { return JC.esc(x === null || x === undefined ? '' : String(x)); }
  function save() { JC.set('w.cart', W.cart); JC.set('w.type', W.type); JC.set('w.name', W.name); JC.set('w.lang', W.lang); }
  function ico(icon, size) { if (!icon || !ART) { return ''; } var p = icon.split(':'); return ART.svg(p[0] === 'menu' ? 'menu' : 'ing', p[1], size); }
  function dishIco(it, size) { return ART ? ART.svg('menu', T.dishKey(it.en, ''), size) : ''; }
  function money(n) { return JC.money(n, 'L'); }
  function item(id) { var l = W.data ? W.data.items : [], i; for (i = 0; i < l.length; i++) { if (l[i].id === id) { return l[i]; } } return null; }
  function gate() { return W.data ? W.data.gate : null; }

  /* ── hours (Honduras time, UTC-6) ── */
  function hn() { return new Date(Date.now() - 6 * 3600 * 1000); }
  function fmt(t) { var p = String(t).split(':'), h = Number(p[0]), m = p[1] || '00'; return (h % 12 || 12) + ':' + m; }
  function today() {
    var hrs = W.data && W.data.hours || {}, k = DAYS[hn().getUTCDay()], v = hrs[k] || '6:15-14:30', p = String(v).split('-');
    return { open: p[0], close: p[1] || '14:30' };
  }

  /* ── what a guest's choices turn into: NO / swap chips ── */
  function marks() {
    if (W.marks) { return W.marks; }
    var m = {}, l = W.data.marks, i; for (i = 0; i < l.length; i++) { m[l[i].diet + '|' + l[i].ing] = l[i].mark; } return (W.marks = m);
  }
  function defSwap(el, diet) { var l = W.data.swaps, i; for (i = 0; i < l.length; i++) { if (l[i].el === el && l[i].diet === diet && l[i].def && l[i].ok) { return l[i]; } } return null; }
  function chipsFor(it) {
    var chips = [], warns = [], i, g, k, dk, removed = {}, mk = marks(), dl = W.data.diets, sw, active = [];
    for (k = 0; k < dl.length; k++) { if (W.diets[dl[k].key]) { active.push(dl[k]); } }
    for (i = 0; i < it.ing.length; i++) {
      g = it.ing[i]; var hit = false;
      for (k = 0; k < active.length; k++) {
        dk = active[k];
        if (mk[dk.key + '|' + g.id] === 'no') {
          if (g.core) { warns.push(g.name + ' ' + s('dishIs')); continue; }
          sw = defSwap(g.id, dk.key);
          if (sw) { chips.push({ type: 'swap', ingredient_id: g.id, with_id: sw.alt, diet: dk.key, name: g.name, icon: g.icon, wname: sw.name, wicon: sw.icon }); removed[g.id] = 1; hit = true; break; }
          chips.push({ type: 'no', ingredient_id: g.id, diet: dk.key, name: g.name, icon: g.icon }); removed[g.id] = 1; hit = true; break;
        }
      }
      if (!hit && !g.core && (W.off[g.id] || g.out)) { chips.push({ type: 'no', ingredient_id: g.id, name: g.name, icon: g.icon, out: g.out }); removed[g.id] = 1; }
    }
    if (W.diets.kosher_style) {
      var meat = false, dairy = false;
      for (i = 0; i < it.ing.length; i++) { if (!removed[it.ing[i].id]) { meat = meat || it.ing[i].meat; dairy = dairy || it.ing[i].dairy; } }
      if (meat && dairy) { warns.push(s('meatDairy')); }
    }
    return { chips: chips, warns: warns, removed: removed };
  }
  function chipsHtml(chips) {
    var h = '', i, c;
    for (i = 0; i < chips.length; i++) {
      c = chips[i];
      h += '<span class="chip' + (c.type === 'add' ? ' add' : '') + '">' + (c.type === 'swap' ? esc(c.name.toLowerCase()) + ' → ' + esc((c.wname || '').toLowerCase()) : s('no') + ' ' + esc(c.name.toLowerCase())) + '</span>';
    }
    return h;
  }
  function wireChips(chips) { var o = [], i; for (i = 0; i < chips.length; i++) { o.push({ type: chips[i].type, ingredient_id: chips[i].ingredient_id, with_id: chips[i].with_id || null, diet: chips[i].diet || null }); } return o; }

  /* ── cart ── */
  function cartTotal() { var t = 0, i, it; for (i = 0; i < W.cart.length; i++) { it = item(W.cart[i].item_id); if (it) { t += (it.price + (W.type === 'togo' ? it.togo : 0)) * W.cart[i].qty; } } return t; }
  function cartCount() { var n = 0, i; for (i = 0; i < W.cart.length; i++) { n += W.cart[i].qty; } return n; }
  function addToCart() {
    var it = item(W.sel); if (!it || it.out) { return; }
    var c = chipsFor(it), wc = wireChips(c.chips), sig = it.id + JSON.stringify(wc), i;
    for (i = 0; i < W.cart.length; i++) { if (W.cart[i].sig === sig) { W.cart[i].qty += 1; save(); return; } }
    W.cart.push({ sig: sig, item_id: it.id, qty: 1, chips: wc, disp: c.chips }); save();
  }

  /* ── map ── */
  var phone = function () { return w.innerWidth < 700; };
  function mapBox(extra) {
    var bw = Math.min(w.innerWidth, 1440), ph = phone(), sc = ph ? bw / 800 : bw / 1440, ox = ph ? -100 * sc : 0, hh = Math.round((ph ? 660 : 745) * sc);
    return { sc: sc, ox: ox, h: hh };
  }
  function homeMap() {
    var b = mapBox(), t = today(), gt = gate(), closedNow = gt === 'closed_now', tr = 'translate(' + b.ox + 'px,0) scale(' + b.sc + ')';
    var h = '<div class="wmap" style="height:' + b.h + 'px"><div class="wlayer" style="-webkit-transform:' + tr + ';transform:' + tr + '">';
    if (W.bay) { h += w.J2BAY.layer(); }
    else {
      h += '<div class="mimg"></div>' + (w.J2CRIT ? w.J2CRIT.cafe() + w.J2CRIT.stand() : '') + '<div class="hours" style="left:46px;top:296px"><span class="tag' + (closedNow ? ' closed' : '') + '">' + esc(closedNow ? s('closed') : 'OPEN') + '</span><b>' + fmt(t.open) + ' – ' + fmt(t.close) + '</b><small>' + s('mon') + ' – ' + s('sat') + '</small></div>' +
        '<button type="button" class="hit glow" data-act="toMenu" style="left:476px;top:144px;width:74px;height:128px" aria-label="Menu"></button>';
    }
    h += (!W.bay && w.J2CRIT ? w.J2CRIT.hits() : '') + '<button type="button" class="hit" data-act="hours" style="left:' + (W.bay ? w.J2BAY.sign[0] : 114) + 'px;top:' + (W.bay ? w.J2BAY.sign[1] : 92) + 'px;width:132px;height:162px" aria-label="Hours"></button></div>' +
      '<button type="button" class="winset" data-act="bayFlip" aria-label="' + esc(s(W.bay ? 'cafeMap' : 'bayMap')) + '">' + (W.bay ? '<span class="winsetimg"></span>' : w.J2BAY.thumb()) + '<span class="cap">' + esc(s(W.bay ? 'cafeMap' : 'bayMap')) + '</span></button>';
    if (W.cart.length) { h += '<div class="cartpill"><span><small>' + esc(s('yourOrder')) + ' · ' + cartCount() + '</small><b>' + money(cartTotal()) + '</b></span><button type="button" class="go" data-act="review">' + esc(s('review')) + '</button></div>'; }
    return h + '</div>';
  }

  /* ── menu ── */
  function catIcon(c) { var m = { 'Hot coffee': 'hot-coffee', 'Iced coffee': 'iced-coffee', 'Smoothies': 'smoothie', 'Juice, water and soda': 'juice', 'Breakfast': 'full-plate', 'Bagel sandwiches': 'bagel', 'Lunch': 'sandwich' }; return ART.svg('menu', m[c.en] || 'full-plate', 36); }
  function menuPanel() {
    var D = W.data, h = '<div class="mpanel" id="menu"><div class="cats"><button type="button" class="cat' + (W.cat === 'star' ? ' on' : '') + '" data-act="cat" data-arg="star" aria-label="Favorites"><span style="color:#E9A93A;font-size:28px">★</span></button>', i, it, list;
    for (i = 0; i < D.categories.length; i++) { h += '<button type="button" class="cat' + (W.cat === D.categories[i].id ? ' on' : '') + '" data-act="cat" data-arg="' + D.categories[i].id + '" aria-label="' + esc(D.categories[i].name) + '">' + catIcon(D.categories[i]) + '</button>'; }
    h += '</div>';
    list = [];
    for (i = 0; i < D.items.length; i++) { it = D.items[i]; if (W.cat === 'star' ? it.starred : it.category_id === W.cat) { list.push(it); } }
    for (i = 0; i < list.length; i++) {
      it = list[i];
      h += '<button type="button" class="mrow' + (W.sel === it.id ? ' sel' : '') + (it.out ? ' out' : '') + '" data-act="pick" data-arg="' + it.id + '"><span class="mico">' + dishIco(it, 40) + (it.starred ? '<i class="mstar">★</i>' : '') + '</span><span class="mnm">' + esc(it.name) + (it.out ? '<small>' + esc(s('out')) + '</small>' : '') + '</span><span class="mpr">' + money(it.price) + '</span></button>';
    }
    return h + '</div>';
  }
  function dishCard() {
    var it = item(W.sel), D = W.data, i, g, c, h, gt = gate();
    if (!it) { return ''; }
    c = chipsFor(it);
    h = '<div class="dcard' + (phone() ? ' modal' : '') + '" id="dcard"><div class="dhead"><span class="mico">' + dishIco(it, 40) + '</span><h2>' + esc(it.name) + '</h2><span class="mpr">' + money(it.price) + '</span></div>';
    if (it.description) { h += '<p class="hint" style="margin:0 0 6px">' + esc(it.description) + '</p>'; }
    for (i = 0; i < it.ing.length; i++) {
      g = it.ing[i];
      h += '<button type="button" class="ing' + (c.removed[g.id] ? ' off' : '') + '"' + (g.core ? ' disabled' : ' data-act="toggleIng" data-arg="' + g.id + '"') + '><span class="ic">' + ico(g.icon, 54) + '</span><span class="nm">' + esc(g.name) + (g.out ? '<small>' + esc(s('ranOut')) + '</small>' : '') + '</span></button>';
    }
    if (D.diets.length) {
      h += '<div class="diets">';
      for (i = 0; i < D.diets.length; i++) { h += '<button type="button" class="dt' + (W.diets[D.diets[i].key] ? ' on' : '') + '" data-act="diet" data-arg="' + D.diets[i].key + '">' + esc(D.diets[i].name) + '</button>'; }
      h += '</div>';
    }
    for (i = 0; i < c.warns.length; i++) { h += '<div class="warn">' + esc(c.warns[i]) + '</div>'; }
    if (c.chips.length) { h += '<div>' + chipsHtml(c.chips) + '</div>'; }
    h += '<div class="spacer"></div>';
    if (it.out) { h += '<button type="button" class="big" disabled>' + esc(s('out')) + '</button>'; }
    else if (gt) { h += '<p class="hint">' + esc(gateMsg(gt)) + '</p>'; }
    else { h += '<button type="button" class="big" data-act="addDish">' + esc(s('add')) + ' · ' + money(it.price) + '</button>'; }
    return h + '<button type="button" class="big ghost phoneonly" data-act="unpick">' + esc(s('close')) + '</button></div>';
  }
  function gateMsg(g) { return g === 'after_cutoff' ? s('closedAfter') : g === 'closed_now' ? s('closedNow') : s('paused'); }

  /* ── pages ── */
  function top() {
    var t = today(), gt = gate();
    return '<header class="wtop"><span class="brand"><img src="/img/josies-wordmark.png" alt="Josie’s" width="63" height="39"></span><span class="pill' + (gt === 'closed_now' ? ' closed' : '') + '">' + esc(gt === 'closed_now' ? s('closed') : s('openTill') + ' ' + fmt(t.close) + ' pm') + '</span>' +
      (phone() ? '' : '<button type="button" class="tlink" data-act="toMenu">' + esc(s('justMenu')) + '</button>') +
      '<button type="button" class="lbtn" data-act="langs">🌐 ' + esc(W.lang.toUpperCase()) + '</button><button type="button" class="qbtn" data-act="helpOpen" aria-label="' + esc(s('help')) + '">?</button></header>';
  }
  function home() {
    var h = top() + homeMap(), gt = gate();
    if (gt) { h += '<div class="closedbox">' + esc(gateMsg(gt)) + '</div>'; }
    if (W.adding) { h += '<div class="closedbox">' + esc(s('addingTo')) + (W.order ? ' · ' + esc(W.order.name) : '') + '</div>'; }
    h += '<div class="menu">' + menuPanel() + (W.sel ? dishCard() : '') + '</div>';
    return h;
  }
  function stateOf() { return W.status ? W.status.state : 'making'; }
  function sceneHtml(kind, label, name) {
    var ph = w.innerWidth, bw = Math.min(ph - 28, 460), r = kind === 'kitchen' ? { x: 1090, y: 60, w: 350 } : { x: 520, y: 20, w: 390 }, sc = bw / r.w;
    return '<div class="scene" style="width:' + bw + 'px"><div class="layer" style="-webkit-transform:translate(' + (-r.x * sc) + 'px,' + (-r.y * sc) + 'px) scale(' + sc + ');transform:translate(' + (-r.x * sc) + 'px,' + (-r.y * sc) + 'px) scale(' + sc + ')"><div class="mimg" style="background:url(../img/world/map.png?v=2) 0 0 / 1440px 1240px no-repeat;width:1440px;height:1240px"></div></div>' +
      (stateOf() === 'making' ? '<span class="bub" style="left:' + (kind === 'kitchen' ? 20 : 20) + 'px;top:14px">' + esc(name) + '</span>' : '') + '<span class="lbl"><i></i>' + esc(label) + '</span></div>';
  }
  function statusPage() {
    var st = W.status, o = W.order, h = top(), i, it, groups = { bar: [], kitchen: [] }, k, ch;
    h += '<div class="status"><p class="you">' + esc(s('yourOrderAt')) + '</p><h1>' + esc(o.name) + '</h1>';
    if (!st) { return h + '<p class="hint">…</p></div>'; }
    h += '<span class="state' + (st.state === 'picked_up' ? ' done' : '') + '">' + esc(st.state === 'picked_up' ? s('pickedUp') : st.state === 'cancelled' ? s('cancelled') : s('making')) + '</span>';
    for (i = 0; i < st.items.length; i++) { groups[st.items[i].station === 'bar' ? 'bar' : 'kitchen'].push(st.items[i]); }
    var order = ['kitchen', 'bar'];
    for (k = 0; k < order.length; k++) {
      if (!groups[order[k]].length) { continue; }
      h += sceneHtml(order[k], order[k] === 'kitchen' ? s('kitchenNow') : s('barNow'), o.name) + '<div class="card"><div class="st">' + esc(order[k] === 'kitchen' ? s('kitchen') : s('bar')) + '</div>';
      for (i = 0; i < groups[order[k]].length; i++) {
        it = groups[order[k]][i]; ch = '';
        var cs = it.chips || [], j; for (j = 0; j < cs.length; j++) { ch += '<span class="chip">' + (cs[j].type === 'swap' ? esc((cs[j].ing || '').toLowerCase()) + ' → ' + esc((cs[j].with || '').toLowerCase()) : s('no') + ' ' + esc((cs[j].ing || '').toLowerCase())) + '</span>'; }
        h += '<div class="cl"><span class="t">' + it.qty + ' × ' + esc(it.name) + (ch ? '<small>' + ch + '</small>' : '') + '</span></div>';
      }
      h += '</div>';
    }
    h += '<div class="card" style="margin-top:12px"><div class="tot"><span>' + esc(st.paid ? s('total') : s('payPickup')) + '</span><span>' + money(st.total) + '</span></div></div>';
    if (st.state === 'making' && st.can_add) { h += '<button type="button" class="big" data-act="addMore" style="margin-top:14px">' + esc(s('addSomething')) + '</button>'; }
    if (st.state !== 'making') { h += '<button type="button" class="big" data-act="newOrder" style="margin-top:14px">' + esc(s('newOrder')) + '</button>'; }
    return h + '<p class="foot">' + esc(s('gate')) + '</p></div>';
  }
  function sheetHtml() {
    var h = '', i;
    if (!W.sheet) { return ''; }
    if (W.sheet === 'langs') {
      h = '<h3>' + esc(s('lang')) + '</h3>'; for (i = 0; i < JC.langs.length; i++) { h += '<button type="button" class="lopt' + (JC.langs[i].code === W.lang ? ' on' : '') + '" data-act="setLang" data-arg="' + JC.langs[i].code + '">' + esc(JC.langs[i].label) + '</button>'; }
    } else if (W.sheet === 'help') { h = '<h3>' + esc(s('help')) + '</h3><ol class="hsteps"><li>' + esc(s('h1')) + '</li><li>' + esc(s('h2')) + '</li><li>' + esc(s('h3')) + '</li><li>' + esc(s('h4')) + '</li><li>' + esc(s('h5')) + '</li></ol><button type="button" class="big" data-act="sheetX">' + esc(s('close')) + '</button>'; }
    else if (W.sheet === 'hours') {
      var t = today(); h = '<h3>Josie’s Cafe</h3><p><b>' + fmt(t.open) + ' – ' + fmt(t.close) + '</b> · ' + esc(s('mon')) + ' – ' + esc(s('sat')) + '<br>Utila, Honduras</p><button type="button" class="big" data-act="sheetX">' + esc(s('close')) + '</button>';
    } else if (W.sheet === 'review') {
      h = '<h3>' + esc(s('yourOrder')) + '</h3>';
      if (!W.adding) { h += '<div class="seg"><button type="button" class="' + (W.type === 'here' ? 'on' : '') + '" data-act="type" data-arg="here">' + esc(s('here')) + '</button><button type="button" class="' + (W.type === 'togo' ? 'on' : '') + '" data-act="type" data-arg="togo">' + esc(s('togo')) + '</button></div><input class="nm-in" id="gname" maxlength="30" placeholder="' + esc(s('yourName')) + '" value="' + esc(W.name) + '" autocomplete="given-name">'; }
      for (i = 0; i < W.cart.length; i++) {
        var l = W.cart[i], it = item(l.item_id); if (!it) { continue; }
        h += '<div class="cl"><span class="t">' + esc(it.name) + (l.disp && l.disp.length ? '<small>' + chipsHtml(l.disp) + '</small>' : '') + '</span><span class="stp"><button type="button" data-act="qty" data-arg="' + i + ':-1">−</button><b>' + l.qty + '</b><button type="button" data-act="qty" data-arg="' + i + ':1">+</button></span><b>' + money((it.price + (W.type === 'togo' && !W.adding ? it.togo : 0)) * l.qty) + '</b></div>';
      }
      if (!W.cart.length) { h += '<p class="hint">' + esc(s('empty')) + '</p>'; }
      h += '<div class="tot"><span>' + esc(s('total')) + '</span><span>' + money(cartTotal()) + '</span></div><p class="hint">' + esc(s('paySoon')) + '</p>' + (W.err ? '<p class="err">' + esc(W.err) + '</p>' : '') +
        '<button type="button" class="big" data-act="send"' + (!W.cart.length || W.busy ? ' disabled' : '') + '>' + esc(W.adding ? s('sendAdd') : s('send')) + '</button><button type="button" class="big ghost" data-act="sheetX">' + esc(s('back')) + '</button>';
    }
    return '<div class="scrim" data-act="scrim"><div class="sheet">' + h + '</div></div>';
  }
  function paint() {
    d.documentElement.lang = W.lang; d.documentElement.dir = W.lang === 'he' ? 'rtl' : 'ltr';
    var focus = d.activeElement && d.activeElement.id, val = focus === 'gname' ? d.getElementById('gname').value : null;
    if (!W.data) { app.innerHTML = top() + '<p class="hint" style="margin-top:40px">…</p>'; return; }
    app.innerHTML = (W.order && !W.adding && W.view !== 'menu' ? statusPage() : home()) + sheetHtml();
    if (val !== null && d.getElementById('gname')) { var el = d.getElementById('gname'); el.value = val; el.focus(); }
  }

  /* ── data ── */
  function load(cb) {
    JC.rest('POST', 'rpc/site_catalog', { p_lang: W.lang }, null, function (err, data) {
      if (!err && data) { W.data = data; W.marks = null; JC.set('w.catalog', data); if (W.cat !== 'star' && !hasCat(W.cat)) { W.cat = 'star'; } if (W.cat === 'star' && !hasStar()) { W.cat = data.categories.length ? data.categories[0].id : 'star'; } }
      else if (!W.data) { W.data = JC.get('w.catalog', null); }
      if (cb) { cb(); } paint();
    });
  }
  function hasCat(id) { var l = W.data.categories, i; for (i = 0; i < l.length; i++) { if (l[i].id === id) { return true; } } return false; }
  function hasStar() { var l = W.data.items, i; for (i = 0; i < l.length; i++) { if (l[i].starred) { return true; } } return false; }
  function pollStatus() {
    if (!W.order) { return; }
    JC.rest('POST', 'rpc/order_status2', { p_id: W.order.id, p_lang: W.lang }, null, function (err, data) {
      if (err || !data) { return; }
      W.status = data; if (!W.adding && W.view !== 'menu') { paint(); }
    });
  }
  function errMsg(e) {
    var m = String(e && (e.message || e.hint || JSON.stringify(e)) || '');
    if (/after_cutoff/.test(m)) { return s('closedAfter'); } if (/closed_now/.test(m)) { return s('closedNow'); } if (/orders_paused/.test(m)) { return s('paused'); }
    if (/item_unavailable/.test(m)) { return s('gone'); } if (/too_many|limit/.test(m)) { return s('many'); } return s('fail');
  }
  function send() {
    var lines = [], i; if (W.busy || !W.cart.length) { return; }
    var nameEl = d.getElementById('gname'); if (nameEl) { W.name = nameEl.value; }
    if (!W.adding && !(W.name || '').replace(/\s/g, '')) { W.err = s('nameNeeded'); paint(); return; }
    for (i = 0; i < W.cart.length; i++) { lines.push({ item_id: W.cart[i].item_id, qty: W.cart[i].qty, chips: W.cart[i].chips }); }
    W.busy = true; W.err = ''; save(); paint();
    var done = function (err, data) {
      W.busy = false;
      if (err) { W.err = errMsg(err); paint(); load(); return; }
      if (!W.adding) { W.order = { id: W.pendingId, name: W.name }; JC.set('w.order', W.order); }
      W.cart = []; W.sel = null; W.adding = false; W.view = null; W.sheet = null; W.status = null; save(); paint(); pollStatus();
    };
    if (W.adding) { JC.rest('POST', 'rpc/add_to_online_order2', { p: { order_id: W.order.id, lines: lines } }, null, done); }
    else { W.pendingId = W.pendingId || JC.uuid(); JC.rest('POST', 'rpc/place_online_order2', { p: { id: W.pendingId, name: W.name, order_type: W.type, lines: lines } }, null, function (e, r) { done(e, r); if (!e) { W.pendingId = null; } }); }
  }

  /* ── events ── */
  app.addEventListener('click', function (ev) {
    var el = ev.target, act, arg, p, ct = ev.target;
    while (ct && ct !== app) { if (ct.getAttribute && ct.getAttribute('data-crit') && w.J2CRIT) { w.J2CRIT.play(ct.getAttribute('data-crit'), app); return; } ct = ct.parentNode; }
    while (el && el !== app && !(el.getAttribute && el.getAttribute('data-act'))) { el = el.parentNode; }
    if (!el || el === app || el.disabled) { return; }
    act = el.getAttribute('data-act'); arg = el.getAttribute('data-arg');
    if (act === 'scrim' && ev.target !== el) { return; }
    switch (act) {
      case 'toMenu': W.view = 'menu'; paint(); var m = d.getElementById('menu'); if (m && m.scrollIntoView) { m.scrollIntoView({ behavior: 'smooth' }); } break;
      case 'crit': if (w.J2CRIT) { w.J2CRIT.play(arg, app); } break;
      case 'bayFlip': W.bay = !W.bay; paint(); break;
      case 'cat': W.cat = arg; paint(); break;
      case 'pick': W.sel = W.sel === arg ? null : arg; W.diets = {}; W.off = {}; paint(); break;
      case 'unpick': W.sel = null; paint(); break;
      case 'toggleIng': if (W.off[arg]) { delete W.off[arg]; } else { W.off[arg] = 1; } paint(); break;
      case 'diet': if (W.diets[arg]) { delete W.diets[arg]; } else { W.diets[arg] = 1; } paint(); break;
      case 'addDish': addToCart(); W.sel = null; paint(); break;
      case 'review': W.sheet = 'review'; W.err = ''; paint(); break;
      case 'langs': W.sheet = 'langs'; paint(); break;
      case 'helpOpen': W.sheet = 'help'; paint(); break;
      case 'hours': W.sheet = 'hours'; paint(); break;
      case 'sheetX': case 'scrim': W.sheet = null; paint(); break;
      case 'setLang': W.lang = arg; W.sheet = null; save(); load(); pollStatus(); break;
      case 'type': W.type = arg; save(); paint(); break;
      case 'qty': p = arg.split(':'); W.cart[Number(p[0])].qty += Number(p[1]); if (W.cart[Number(p[0])].qty < 1) { W.cart.splice(Number(p[0]), 1); } save(); if (!W.cart.length) { W.sheet = null; } paint(); break;
      case 'send': send(); break;
      case 'addMore': W.adding = true; W.view = 'menu'; paint(); w.scrollTo(0, 0); break;
      case 'newOrder': W.order = null; W.status = null; JC.del('w.order'); W.view = null; paint(); break;
    }
  }, false);
  app.addEventListener('input', function (ev) { if (ev.target.id === 'gname') { W.name = ev.target.value; save(); } }, false);
  w.addEventListener('resize', function () { if (!W.sheet) { paint(); } }, false);
  w.setInterval(function () { if (W.order && !W.sheet) { pollStatus(); } }, 3000);
  w.setInterval(function () { if (!d.hidden && !W.sheet) { load(); } }, 60000);
  paint(); load(function () { if (W.order) { pollStatus(); } });
}(window, document, window.JC));
