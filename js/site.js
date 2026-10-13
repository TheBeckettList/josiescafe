/* josiescafe.com — home + menu. ES5. */
(function (w, d, JC) {
  'use strict';

  var T = {
    en: { tagline: 'Coffee · Breakfast · Lunch', menu: 'Menu', hours: 'Hours', open: 'Open now', closed: 'Closed now',
      prices: 'Prices in lempiras (L). We take US dollars and cards too.', soldout: 'Sold out',
      counter: 'Order at the counter. Online ordering is coming soon.', find: 'Find us', closedDay: 'Closed',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], loading: 'Loading the menu…',
      error: 'The menu couldn’t load. Please try again in a moment.', lang: 'Language', map: 'Open in Maps' },
    es: { tagline: 'Café · Desayuno · Almuerzo', menu: 'Menú', hours: 'Horario', open: 'Abierto ahora', closed: 'Cerrado ahora',
      prices: 'Precios en lempiras (L). También aceptamos dólares y tarjetas.', soldout: 'Agotado',
      counter: 'Pide en el mostrador. Pronto podrás pedir en línea.', find: 'Dónde estamos', closedDay: 'Cerrado',
      days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], loading: 'Cargando el menú…',
      error: 'No se pudo cargar el menú. Intenta de nuevo en un momento.', lang: 'Idioma', map: 'Abrir en Mapas' },
    fr: { tagline: 'Café · Petit-déjeuner · Déjeuner', menu: 'Menu', hours: 'Horaires', open: 'Ouvert', closed: 'Fermé',
      prices: 'Prix en lempiras (L). Nous acceptons aussi les dollars US et les cartes.', soldout: 'Épuisé',
      counter: 'Commandez au comptoir. La commande en ligne arrive bientôt.', find: 'Nous trouver', closedDay: 'Fermé',
      days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], loading: 'Chargement du menu…',
      error: 'Le menu n’a pas pu se charger. Réessayez dans un instant.', lang: 'Langue', map: 'Ouvrir dans Plans' },
    de: { tagline: 'Kaffee · Frühstück · Mittagessen', menu: 'Speisekarte', hours: 'Öffnungszeiten', open: 'Jetzt geöffnet', closed: 'Jetzt geschlossen',
      prices: 'Preise in Lempira (L). Wir nehmen auch US-Dollar und Karten.', soldout: 'Ausverkauft',
      counter: 'Bestellen Sie an der Theke. Online-Bestellung kommt bald.', find: 'So finden Sie uns', closedDay: 'Geschlossen',
      days: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], loading: 'Speisekarte wird geladen…',
      error: 'Die Speisekarte konnte nicht geladen werden. Bitte gleich noch einmal versuchen.', lang: 'Sprache', map: 'In Karten öffnen' },
    nl: { tagline: 'Koffie · Ontbijt · Lunch', menu: 'Menu', hours: 'Openingstijden', open: 'Nu open', closed: 'Nu gesloten',
      prices: 'Prijzen in lempira (L). We accepteren ook Amerikaanse dollars en kaarten.', soldout: 'Uitverkocht',
      counter: 'Bestel aan de toonbank. Online bestellen komt binnenkort.', find: 'Waar we zijn', closedDay: 'Gesloten',
      days: ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'], loading: 'Menu laden…',
      error: 'Het menu kon niet laden. Probeer het zo opnieuw.', lang: 'Taal', map: 'Openen in Kaarten' },
    it: { tagline: 'Caffè · Colazione · Pranzo', menu: 'Menù', hours: 'Orari', open: 'Aperto ora', closed: 'Chiuso ora',
      prices: 'Prezzi in lempira (L). Accettiamo anche dollari USA e carte.', soldout: 'Esaurito',
      counter: 'Ordina al banco. Presto potrai ordinare online.', find: 'Dove siamo', closedDay: 'Chiuso',
      days: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'], loading: 'Caricamento del menù…',
      error: 'Impossibile caricare il menù. Riprova tra poco.', lang: 'Lingua', map: 'Apri in Mappe' },
    pt: { tagline: 'Café · Café da manhã · Almoço', menu: 'Cardápio', hours: 'Horários', open: 'Aberto agora', closed: 'Fechado agora',
      prices: 'Preços em lempiras (L). Também aceitamos dólares e cartões.', soldout: 'Esgotado',
      counter: 'Peça no balcão. Em breve você poderá pedir online.', find: 'Onde estamos', closedDay: 'Fechado',
      days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], loading: 'Carregando o cardápio…',
      error: 'Não foi possível carregar o cardápio. Tente de novo em instantes.', lang: 'Idioma', map: 'Abrir no Mapas' },
    nb: { tagline: 'Kaffe · Frokost · Lunsj', menu: 'Meny', hours: 'Åpningstider', open: 'Åpent nå', closed: 'Stengt nå',
      prices: 'Priser i lempira (L). Vi tar også amerikanske dollar og kort.', soldout: 'Utsolgt',
      counter: 'Bestill i disken. Nettbestilling kommer snart.', find: 'Finn oss', closedDay: 'Stengt',
      days: ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'], loading: 'Laster menyen…',
      error: 'Menyen kunne ikke lastes. Prøv igjen om litt.', lang: 'Språk', map: 'Åpne i Kart' },
    he: { tagline: 'קפה · ארוחת בוקר · ארוחת צהריים', menu: 'תפריט', hours: 'שעות פתיחה', open: 'פתוח עכשיו', closed: 'סגור עכשיו',
      prices: 'המחירים בלמפירות (L). מקבלים גם דולרים וכרטיסי אשראי.', soldout: 'אזל',
      counter: 'מזמינים בדלפק. הזמנה אונליין בקרוב.', find: 'איפה אנחנו', closedDay: 'סגור',
      days: ['ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳', 'א׳'], loading: 'טוען את התפריט…',
      error: 'לא הצלחנו לטעון את התפריט. נסו שוב בעוד רגע.', lang: 'שפה', map: 'פתיחה במפות' }
  };
  var DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  function pickLang() {
    var m = /[?&]lang=([a-zA-Z\-]+)/.exec(w.location.search), i, nav, codes = [];
    for (i = 0; i < JC.langs.length; i++) { codes.push(JC.langs[i].code); }
    if (m && codes.indexOf(m[1]) >= 0) { JC.set('lang', m[1]); return m[1]; }
    var saved = JC.get('lang', null);
    if (saved && codes.indexOf(saved) >= 0) { return saved; }
    nav = (w.navigator.language || w.navigator.userLanguage || 'en');
    if (nav === 'nl-BE' || nav === 'pt-BR') { return nav === 'pt-BR' ? 'pt' : 'nl-BE'; }
    nav = nav.split('-')[0];
    if (nav === 'no' || nav === 'nn') { nav = 'nb'; }
    if (nav === 'iw') { nav = 'he'; }
    return codes.indexOf(nav) >= 0 ? nav : 'en';
  }

  var lang = pickLang();
  var t = T[lang] || T[lang.split('-')[0]] || T.en;

  function $(id) { return d.getElementById(id); }

  /* Honduras is UTC-6 all year (no daylight saving). */
  function hondurasNow() {
    var n = new Date(), ms = n.getTime() + n.getTimezoneOffset() * 60000 - 6 * 3600000;
    return new Date(ms);
  }
  function parseRange(s) {
    var m = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/.exec(s || '');
    if (!m) { return null; }
    return { from: (+m[1]) * 60 + (+m[2]), to: (+m[3]) * 60 + (+m[4]), text: m[1] + ':' + m[2] + ' – ' + m[3] + ':' + m[4] };
  }

  function renderHours(settings) {
    var hours = (settings && settings.hours) || {}, now = hondurasNow(),
      todayIdx = (now.getDay() + 6) % 7, mins = now.getHours() * 60 + now.getMinutes(),
      r = parseRange(hours[DAY_KEYS[todayIdx]]), isOpen = !!(r && mins >= r.from && mins < r.to),
      rows = '', i, rr;
    $('status').className = 'status ' + (isOpen ? 'is-open' : 'is-closed');
    $('status').innerHTML = '<span class="dot"></span>' + JC.esc(isOpen ? t.open : t.closed);
    for (i = 0; i < 7; i++) {
      rr = parseRange(hours[DAY_KEYS[i]]);
      rows += '<tr' + (i === todayIdx ? ' class="today"' : '') + '><th>' + JC.esc(t.days[i]) + '</th><td>' +
        JC.esc(rr ? rr.text : t.closedDay) + '</td></tr>';
    }
    $('hours').innerHTML = rows;
    if (settings && settings.address) { $('address').innerHTML = JC.esc(settings.address); }
  }

  function renderMenu(data) {
    var cats = data.categories || [], items = data.items || [], rate = JC.usdRate(data.settings, data.fx),
      html = '', nav = '', i, j, c, list, it, name, price;
    for (i = 0; i < cats.length; i++) {
      c = cats[i];
      list = [];
      for (j = 0; j < items.length; j++) { if (items[j].category_id === c.id) { list.push(items[j]); } }
      if (!list.length) { continue; }
      name = JC.tr(c.name, lang);
      nav += '<a href="#c-' + c.id + '">' + JC.esc(name) + '</a>';
      html += '<section class="cat" id="c-' + c.id + '"><h3><span class="swatch" style="background:' +
        JC.esc(c.color || '#F5B5C8') + '"></span>' + JC.esc(name) + '</h3><ul>';
      for (j = 0; j < list.length; j++) {
        it = list[j];
        price = JC.money(it.price);
        html += '<li' + (it.available ? '' : ' class="soldout"') + '><div class="nm"><span>' + JC.esc(JC.tr(it.name, lang)) + '</span>' +
          (JC.tr(it.description, lang) ? '<small>' + JC.esc(JC.tr(it.description, lang)) + '</small>' : '') + '</div>' +
          '<div class="pr">' + (it.available ? '<b>' + price + '</b>' + (rate ? '<small>≈ ' + JC.money(it.price / rate, '$') + '</small>' : '')
            : '<em>' + JC.esc(t.soldout) + '</em>') + '</div></li>';
      }
      html += '</ul></section>';
    }
    $('catnav').innerHTML = nav;
    $('menu-list').innerHTML = html || '<p class="note">' + JC.esc(t.error) + '</p>';
  }

  function load() {
    var data = { categories: null, items: null, settings: null, fx: null }, pending = 4, failed = false;
    function done(err) {
      if (err) { failed = true; }
      pending -= 1;
      if (pending) { return; }
      if (failed) {
        var cached = JC.get('site.menu', null);
        if (cached) { renderHours(cached.settings); renderMenu(cached); }
        else { $('menu-list').innerHTML = '<p class="note">' + JC.esc(t.error) + '</p>'; }
        return;
      }
      JC.set('site.menu', data);
      renderHours(data.settings);
      renderMenu(data);
    }
    JC.rest('GET', 'categories?select=id,name,color,sort&order=sort.asc', null, null, function (e, r) { data.categories = r; done(e); });
    JC.rest('GET', 'items?select=id,category_id,name,description,price,available,sort&order=sort.asc', null, null, function (e, r) { data.items = r; done(e); });
    JC.rest('GET', 'settings?select=hours,address,usd_fee,usd_rate_manual', null, null, function (e, r) { data.settings = r && r[0]; done(e); });
    JC.rest('GET', 'fx_rates?select=day,bank_buy&order=day.desc&limit=7', null, null, function (e, r) { data.fx = r; done(e); });
  }

  function init() {
    var html = d.documentElement, sel = $('lang'), i, o, keys, k;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
    for (i = 0; i < JC.langs.length; i++) {
      o = d.createElement('option');
      o.value = JC.langs[i].code;
      o.appendChild(d.createTextNode(JC.langs[i].label));
      if (JC.langs[i].code === lang) { o.selected = true; }
      sel.appendChild(o);
    }
    sel.onchange = function () { w.location.search = '?lang=' + sel.value; };
    keys = d.querySelectorAll('[data-t]');
    for (i = 0; i < keys.length; i++) { k = keys[i].getAttribute('data-t'); if (t[k]) { keys[i].innerHTML = JC.esc(t[k]); } }
    $('menu-list').innerHTML = '<p class="note">' + JC.esc(t.loading) + '</p>';
    $('year').innerHTML = String(new Date().getFullYear());
    load();
  }

  if (d.readyState === 'loading') { d.addEventListener('DOMContentLoaded', init); } else { init(); }
}(window, document, window.JC));
