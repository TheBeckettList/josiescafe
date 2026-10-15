/* Josie's World POS: opens with no internet. App files come from the device at once and refresh in the background.
   Supabase calls are never cached here; the app keeps its own offline copy and queue. Scope: /pos2/ (own cache, separate from /pos/). */
var CACHE = 'josies-pos2-v1';
var SHELL = ['./', './index.html', './manifest.json', './css/pos2.css', './js/strings.js', './js/core.js', './js/engine.js', './js/ui.js', './js/register.js', './js/overview.js', './js/gear.js', './js/manager.js', './js/main.js',
  '../js/api.js', '../art/art.js', '../art/ticketview.js', '../art/ticketview.css', '../img/world/map.png', '../img/logo.png', '../img/icon-180.png', '../img/app-icon-180.png',
  './tickets/', './tickets/index.html', './tickets/tickets2.css', './tickets/tickets2.js'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE && k.indexOf('josies-pos2') === 0; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
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
