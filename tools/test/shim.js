/* A small stand-in for Supabase's REST layer (PostgREST + auth) in front of the local test database.
   It speaks just enough of the protocol for the apps: GET table?select&order&limit&filters, POST rpc/<fn>, auth token.
   Requests with an Authorization header run as the signed-in device ('authenticated'); without one they run as 'anon'.
   Used by the browser tests (tools/test/*.js). Needs tools/test/setup-db.sh to have run. */
'use strict';
var cp = require('child_process');
var D = '/var/tmp/pgt';

function psql(sql) {
  var r = cp.spawnSync('psql', ['-h', D, '-p', '5499', '-U', 'postgres', '-d', 't', '-q', '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql],
    { encoding: 'utf8', env: Object.assign({}, process.env, { PGOPTIONS: '-c client_min_messages=warning' }), maxBuffer: 64 * 1024 * 1024 });
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}
function q(v) { return "'" + String(v).replace(/'/g, "''") + "'"; }
function ident(s) { if (!/^[a-z_][a-z0-9_]*$/i.test(s)) { throw new Error('bad identifier ' + s); } return '"' + s + '"'; }
function roleSql(authed) {
  return authed ? "set role authenticated; set request.jwt.claims = '{\"email\":\"pos@josiescafe.com\"}'; "
                : "set role anon; set request.jwt.claims = '{}'; ";
}
function pgErr(err) {
  var m = /ERROR:\s+(.*)/.exec(err) || [];
  var msg = (m[1] || err).split('\n')[0];
  var status = /permission denied|not allowed/.test(msg) ? 403 : 400;
  return { status: status, json: { message: msg, code: status === 403 ? '42501' : 'P0001' } };
}

var voidFns = null;
function isVoid(fn) {
  if (!voidFns) {
    var r = psql("select string_agg(proname, ',') from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and prorettype = 'void'::regtype");
    voidFns = (r.out || '').split(',');
  }
  return voidFns.indexOf(fn) >= 0;
}

function selectSql(table, params) {
  var cols = (params.select || '*').split(',').map(function (c) { c = c.trim(); return c === '*' ? '*' : ident(c); }).join(', ');
  var where = [], order = '', limit = '';
  Object.keys(params).forEach(function (k) {
    if (['select', 'order', 'limit', 'offset'].indexOf(k) >= 0) { return; }
    var v = params[k], m = /^(eq|neq|gt|gte|lt|lte|is|in)\.(.*)$/.exec(v);
    if (!m) { return; }
    var op = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' }[m[1]];
    if (m[1] === 'is') { where.push(ident(k) + ' is ' + (m[2] === 'null' ? 'null' : m[2] === 'true' ? 'true' : 'false')); }
    else if (m[1] === 'in') { where.push(ident(k) + ' in (' + m[2].replace(/^\(|\)$/g, '').split(',').map(q).join(',') + ')'); }
    else { where.push(ident(k) + ' ' + op + ' ' + q(m[2])); }
  });
  if (params.order) { order = ' order by ' + params.order.split(',').map(function (o) { var p = o.split('.'); return ident(p[0]) + (p[1] === 'desc' ? ' desc' : ' asc'); }).join(', '); }
  if (params.limit) { limit = ' limit ' + parseInt(params.limit, 10); }
  return "select coalesce(jsonb_agg(t), '[]'::jsonb) from (select " + cols + ' from public.' + ident(table) +
    (where.length ? ' where ' + where.join(' and ') : '') + order + limit + ') t';
}

function rpcSql(fn, body) {
  var args = Object.keys(body || {}).map(function (k) {
    var v = body[k];
    var lit = v === null ? 'null' : (typeof v === 'object') ? q(JSON.stringify(v)) : (typeof v === 'number' || typeof v === 'boolean') ? q(String(v)) : q(v);
    return ident(k) + ' := ' + lit;
  }).join(', ');
  var call = 'public.' + ident(fn) + '(' + args + ')';
  return isVoid(fn) ? 'select ' + call + ", 'null'" : 'select to_jsonb(' + call + ')';
}

/* handle(method, urlPath, query(object), bodyObject, authed) -> { status, json } */
exports.handle = function (method, urlPath, query, body, authed) {
  var m, r;
  if ((m = /^\/auth\/v1\/token/.exec(urlPath))) {
    return { status: 200, json: { access_token: 'test-token', refresh_token: 'test-refresh', expires_in: 3600, user: { email: (body && body.email) || 'pos@josiescafe.com' } } };
  }
  if ((m = /^\/rest\/v1\/rpc\/([a-z0-9_]+)$/.exec(urlPath)) && method === 'POST') {
    r = psql(roleSql(authed) + rpcSql(m[1], body));
    if (!r.ok) { return pgErr(r.err); }
    var lines = r.out.split('\n').filter(Boolean), last = lines[lines.length - 1] || 'null';
    if (isVoid(m[1])) { return { status: 204, json: null }; }
    try { return { status: 200, json: JSON.parse(last) }; } catch (e) { return { status: 200, json: last }; }
  }
  if ((m = /^\/rest\/v1\/([a-z0-9_]+)$/.exec(urlPath)) && method === 'GET') {
    r = psql(roleSql(authed) + selectSql(m[1], query));
    if (!r.ok) { return pgErr(r.err); }
    var l2 = r.out.split('\n').filter(Boolean);
    return { status: 200, json: JSON.parse(l2[l2.length - 1] || '[]') };
  }
  if (urlPath.indexOf('/rest/v1/') === 0 && (method === 'PATCH' || method === 'POST' || method === 'DELETE')) {
    return { status: 403, json: { message: 'writes go through functions in these tests', code: '42501' } };
  }
  return { status: 404, json: { message: 'not handled: ' + method + ' ' + urlPath } };
};
exports.psql = psql;
