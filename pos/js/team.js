/* Josie's World · Team and wages (Josie). Who works here, which station, their language, their hourly rate, a new PIN.
   The rate is only ever sent to Josie; a manager sees the names. Payroll (hours × rate) lives next door. Plain ES5. */
(function (w) {
  'use strict';
  var J = w.J2, S = J.S, U = J.ui, esc = J.esc, Tm = J.team = { list: null, busy: false, edit: null, err: '' };
  var X = {
    en: { title: 'Team and wages', onlyJosie: 'Only Josie', back: 'Back', add: 'Add a person', none: 'No one yet.', name: 'Name', role: 'Role', station: 'Station', lang: 'Language', rate: 'Wage, lempiras per hour', pin: 'PIN, 4 digits', pinKeep: 'Leave empty to keep the same PIN', active: 'Works here', save: 'Save', cancel: 'Cancel',
      staff: 'Staff', manager: 'Manager', owner: 'Owner', register: 'Register', bar: 'Bar', kitchen: 'Kitchen', off: 'Not working here', needNet: 'Needs internet. Try again in a moment.', saved: 'Saved', bad: 'Name, and a 4 digit PIN for someone new.', perH: '/h', noRate: 'No wage yet', managerHint: 'A manager can see the screens and the day, never pay.' },
    es: { title: 'Equipo y salarios', onlyJosie: 'Solo Josie', back: 'Atrás', add: 'Agregar persona', none: 'Nadie todavía.', name: 'Nombre', role: 'Cargo', station: 'Estación', lang: 'Idioma', rate: 'Salario, lempiras por hora', pin: 'PIN, 4 dígitos', pinKeep: 'Déjalo vacío para mantener el mismo PIN', active: 'Trabaja aquí', save: 'Guardar', cancel: 'Cancelar',
      staff: 'Personal', manager: 'Gerente', owner: 'Dueña', register: 'Caja', bar: 'Bar', kitchen: 'Cocina', off: 'Ya no trabaja aquí', needNet: 'Necesita internet. Inténtalo en un momento.', saved: 'Guardado', bad: 'Nombre, y un PIN de 4 dígitos para alguien nuevo.', perH: '/h', noRate: 'Sin salario todavía', managerHint: 'Un gerente ve las pantallas y el día, nunca el pago.' }
  };
  function t(k) { return (X[S.lang] || X.en)[k]; }
  Tm.t = t;

  function load() {
    if (Tm.busy || !S.person || !S.person.token) { return; }
    Tm.busy = true;
    J.call('people_list', { p_token: S.person.token }, function (e, r) {
      Tm.busy = false; Tm.err = e ? t('needNet') : ''; if (r) { Tm.list = r; }
      if (r && Tm.wantSelf) { Tm.wantSelf = false; Tm.handle('teamEdit', S.person.id); }
      J.changed();
    });
  }
  function who(p) { return p.role === 'josie' ? t('owner') : p.role === 'manager' ? t('manager') : (p.station ? t(p.station) : t('staff')); }
  function chips(field, opts, cur) {
    var h = '<div class="tchips">', i;
    for (i = 0; i < opts.length; i++) { h += '<button type="button" class="dchip2' + (cur === opts[i][0] ? ' on' : '') + '" data-act="teamSet" data-arg="' + field + '|' + opts[i][0] + '">' + esc(opts[i][1]) + '</button>'; }
    return h + '</div>';
  }
  function form() {
    var e = Tm.edit, isJ = e.role === 'josie', h;
    h = '<div class="pcard teamform"><label class="tl"><span>' + esc(t('name')) + '</span><input id="tm_name" type="text" value="' + esc(e.name || '') + '" autocomplete="off" autocapitalize="words"></label>';
    if (!isJ) {
      h += '<div class="tl"><span>' + esc(t('role')) + '</span>' + chips('role', [['staff', t('staff')], ['manager', t('manager')]], e.role) + (e.role === 'manager' ? '<small class="psub">' + esc(t('managerHint')) + '</small>' : '') + '</div>';
      if (e.role === 'staff') { h += '<div class="tl"><span>' + esc(t('station')) + '</span>' + chips('station', [['register', t('register')], ['bar', t('bar')], ['kitchen', t('kitchen')]], e.station || 'register') + '</div>'; }
    }
    h += '<div class="tl"><span>' + esc(t('lang')) + '</span>' + chips('language', [['en', 'English'], ['es', 'Español']], e.language || 'en') + '</div>' +
      '<label class="tl"><span>' + esc(t('rate')) + '</span><input id="tm_rate" type="number" inputmode="decimal" min="0" step="1" value="' + esc(e.rate === null || e.rate === undefined ? '' : String(e.rate)) + '"></label>' +
      '<label class="tl"><span>' + esc(t('pin')) + '</span><input id="tm_pin" type="tel" inputmode="numeric" maxlength="4" placeholder="' + (e.id ? '••••' : '') + '" value="' + esc(e.pin || '') + '" autocomplete="off">' + (e.id ? '<small class="psub">' + esc(t('pinKeep')) + '</small>' : '') + '</label>';
    if (e.id && !isJ) { h += '<div class="srow"><span>' + esc(t('active')) + '</span>' + U.toggle(e.active !== false, 'teamActive', undefined, t('active')) + '</div>'; }
    h += '<p class="msg">' + esc(Tm.err || '') + '</p><div class="prow3"><button type="button" class="pbtn" data-act="teamSave">' + esc(t('save')) + '</button><button type="button" class="pbtn ghost" data-act="teamCancel">' + esc(t('cancel')) + '</button></div></div>';
    return h;
  }
  function listView() {
    var l = Tm.list || [], i, p, h = '<div class="pcard teamlist">';
    if (!l.length) { h += '<p class="psub">' + esc(Tm.busy ? '…' : t('none')) + '</p>'; }
    for (i = 0; i < l.length; i++) {
      p = l[i];
      h += '<button type="button" class="payrow teamrow' + (p.active ? '' : ' off') + '" data-act="teamEdit" data-arg="' + p.id + '">' + U.avatar(p.name, 46) + '<span class="pn"><b>' + esc(p.name) + '</b><small>' + esc(who(p)) + ' · ' + (p.language === 'es' ? 'ES' : 'EN') + (p.active ? '' : ' · ' + esc(t('off'))) + '</small></span>' +
        '<span class="pa">' + (S.person && S.person.role === 'josie' ? (p.rate === null || p.rate === undefined ? '<small>' + esc(t('noRate')) + '</small>' : 'L ' + Number(p.rate) + t('perH')) : '') + '</span></button>';
    }
    return h + '</div>' + (J.can('josie') ? '<button type="button" class="paybtn" data-act="teamEdit" data-arg="new">' + esc(t('add')) + '</button>' : '');
  }
  Tm.screen = function () {
    if (!Tm.list && !Tm.busy) { w.setTimeout(load, 0); }
    return '<div class="shell mgr">' + U.topbar('manager', { back: '<button type="button" class="backbtn" data-act="teamBack" aria-label="' + esc(t('back')) + '">‹</button><b class="mtitle">' + esc(t('title')) + ' <span class="lockpill">🔒 ' + esc(t('onlyJosie')) + '</span></b>' }) +
      '<div class="mbody"><div class="teamwrap">' + (Tm.edit ? form() : listView()) + '</div></div></div>';
  };
  /* the guide asks for your own row, to change your PIN */
  Tm.openSelf = function () { J.mgr.view = 'team'; Tm.edit = null; Tm.list = null; Tm.wantSelf = true; J.changed(); };
  Tm.button = function () { return J.can('josie') ? '<button type="button" class="paybtn mteam" data-act="teamOpen">' + esc(t('title')) + '</button>' : ''; };
  function find(id) { var l = Tm.list || [], i; for (i = 0; i < l.length; i++) { if (l[i].id === id) { return l[i]; } } return null; }
  Tm.handle = function (act, arg) {
    var p, e;
    switch (act) {
      case 'teamOpen': J.mgr.view = 'team'; Tm.list = null; Tm.edit = null; J.changed(); return true;
      case 'teamBack': if (Tm.edit) { Tm.edit = null; Tm.err = ''; } else { J.mgr.view = 'day'; } J.changed(); return true;
      case 'teamCancel': Tm.edit = null; Tm.err = ''; J.changed(); return true;
      case 'teamEdit':
        if (arg === 'new') { Tm.edit = { id: null, name: '', role: 'staff', station: 'register', language: 'es', rate: '', pin: '', active: true }; }
        else { p = find(arg); if (p) { Tm.edit = { id: p.id, name: p.name, role: p.role, station: p.station, language: p.language, rate: p.rate, pin: '', active: p.active }; } }
        Tm.err = ''; J.changed(); return true;
      case 'teamSet': p = arg.split('|'); if (Tm.edit) { Tm.edit[p[0]] = p[1]; if (p[0] === 'role' && p[1] === 'manager') { Tm.edit.station = null; } if (p[0] === 'role' && p[1] === 'staff' && !Tm.edit.station) { Tm.edit.station = 'register'; } } J.changed(); return true;
      case 'teamActive': if (Tm.edit) { Tm.edit.active = !Tm.edit.active; J.changed(); } return true;
      case 'teamSave':
        e = Tm.edit; if (!e) { return true; }
        if (!e.name || !/\S/.test(e.name) || (e.pin && !/^[0-9]{4}$/.test(e.pin)) || (!e.id && !/^[0-9]{4}$/.test(e.pin || ''))) { Tm.err = t('bad'); J.changed(); return true; }
        var body = { id: e.id || '', name: e.name.replace(/^\s+|\s+$/g, ''), role: e.role, station: e.role === 'staff' ? (e.station || 'register') : '', language: e.language, rate: e.rate === '' || e.rate === null || e.rate === undefined ? '' : String(e.rate), active: e.active !== false };
        if (e.pin) { body.pin = e.pin; }
        J.call('people_save', { p_token: S.person.token, p: body }, function (err) {
          if (err) { Tm.err = S.online ? String(err.message || err) : t('needNet'); J.changed(); return; }
          Tm.edit = null; Tm.err = ''; Tm.list = null; J.loadData(function () { J.changed(); });
        });
        return true;
    }
    return false;
  };
  Tm.input = function (el) {
    if (!Tm.edit) { return false; }
    if (Tm.err && /^tm_/.test(el.id)) { Tm.err = ''; var m = w.document.querySelector('.teamform .msg'); if (m) { m.innerHTML = ''; } }
    if (el.id === 'tm_name') { Tm.edit.name = el.value; return true; }
    if (el.id === 'tm_rate') { Tm.edit.rate = el.value; return true; }
    if (el.id === 'tm_pin') { Tm.edit.pin = el.value.replace(/[^0-9]/g, '').slice(0, 4); return true; }
    return false;
  };
}(window));
