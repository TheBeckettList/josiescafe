/* Josie's World POS: opens with no internet. App files come from the device at once and refresh in the background.
   Supabase calls are never cached here; the app keeps its own offline copy and queue. Scope: /pos/. */
var CACHE = 'josies-pos-v9';
var SHELL = ['./', './index.html', './manifest.json', './css/pos2.css', './js/strings.js', './js/core.js', './js/engine.js', './js/ui.js', './js/register.js', './js/overview.js', './js/gear.js', './js/manager.js', './js/main.js',
  '../js/api.js', '../art/art.js', '../art/dishart.js', '../art/ticketview.js', '../art/ticketview.css', '../img/world/map.png', '../img/logo.png', '../img/icon-180.png', '../img/app-icon-180.png',
  './tickets/', './tickets/index.html', './tickets/tickets2.css', './tickets/tickets2.js', './tickets/manifest.json'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE && k.indexOf('josies-pos') === 0; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname.indexOf('supabase.co') >= 0) { return; }
  var isFont = url.hostname.indexOf('fonts.g') === 0;
  if (url.origin !== self.location.origin && !isFont) { return; }
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request).then(function (res) { if (res && (res.ok || res.type === 'opaque')) { cache.put(e.request, res.clone()); } return res; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});

/* Kitchen and bar phones: a new ticket, add-on or stop arrives as a push message (sent by the kitchen-push function). Nothing to tap. */
self.addEventListener('push', function (e) {
  var m = {};
  try { m = e.data ? e.data.json() : {}; } catch (x) { m = { title: "Josie's", body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(m.title || "Josie's", {
    body: m.body || '', tag: m.tag || undefined, renotify: !!m.tag, icon: '/img/app-icon-192.png',
    vibrate: [300, 120, 300, 120, 500], data: { url: m.url || '/pos/tickets/' }
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/pos/tickets/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf('/pos/tickets/') >= 0 && 'focus' in list[i]) { list[i].postMessage({ open: url }); return list[i].focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
