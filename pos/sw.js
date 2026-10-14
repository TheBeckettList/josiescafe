/* Lets the POS open with no internet (iOS 11.3+, Android, desktop).
   App files: served from the device at once, refreshed in the background.
   Supabase calls are never cached here; the app keeps its own offline copy. */
var CACHE = 'josies-pos-v5';
var SHELL = ['./', './index.html', './pos.css', './pos.js', './manifest.json', '../js/api.js', '../img/logo.png', '../img/icon-180.png', '../img/app-icon-180.png',
  './tickets/', './tickets/index.html', './tickets/tickets.css', './tickets/tickets.js', './tickets/manifest.json'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET') { return; }
  if (url.hostname.indexOf('supabase.co') >= 0) { return; }
  var isFont = url.hostname.indexOf('fonts.g') === 0;
  if (url.origin !== self.location.origin && !isFont) { return; }
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) { cache.put(e.request, res.clone()); }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});

/* Ticket phones: a new ticket arrives as a push message (sent by the kitchen-push function). */
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
      if (list[i].url.indexOf('/pos/tickets/') >= 0 && 'focus' in list[i]) {
        list[i].postMessage({ open: url });
        return list[i].focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
