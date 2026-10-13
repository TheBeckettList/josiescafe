/* Josie's Cafe — shared helpers for the website and the POS.
   Plain ES5 on purpose: runs on old iPads (iOS 9+) and any browser. */
(function (w) {
  'use strict';

  var JC = {};

  JC.cfg = {
    url: 'https://tuthebxguxvogmiowhcx.supabase.co',
    // Publishable key: safe in the browser; row level security decides what it can see.
    key: 'sb_publishable_s1AMvic8ObAsz8kCXL1EHQ_2b3U3S2O'
  };

  /* ── storage (never throws) ── */
  JC.get = function (k, fallback) {
    try {
      var v = w.localStorage.getItem('jc.' + k);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  };
  JC.set = function (k, v) {
    try { w.localStorage.setItem('jc.' + k, JSON.stringify(v)); return true; } catch (e) { return false; }
  };
  JC.del = function (k) { try { w.localStorage.removeItem('jc.' + k); } catch (e) {} };

  /* ── HTTP ── cb(err, data, status) */
  JC.http = function (method, url, body, headers, cb, timeoutMs) {
    var x = new XMLHttpRequest(), done = false, h;
    function finish(err, data, status) { if (done) { return; } done = true; cb(err, data, status); }
    x.open(method, url, true);
    x.timeout = timeoutMs || 12000;
    for (h in headers) { if (headers.hasOwnProperty(h)) { x.setRequestHeader(h, headers[h]); } }
    x.onreadystatechange = function () {
      if (x.readyState !== 4) { return; }
      var data = null;
      try { data = x.responseText ? JSON.parse(x.responseText) : null; } catch (e) { data = x.responseText; }
      if (x.status >= 200 && x.status < 300) { finish(null, data, x.status); }
      else { finish({ status: x.status, data: data }, data, x.status); }
    };
    x.ontimeout = function () { finish({ status: 0, data: 'timeout' }, null, 0); };
    x.onerror = function () { finish({ status: 0, data: 'network' }, null, 0); };
    x.send(body === undefined || body === null ? null : (typeof body === 'string' ? body : JSON.stringify(body)));
  };

  /* Supabase REST. token = user access token or null (public). */
  JC.rest = function (method, path, body, token, cb, extraHeaders) {
    var headers = { apikey: JC.cfg.key, 'Content-Type': 'application/json' }, k;
    if (token) { headers.Authorization = 'Bearer ' + token; }
    if (extraHeaders) { for (k in extraHeaders) { if (extraHeaders.hasOwnProperty(k)) { headers[k] = extraHeaders[k]; } } }
    JC.http(method, JC.cfg.url + '/rest/v1/' + path, body, headers, cb);
  };
  JC.auth = function (path, body, cb) {
    JC.http('POST', JC.cfg.url + '/auth/v1/' + path, body,
      { apikey: JC.cfg.key, 'Content-Type': 'application/json' }, cb);
  };

  /* ── languages ── */
  JC.langs = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'nl-BE', label: 'Vlaams' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Português (BR)' },
    { code: 'nb', label: 'Norsk' },
    { code: 'he', label: 'עברית' }
  ];
  JC.fallbacks = function (lang) {
    var list = [lang], base = (lang || 'en').split('-')[0];
    if (base !== lang) { list.push(base); }
    if (base === 'no' || base === 'nn') { list.push('nb'); }
    list.push('en');
    return list;
  };
  // Pick the best text from {"en":"...","es":"..."}; never returns blank if any language has text.
  JC.tr = function (obj, lang) {
    if (!obj) { return ''; }
    if (typeof obj === 'string') { return obj; }
    var f = JC.fallbacks(lang), i, k;
    for (i = 0; i < f.length; i++) { if (obj[f[i]]) { return obj[f[i]]; } }
    for (k in obj) { if (obj.hasOwnProperty(k) && obj[k]) { return obj[k]; } }
    return '';
  };

  /* ── money & ids ── */
  JC.round2 = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };
  JC.money = function (n, sym) {
    var v = JC.round2(n), neg = v < 0, s = Math.abs(v).toFixed(2), parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    s = parts[1] === '00' ? parts[0] : parts[0] + '.' + parts[1];
    return (neg ? '-' : '') + (sym === undefined ? 'L ' : sym) + s;
  };
  JC.uuid = function () {
    var b = [], i, h = [];
    if (w.crypto && w.crypto.getRandomValues) {
      var a = new Uint8Array(16); w.crypto.getRandomValues(a);
      for (i = 0; i < 16; i++) { b.push(a[i]); }
    } else {
      for (i = 0; i < 16; i++) { b.push(Math.floor(Math.random() * 256)); }
    }
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    for (i = 0; i < 16; i++) { h.push((b[i] + 0x100).toString(16).substr(1)); }
    return h.slice(0, 4).join('') + '-' + h.slice(4, 6).join('') + '-' + h.slice(6, 8).join('') + '-' +
      h.slice(8, 10).join('') + '-' + h.slice(10, 16).join('');
  };
  JC.today = function () {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  };

  /* Josie's dollar rate: manual override, else bank buy rate minus her fee, rounded down. */
  JC.usdRate = function (settings, fxRows) {
    if (!settings) { return null; }
    if (settings.usd_rate_manual) { return Number(settings.usd_rate_manual); }
    var today = JC.today(), i, row = null;
    for (i = 0; i < (fxRows || []).length; i++) {
      if (fxRows[i].day <= today && (!row || fxRows[i].day > row.day)) { row = fxRows[i]; }
    }
    if (!row) { return null; }
    return Math.floor((Number(row.bank_buy) - Number(settings.usd_fee || 0)) * 100) / 100;
  };
  JC.usdRateDay = function (fxRows) {
    var today = JC.today(), i, best = null;
    for (i = 0; i < (fxRows || []).length; i++) {
      if (fxRows[i].day <= today && (!best || fxRows[i].day > best)) { best = fxRows[i].day; }
    }
    return best;
  };

  JC.esc = function (s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  w.JC = JC;
}(window));
