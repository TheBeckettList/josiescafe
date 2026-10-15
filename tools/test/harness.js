/* Browser test harness: serves the repo, opens pages in headless Chromium, and answers every Supabase request
   from the local test database through shim.js. Use:  var h = await require('./harness').start(); var p = await h.page('/pos2/'); */
'use strict';
var http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
var pw = require('/opt/node22/lib/node_modules/playwright');
var shim = require('./shim');
var ROOT = path.resolve(__dirname, '../..');
var SUPA = /^https:\/\/tuthebxguxvogmiowhcx\.supabase\.co/;
var TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.gz': 'application/gzip', '.data': 'application/octet-stream' };

exports.reset = function () {
  var r = shim.psql("delete from payments; delete from order_items; delete from order_pieces; delete from ticket_alerts; delete from orders; " +
    "update sticks set state='home', table_id=null; update ingredients set light='green'; update items set available=true; " +
    "update settings set closed_until=null, online_orders=true, online_cutoff='23:59';");
  if (!r.ok) { throw new Error('reset failed: ' + r.err); }
};
exports.start = async function (opts) {
  opts = opts || {};
  if (opts.reset !== false) { exports.reset(); }
  var server = http.createServer(function (req, res) {
    var p = decodeURIComponent(url.parse(req.url).pathname);
    if (p.slice(-1) === '/') { p += 'index.html'; }
    var f = path.join(ROOT, p);
    if (f.indexOf(ROOT) !== 0) { res.writeHead(403); res.end(); return; }
    fs.readFile(f, function (e, d) {
      if (e) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(d);
    });
  });
  await new Promise(function (ok) { server.listen(0, ok); });
  var port = server.address().port;
  var browser = await pw.chromium.launch();
  var log = [];
  var h = {
    port: port, log: log, browser: browser,
    base: 'http://localhost:' + port,
    page: async function (p, o) {
      o = o || {};
      var ctx = await browser.newContext({ viewport: o.viewport || { width: 1024, height: 768 }, deviceScaleFactor: o.dpr || 1, hasTouch: !!o.touch, isMobile: !!o.mobile });
      // fonts come from Google; keep tests offline-safe
      await ctx.route(/fonts\.(googleapis|gstatic)\.com/, function (r) { r.fulfill({ status: 200, contentType: 'text/css', body: '' }); });
      await ctx.route(SUPA, async function (route) {
        var req = route.request(), u = url.parse(req.url(), true), body = null;
        try { body = req.postData() ? JSON.parse(req.postData()) : null; } catch (e) { body = null; }
        var authed = !!(req.headers()['authorization'] && /Bearer test-/.test(req.headers()['authorization']));
        if (opts.offline && opts.offline()) { return route.abort('internetdisconnected'); }
        var out = shim.handle(req.method(), u.pathname, u.query, body, authed);
        log.push([req.method(), u.pathname, out.status].join(' '));
        await route.fulfill({ status: out.status, contentType: 'application/json', body: out.json === null ? '' : JSON.stringify(out.json),
          headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
      });
      var page = await ctx.newPage();
      page.errors = [];
      page.on('pageerror', function (e) { page.errors.push('pageerror: ' + e.message); });
      page.on('console', function (m) { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) { page.errors.push('console: ' + m.text().slice(0, 200)); } });
      if (o.init) { await page.addInitScript(o.init); }
      await page.goto('http://localhost:' + port + p);
      return page;
    },
    stop: async function () { await browser.close(); server.close(); }
  };
  return h;
};
