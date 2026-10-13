/* Lets the POS open with no internet (iOS 11.3+, Android, desktop).
   App files: served from the device at once, refreshed in the background.
   Supabase calls are never cached here; the app keeps its own offline copy. */
var CACHE = 'josies-pos-v2';
var SHELL = ['./', './index.html', './pos.css', './pos.js', './manifest.json', '../js/api.js', '../img/logo.png', '../img/icon-180.png'];

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
