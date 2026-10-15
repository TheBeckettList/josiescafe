/* Josie's World · the little things on the maps. Tap the tree, the iguana, a crab, the eagle ray or the tuk-tuk on the cafe map, and the
   boats, the octopus, the fish, the buoy or the dive boat on the bay map. Everything is an overlay that stays hidden until it plays.
   J2CRIT.cafe() = the overlay pieces (put inside the 1440 x 1240 map layer); J2CRIT.hits() = the invisible tap buttons;
   J2CRIT.play(name) = do it. Needs art/critters.css. Plain ES5. */
(function (w, d) {
  'use strict';
  var C = w.J2CRIT = { MAP: '/img/world/map.png?v=2', active: {} };
  var DUR = { tree: 1.7, iguana: 3.4, crab1: 4, crab2: 4, crab3: 4, ray: 2.4, tuk: 2.6, sail: 1.4, octopus: 1.6, fish: 1.8, buoy: 1.6, diveboat: 1.8 };
  var SAND = '#F6DCC0', HEAD = '#6FA3B8';

  function on(name) { return C.active[name] ? ' on' : ''; }
  function late(name) { return C.active[name] ? 'animation-delay:-' + Math.max(0, (Date.now() - C.active[name]) / 1000).toFixed(2) + 's;-webkit-animation-delay:-' + Math.max(0, (Date.now() - C.active[name]) / 1000).toFixed(2) + 's;' : ''; }
  function bg(x, y) { return 'background:url(' + C.MAP + ') ' + (-x) + 'px ' + (-y) + 'px / 1440px 1240px no-repeat;'; }
  function box(x, y, wd, h) { return 'left:' + x + 'px;top:' + y + 'px;width:' + wd + 'px;height:' + h + 'px;'; }

  /* the tree: a copy of the canopy, shaped like the canopy, sways; a few leaves float down */
  var CANOPY = [[140, 235], [150, 190], [200, 170], [210, 140], [250, 128], [330, 130], [380, 150], [405, 150], [440, 125], [520, 118], [590, 130], [610, 165], [700, 165], [745, 190], [770, 215], [800, 240], [810, 290], [790, 330], [740, 340], [700, 345], [680, 360], [640, 345], [590, 340], [540, 330], [470, 300], [430, 290], [380, 300], [330, 295], [290, 300], [260, 290], [230, 270], [190, 275], [160, 280]];
  function treeHtml() {
    var pts = [], i, h, leaves = [[40, 76, -10, 80, 60, 0], [90, 92, 14, 96, -80, .15], [150, 100, -6, 70, 100, .3], [210, 104, 12, 88, -60, .1], [260, 98, -14, 76, 90, .4], [300, 84, 8, 92, 120, .22], [120, 78, -4, 84, -110, .5]];
    for (i = 0; i < CANOPY.length; i++) { pts.push((CANOPY[i][0] / 2 - 70).toFixed(0) + 'px ' + (CANOPY[i][1] / 2 - 57).toFixed(0) + 'px'); }
    h = '<div class="cr cr-tree' + on('tree') + '" style="' + box(490, 617, 335, 125) + bg(490, 617) + 'clip-path:polygon(' + pts.join(',') + ');-webkit-clip-path:polygon(' + pts.join(',') + ');' + late('tree') + '"></div>';
    for (i = 0; i < leaves.length; i++) {
      h += '<svg class="cr cr-leaf' + on('tree') + '" viewBox="0 0 14 10" style="left:' + (490 + leaves[i][0]) + 'px;top:' + (617 + leaves[i][1]) + 'px;width:14px;height:10px;--dx:' + leaves[i][2] + 'px;--dy:' + leaves[i][3] + 'px;--r:' + leaves[i][4] + 'deg;' + (C.active.tree ? 'animation-delay:' + (leaves[i][5] - (Date.now() - C.active.tree) / 1000).toFixed(2) + 's;' : 'animation-delay:' + leaves[i][5] + 's;') + '"><path d="M1 5 Q7 -1 13 5 Q7 11 1 5z" fill="#4E8A4A"/><path d="M2 5 H12" stroke="#7FB36B" stroke-width="1"/></svg>';
    }
    return h;
  }

  /* the iguana: head copy that cranes up the incline, a wink, and an open-and-close mouth */
  function iguanaHtml() {
    var a = on('iguana'), st = late('iguana');
    return '<div class="cr cr-igpatch' + a + '" style="' + box(480, 890, 50, 42) + 'background:' + SAND + ';border-radius:50%;"></div>' +
      '<div class="cr cr-ig' + a + '" style="' + box(480, 890, 50, 42) + bg(480, 890) + 'clip-path:ellipse(24px 19px at 24px 20px);-webkit-clip-path:ellipse(24px 19px at 24px 20px);' + st + '">' +
      '<svg class="cr-wink' + a + '" viewBox="0 0 50 42" style="position:absolute;left:0;top:0;width:50px;height:42px;' + st + '"><circle cx="15.600" cy="13.500" r="4.300" fill="' + HEAD + '"/><path d="M12.200 13.700 q3.400 -3.800 6.800 0" stroke="#27303A" stroke-width="1.600" fill="none" stroke-linecap="round"/></svg>' +
      '<svg class="cr-mouth' + a + '" viewBox="0 0 50 42" style="position:absolute;left:0;top:0;width:50px;height:42px;' + st + '"><path d="M2.500 21.500 L21 22.800 L19.500 31 Q11 33 6 29 Z" fill="' + HEAD + '"/><path d="M2.500 19.500 L21 20.800 L19 27 L7 25 Z" fill="#5A2C3A"/><ellipse cx="12" cy="24.500" rx="4.400" ry="1.700" fill="#E58BA0"/></svg>' +
      '</div>';
  }

  /* crabs: a sprite drawn to match, a sand patch under the painted crab while it moves, and its hole */
  var CRABS = [{ n: 'crab1', x: 858, y: 968, w: 64, h: 52, dx: -66, dy: -2 }, { n: 'crab2', x: 950, y: 994, w: 62, h: 54, dx: -34, dy: -14 }, { n: 'crab3', x: 1041, y: 960, w: 52, h: 44, dx: -62, dy: 4 }];
  function crabSvg() {
    return '<g class="cr-wig"><path d="M17 26 L9 18 M43 26 L50 17" stroke="#E9735C" stroke-width="3.400" stroke-linecap="round"/><path d="M8 38 L13 33 M9 44 L15 38 M14 48 L18 41 M52 38 L47 33 M51 44 L45 38 M46 48 L42 41" stroke="#D9604A" stroke-width="2.600" stroke-linecap="round"/>' +
      '<circle cx="8" cy="15" r="5.600" fill="#EE8068"/><path d="M4.500 13 L10 16.500" stroke="#C95541" stroke-width="1.600" stroke-linecap="round"/><circle cx="51" cy="13" r="5.600" fill="#EE8068"/><path d="M48 15.500 L54 11" stroke="#C95541" stroke-width="1.600" stroke-linecap="round"/>' +
      '<path d="M24 22 L23 15 M36 22 L36 14" stroke="#D9604A" stroke-width="2"/><ellipse cx="30" cy="31" rx="16" ry="11" fill="#EE8068"/><ellipse cx="27" cy="27.500" rx="8.500" ry="4.600" fill="#F5A38D"/><circle cx="19" cy="34" r="1.800" fill="#E86F57"/><circle cx="40" cy="32" r="1.800" fill="#E86F57"/>' +
      '<circle cx="23" cy="12" r="3.800" fill="#FFFFFF"/><circle cx="36" cy="11" r="3.800" fill="#FFFFFF"/><circle cx="23.500" cy="12.500" r="1.700" fill="#3A2A2A"/><circle cx="36.500" cy="11.500" r="1.700" fill="#3A2A2A"/></g>';
  }
  function crabsHtml() {
    var i, c, h = '';
    for (i = 0; i < CRABS.length; i++) {
      c = CRABS[i];
      h += '<div class="cr cr-crabpatch' + on(c.n) + '" style="' + box(c.x - 4, c.y - 4, c.w + 10, c.h + 12) + 'background:' + SAND + ';border-radius:46%;"></div>' +
        '<svg class="cr cr-hole' + on(c.n) + '" viewBox="0 0 30 16" style="' + box(c.x + c.dx + c.w / 2 - 15, c.y + c.dy + c.h - 13, 30, 16) + late(c.n) + '"><ellipse cx="15" cy="9" rx="14" ry="6.500" fill="#E9C9A6"/><ellipse cx="15" cy="9.500" rx="11" ry="4.600" fill="#8B6B50"/><ellipse cx="15" cy="10.500" rx="8" ry="3" fill="#4E3626"/></svg>' +
        '<svg class="cr cr-crab' + on(c.n) + '" viewBox="0 0 60 50" style="' + box(c.x, c.y, c.w, c.h) + '--dx:' + c.dx + 'px;--dy:' + c.dy + 'px;' + late(c.n) + '">' + crabSvg() + '</svg>';
    }
    return h;
  }

  /* the eagle ray */
  function rayHtml() {
    var pts = '5px 40px,17px 40px,59px 4px,74px 14px,93px 42px,68px 85px,16px 57px', a = on('ray'), st = late('ray');
    return '<div class="cr cr-ray' + a + '" style="' + box(392, 1146, 102, 94) + bg(392, 1146) + 'clip-path:polygon(' + pts + ');-webkit-clip-path:polygon(' + pts + ');' + st + '"></div>' +
      '<svg class="cr cr-flow' + a + '" viewBox="0 0 230 120" style="' + box(380, 1130, 230, 120) + '"><path d="M-10 26 q30 -12 60 0 t60 0 t60 0 t60 0" style="' + st + '"/><path d="M-10 52 q30 -12 60 0 t60 0 t60 0 t60 0" style="' + st + '"/><path d="M-10 78 q30 -12 60 0 t60 0 t60 0 t60 0" style="' + st + '"/><path d="M-10 102 q30 -12 60 0 t60 0 t60 0 t60 0" style="' + st + '"/></svg>' +
      '<svg class="cr cr-rip' + a + '" viewBox="0 0 60 40" style="' + box(372, 1172, 60, 40) + '"><circle cx="30" cy="20" r="16" style="' + st + '"/><circle cx="30" cy="20" r="16" style="' + st + '"/></svg>';
  }

  /* the tuk-tuk: cute white puffs from the back */
  function tukHtml() {
    var P = [[0, 24, 40, 1.5, 0, 1], [.28, 30, 54, 1.7, 1, 1], [.56, 16, 62, 1.3, 0, 0], [.84, 34, 74, 1.9, 1, 1], [1.1, 22, 86, 1.4, 0, 0]], i, p, h = '';
    for (i = 0; i < P.length; i++) {
      p = P[i];
      h += '<svg class="cr cr-puff' + on('tuk') + '" viewBox="0 0 34 26" style="left:' + (162 + (i % 2) * 10) + 'px;top:568px;width:34px;height:26px;--px:' + p[1] + 'px;--py:' + p[2] + 'px;--ps:' + p[3] + ';animation-delay:' + (C.active.tuk ? (p[0] - (Date.now() - C.active.tuk) / 1000).toFixed(2) : p[0]) + 's;">' +
        '<g fill="#FFFFFF" stroke="#F3CFDC" stroke-width="1.600"><circle cx="10" cy="15" r="7.500"/><circle cx="20" cy="11" r="9"/><circle cx="26" cy="16" r="6.500"/><rect x="9" y="14" width="19" height="9" rx="4.500"/></g>' +
        '<g fill="#FFFFFF"><circle cx="10" cy="15" r="6.200"/><circle cx="20" cy="11" r="7.600"/><circle cx="26" cy="16" r="5.200"/><rect x="10" y="15" width="17" height="7.200" rx="3.600"/></g>' +
        (p[5] ? '<circle cx="16" cy="14" r="1" fill="#E7A5BA"/><circle cx="23" cy="14" r="1" fill="#E7A5BA"/><path d="M17 17.500 q3 2.500 6 0" stroke="#E7A5BA" stroke-width="1.200" fill="none" stroke-linecap="round"/>' : '') + '</svg>';
    }
    return h;
  }


  /* a map object (not a critter): the pastry stand with its glass dome, on the register counter, beside the printer */
  C.stand = function () {
    return C.board() + '<svg class="mapobj" viewBox="0 0 76 76" style="position:absolute;left:676px;top:184px;width:62px;height:62px;pointer-events:none;z-index:4" aria-hidden="true">' +
      '<ellipse cx="38" cy="70" rx="24" ry="3" fill="#3B2925" opacity=".1"/><ellipse cx="38" cy="67" rx="21" ry="5" fill="#F5B5C8"/><rect x="35" y="57" width="6" height="10" fill="#EE95B3"/><ellipse cx="38" cy="57" rx="28" ry="5" fill="#FFFFFF" stroke="#F1D3DD" stroke-width="1.500"/>' +
      '<path d="M15 54 L29 54 L27.500 46 Q22 43 16.500 46 Z" fill="#F5B5C8"/><path d="M13.500 47 Q14 36 22 35 Q30 36 30.500 47 Z" fill="#E2A66A"/><circle cx="19" cy="41" r="1.200" fill="#B98050"/><circle cx="25" cy="40" r="1.200" fill="#B98050"/>' +
      '<circle cx="39" cy="48" r="8.500" fill="#D9A15F"/><circle cx="39" cy="48" r="7" fill="#E5B677"/><g fill="#5A3626"><circle cx="36" cy="46" r="1.300"/><circle cx="42" cy="48" r="1.300"/><circle cx="38" cy="51" r="1.300"/></g>' +
      '<circle cx="56" cy="50" r="7.500" fill="#E8B777"/><circle cx="56" cy="50" r="5.200" fill="#F6D9AE"/><path d="M56 50 m-2 0 a2 2 0 1 1 2 2" stroke="#B98050" stroke-width="1.300" fill="none"/>' +
      '<path d="M9 55 Q9 11 38 11 Q67 11 67 55 Z" fill="#DDF1F8" fill-opacity=".38" stroke="#BFE3F0" stroke-width="2"/><path d="M15 48 Q15 22 29 17" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/><circle cx="38" cy="9" r="3.800" fill="#EE95B3"/></svg>';
  };
  /* the menu board: a standing chalk-style sign on the wall left of the counter, the thing to tap for the menu */
  C.board = function () {
    return '<svg class="mapobj" viewBox="0 0 70 124" style="position:absolute;left:478px;top:146px;width:70px;height:124px;pointer-events:none;z-index:4" aria-hidden="true">' +
      '<ellipse cx="35" cy="120" rx="26" ry="3" fill="#3B2925" opacity=".12"/><rect x="12" y="104" width="6" height="14" rx="2" fill="#7A5A4A"/><rect x="52" y="104" width="6" height="14" rx="2" fill="#7A5A4A"/>' +
      '<rect x="3" y="3" width="64" height="104" rx="12" fill="#FFFFFF" stroke="#F5B5C8" stroke-width="5"/>' +
      '<text x="35" y="22" text-anchor="middle" style="font-family:\'Baloo 2\',Nunito,sans-serif;font-weight:800;font-size:14px" fill="#E07B9B">Menu</text>' +
      '<g transform="translate(0 6)"><path d="M13 34h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" fill="#F5B5C8"/><path d="M25 35h2a2.600 2.600 0 0 1 0 5h-2" fill="none" stroke="#F5B5C8" stroke-width="1.800"/><rect x="33" y="35" width="24" height="4" rx="2" fill="#5B3843"/><rect x="33" y="42" width="16" height="3.500" rx="1.750" fill="#F5B5C8"/>' +
      '<circle cx="19" cy="58" r="6.500" fill="#FBE3D0"/><circle cx="21" cy="57" r="2.500" fill="#5A3626"/><rect x="33" y="55" width="24" height="4" rx="2" fill="#5B3843"/><rect x="33" y="62" width="16" height="3.500" rx="1.750" fill="#F5B5C8"/>' +
      '<circle cx="19" cy="78" r="7" fill="#D9A15F"/><circle cx="19" cy="78" r="2.600" fill="#FFFFFF"/><rect x="33" y="75" width="24" height="4" rx="2" fill="#5B3843"/><rect x="33" y="82" width="16" height="3.500" rx="1.750" fill="#F5B5C8"/></g></svg>';
  };
  C.cafe = function () { return treeHtml() + iguanaHtml() + crabsHtml() + rayHtml() + tukHtml(); };
  C.hits = function () {
    var H = [['tree', 560, 640, 265, 230], ['iguana', 478, 888, 190, 66], ['crab1', 858, 966, 66, 56], ['crab2', 950, 992, 62, 56], ['crab3', 1041, 960, 52, 46], ['ray', 392, 1144, 200, 98], ['tuk', 96, 340, 170, 240]], i, h = '';
    for (i = 0; i < H.length; i++) { h += '<button type="button" class="hit crit" data-act="crit" data-arg="' + H[i][0] + '" style="left:' + H[i][1] + 'px;top:' + H[i][2] + 'px;width:' + H[i][3] + 'px;height:' + H[i][4] + 'px;z-index:7" aria-label="' + H[i][0] + '"></button>'; }
    return h;
  };

  /* what each name wakes up (cafe overlays are found by class, bay things by data-crit) */
  var GROUPS = { tree: ['.cr-tree', '.cr-leaf'], iguana: ['.cr-igpatch', '.cr-ig', '.cr-wink', '.cr-mouth'], crab1: [], crab2: [], crab3: [], ray: ['.cr-ray', '.cr-flow', '.cr-rip'], tuk: ['.cr-puff'] };
  function kick(els) { var i; for (i = 0; i < els.length; i++) { els[i].classList.remove('on'); els[i].style.animationDelay = ''; els[i].style.webkitAnimationDelay = ''; } void d.body.offsetWidth; for (i = 0; i < els.length; i++) { els[i].classList.add('on'); } }
  C.play = function (name, root) {
    root = root || d; var els = [], sel = GROUPS[name], i, k, list;
    C.active[name] = Date.now();
    if (/^crab/.test(name)) {
      var idx = Number(name.slice(4)) - 1, all = root.querySelectorAll('.cr-crab'), pat = root.querySelectorAll('.cr-crabpatch'), hol = root.querySelectorAll('.cr-hole');
      [all[idx], pat[idx], hol[idx]].forEach(function (e) { if (e) { els.push(e); } });
    } else if (sel && sel.length) {
      for (k = 0; k < sel.length; k++) { list = root.querySelectorAll(sel[k]); for (i = 0; i < list.length; i++) { els.push(list[i]); } }
    } else { list = root.querySelectorAll('[data-crit="' + name + '"],[data-crit="' + name + '"] .bf,[data-crit="' + name + '"] .bc-ink,[data-crit="' + name + '"] .bc-bub'); for (i = 0; i < list.length; i++) { els.push(list[i]); } }
    kick(els);
    w.setTimeout(function () { delete C.active[name]; for (var j = 0; j < els.length; j++) { els[j].classList.remove('on'); } }, (DUR[name] || 2) * 1000 + 700);
  };
}(window, document));
