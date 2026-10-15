/* Josie's World · the bay map for the website's home page, drawn from the real shape of Utila's bay (traced from the satellite view):
   the town and road along the north and east shore, Bando Beach and the reef flat that closes the bay to the south, the spit running out to
   Point Pool, and the open sea beyond. North is up. The pier and the hanging sign are drawn oversized; the boats are small. Plain ES5. */
(function (w) {
  'use strict';
  /* picture coordinates (the satellite view, 2000 x 1281) -> map design box (1440 x 1240) */
  var K = 0.6, OX = -94, OY = -90;
  function X(x) { return +(K * x + OX).toFixed(1); }
  function Y(x, y) { return +(K * y + OY).toFixed(1); }
  var G = 'translate(' + OX + ',' + OY + ') scale(' + K + ')';

  /* the bay's coast: west shore, north shore past Josie's pier, down the east shore to Bando Beach */
  var COAST = [[-400, 1110], [-100, 1020], [0, 965], [100, 905], [190, 825], [260, 745], [330, 690], [400, 640], [460, 590], [500, 545], [560, 490], [620, 462], [700, 445], [800, 435], [900, 432], [990, 448], [1050, 480], [1085, 518], [1120, 548], [1170, 592], [1215, 642], [1250, 702], [1268, 762], [1272, 822], [1255, 882], [1230, 936], [1195, 976], [1155, 1006]];
  var TOWN = COAST.slice(10, 26);
  var ROADPTS = COAST.slice(9, 23);
  function smooth(p) {
    var d = 'M' + p[0][0] + ',' + p[0][1], i, mx, my;
    for (i = 1; i < p.length - 1; i++) { mx = (p[i][0] + p[i + 1][0]) / 2; my = (p[i][1] + p[i + 1][1]) / 2; d += ' Q' + p[i][0] + ',' + p[i][1] + ' ' + mx.toFixed(1) + ',' + my.toFixed(1); }
    return d + ' L' + p[p.length - 1][0] + ',' + p[p.length - 1][1];
  }
  function offset(p, off) {
    var out = [], i, a, b, tx, ty, l;
    for (i = 0; i < p.length; i++) {
      a = p[Math.max(0, i - 1)]; b = p[Math.min(p.length - 1, i + 1)]; tx = b[0] - a[0]; ty = b[1] - a[1]; l = Math.sqrt(tx * tx + ty * ty) || 1;
      out.push([+(p[i][0] + ty / l * off).toFixed(1), +(p[i][1] - tx / l * off).toFixed(1)]);
    }
    return out;
  }
  /* the road runs the whole way along the shore and off the screen at both ends: down the west coast, round the bay, down the east shore,
     along the sand at Bando and up the ocean side. Parallel to the water, never a hook. */
  function offsetVar(p, offs) {
    var out = [], i, a, b, tx, ty, l;
    for (i = 0; i < p.length; i++) {
      a = p[Math.max(0, i - 1)]; b = p[Math.min(p.length - 1, i + 1)]; tx = b[0] - a[0]; ty = b[1] - a[1]; l = Math.sqrt(tx * tx + ty * ty) || 1;
      out.push([+(p[i][0] + ty / l * offs[i]).toFixed(1), +(p[i][1] - tx / l * offs[i]).toFixed(1)]);
    }
    return out;
  }
  var ROADRAW = COAST.slice(0, 24), ROADOFF = [], ri;
  for (ri = 0; ri < ROADRAW.length; ri++) { ROADOFF.push(ri < 22 ? 78 : 78 - (ri - 21) * 10); }
  var roadPts = offsetVar(ROADRAW, ROADOFF);
  /* off the west end: carry on in the direction the coast runs */
  roadPts.unshift([roadPts[0][0] - 420, roadPts[0][1] + 360]);
  /* the beach and the ocean side, picture coordinates */
  [[706, 506], [742, 534], [810, 548], [900, 546], [990, 530], [1050, 500], [1070, 440], [1074, 320], [1074, 150], [1074, -150]].forEach(function (q) { roadPts.push([+((q[0] + 94) / .6).toFixed(1), +((q[1] + 90) / .6).toFixed(1)]); });
  var coastD = smooth(COAST), roadD = smooth(roadPts), shoreLandD = smooth(offset(COAST, 16));
  /* land: everything north and east of the coast, round the spit to Point Pool and up the ocean side */
  var SHORE = coastD + ' Q1105,1030 1100,1066 Q1098,1100 1150,1104 Q1300,1120 1440,1114 Q1560,1094 1660,1034 Q1780,952 1840,832 Q1900,702 1925,562 Q1945,402 1960,202';
  var LAND = SHORE + ' L1990,-500 L-400,-500 Z';

  /* little town: a few small houses with pink and cream roofs, set back from the road, in groups with gaps */
  function houses() {
    var out = '', pts = TOWN, i, j, a, b, n, px, py, t, tx, ty, l, k, hsh, roofs = ['#F5B5C8', '#F2A66B', '#EAD9C5', '#F5B5C8', '#C9A98F'], ang;
    for (i = 0; i < pts.length - 1; i++) {
      a = pts[i]; b = pts[i + 1]; tx = b[0] - a[0]; ty = b[1] - a[1]; l = Math.sqrt(tx * tx + ty * ty); n = Math.max(1, Math.floor(l / 70));
      ang = (Math.atan2(ty, tx) * 57.3).toFixed(0);
      for (j = 0; j < n; j++) {
        hsh = (i * 31 + j * 17) % 7; if (hsh === 0 || hsh === 3) { continue; }
        for (k = 0; k < 2; k++) {
          if (k === 1 && hsh % 2) { continue; }
          t = (j + .5) / n; px = a[0] + tx * t + ty / l * (112 + k * 70); py = a[1] + ty * t - tx / l * (112 + k * 70);
          out += '<g transform="translate(' + px.toFixed(0) + ',' + py.toFixed(0) + ') rotate(' + ((ang % 90) / 6).toFixed(0) + ')"><rect x="-22" y="-16" width="44" height="32" rx="5" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="2.5"/><path d="M-24,-16 h48 v13 h-48 z" fill="' + roofs[(i + j + k) % 5] + '" opacity=".95"/></g>';
        }
      }
    }
    return out;
  }

  /* a soft organic blob (deterministic): used for reef patches, mangroves and the lagoon */
  function blob(cx, cy, rx, ry, seed, irr) {
    var n = 11, pts = [], i, a, r, k = seed * 9301 + 49297;
    for (i = 0; i < n; i++) { k = (k * 9301 + 49297) % 233280; r = 1 - (irr || .22) + (k / 233280) * (irr || .22) * 2; a = i / n * Math.PI * 2; pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
    var d = 'M' + ((pts[0][0] + pts[n - 1][0]) / 2).toFixed(1) + ',' + ((pts[0][1] + pts[n - 1][1]) / 2).toFixed(1);
    for (i = 0; i < n; i++) { var q = pts[(i + 1) % n], c = pts[i]; d += ' Q' + c[0].toFixed(1) + ',' + c[1].toFixed(1) + ' ' + ((c[0] + q[0]) / 2).toFixed(1) + ',' + ((c[1] + q[1]) / 2).toFixed(1); }
    return d + ' Z';
  }
  /* a reef patch: pale shallows, turquoise ring, sandy heart, a few coral specks */
  function reef(cx, cy, rx, ry, seed) {
    var h = '<path d="' + blob(cx, cy, rx * 1.18, ry * 1.18, seed, .2) + '" fill="#B9E7E3" opacity=".7"/><path d="' + blob(cx, cy, rx, ry, seed + 1, .26) + '" fill="#8FD9CF" opacity=".85"/>' +
      '<path d="' + blob(cx, cy, rx * .62, ry * .6, seed + 2, .3) + '" fill="#C9EEDF" opacity=".9"/>', i, k = seed * 7;
    for (i = 0; i < 7; i++) { k = (k * 9301 + 49297) % 233280; var ang = k / 233280 * 6.283, rad = ((k * 7) % 100) / 100 * .8; h += '<circle cx="' + (cx + Math.cos(ang) * rx * rad).toFixed(0) + '" cy="' + (cy + Math.sin(ang) * ry * rad).toFixed(0) + '" r="' + (6 + (k % 9)) + '" fill="#5FBFB3" opacity=".45"/>'; }
    return h;
  }
  function palm(x, y, sc) {
    var h = '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')"><ellipse cx="4" cy="6" rx="22" ry="7" fill="#3B2925" opacity=".12"/><path d="M0,0 Q6,-30 2,-56" stroke="#B98C66" stroke-width="6" fill="none" stroke-linecap="round"/>', i;
    for (i = 0; i < 6; i++) { h += '<path d="M2,-56 Q' + (30 * Math.cos(i * 1.05 - .5)) + ',' + (-56 + 22 * Math.sin(i * 1.05 - .5) - 18) + ' ' + (46 * Math.cos(i * 1.05 - .5)) + ',' + (-56 + 30 * Math.sin(i * 1.05 - .5)) + '" stroke="#6DB28F" stroke-width="9" fill="none" stroke-linecap="round"/>'; }
    return h + '</g>';
  }

  function fish(x, y, sc, rot, col) {
    var fx = ((Math.round(x) * 7) % 40) - 20, fy = ((Math.round(y) * 13) % 30) - 15;
    return '<g class="bf" style="--fx:' + fx + 'px;--fy:' + fy + 'px"><g transform="translate(' + x + ',' + y + ') rotate(' + rot + ') scale(' + sc + ')"><path d="M-9,0 L-18,-7 L-18,7 Z" fill="' + col + '"/><ellipse cx="0" cy="0" rx="11" ry="6.5" fill="' + col + '"/><path d="M-2,-6 Q3,-2 -2,6" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".7"/><circle cx="6" cy="-1.5" r="1.5" fill="#3B2925"/></g></g>';
  }
  function school(cx, cy, col, n, spread, rot) {
    var out = '', i, k = cx * 3 + cy;
    for (i = 0; i < n; i++) { k = (k * 9301 + 49297) % 233280; out += fish((cx + (k % 100 / 100 - .5) * spread * 2).toFixed(0), (cy + ((k >> 3) % 100 / 100 - .5) * spread).toFixed(0), (.55 + (k % 7) / 25).toFixed(2), rot + (k % 21) - 10, col); }
    return out;
  }
  function octopus(x, y, sc) {
    var t = '', i, a;
    for (i = 0; i < 7; i++) { a = -70 + i * 23; t += '<path d="M' + (i * 7 - 21) + ',8 q' + (Math.sin(a / 57) * 10) + ',16 ' + (Math.sin(a / 40) * 18) + ',26 q' + (Math.cos(a / 30) * 8) + ',8 ' + (Math.sin(a / 20) * 10) + ',10" stroke="#D98BB8" stroke-width="6" fill="none" stroke-linecap="round"/>'; }
    return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')"><ellipse cx="0" cy="34" rx="30" ry="7" fill="#3B2925" opacity=".12"/>' + t +
      '<ellipse cx="0" cy="-6" rx="20" ry="17" fill="#E3A0C6"/><ellipse cx="-6" cy="-12" rx="7" ry="5" fill="#F3C3DB" opacity=".8"/><circle cx="-7" cy="1" r="5" fill="#FFFFFF"/><circle cx="7" cy="1" r="5" fill="#FFFFFF"/><circle cx="-6" cy="2" r="2.4" fill="#3B2925"/><circle cx="8" cy="2" r="2.4" fill="#3B2925"/></g>';
  }
  function buoy(x, y, sc) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')"><ellipse cx="0" cy="10" rx="20" ry="5" fill="#FFFFFF" opacity=".5"/><path d="M0,0 V-34" stroke="#7A625B" stroke-width="2.4"/>' +
      '<path d="M0,-34 h20 v13 h-20 z" fill="#E24D5C"/><path d="M0,-34 L20,-21" stroke="#FFFFFF" stroke-width="3"/><circle cx="0" cy="4" r="9" fill="#F2A66B"/><path d="M-9,2 h18" stroke="#FFFFFF" stroke-width="3"/></g>';
  }
  function diveBoat(x, y, sc) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')"><ellipse cx="0" cy="24" rx="70" ry="11" fill="#FFFFFF" opacity=".4"/>' +
      '<path d="M-58,4 L52,4 Q66,4 72,-8 L72,12 Q60,26 40,26 L-44,26 Q-58,26 -58,12 Z" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="3" stroke-linejoin="round"/><path d="M-56,14 H68" stroke="#EC5C97" stroke-width="5"/>' +
      '<rect x="-36" y="-14" width="46" height="18" rx="5" fill="#B9E2EA" stroke="#FFFFFF" stroke-width="3"/><path d="M-40,-16 h54" stroke="#F5B5C8" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M38,4 V-30" stroke="#7A625B" stroke-width="2.4"/><path d="M38,-30 h22 v14 h-22 z" fill="#E24D5C"/><path d="M38,-30 L60,-16" stroke="#FFFFFF" stroke-width="3.4"/>' +
      '<circle cx="-70" cy="30" r="3" fill="#FFFFFF" opacity=".8"/><circle cx="-78" cy="38" r="2.2" fill="#FFFFFF" opacity=".7"/></g>';
  }


  /* a cottage seen from above: an organic roof with a ridge, a hint of wall on the shady side, a porch blob, a bush */
  function bldg(x, y, w, h, roof, rot, seed) {
    seed = seed || (Math.round(x * 3 + y * 7) % 90) + 3;
    return '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) + ')"><ellipse cx="2" cy="' + (h * .52).toFixed(1) + '" rx="' + (w * .56).toFixed(1) + '" ry="' + (h * .22).toFixed(1) + '" fill="#3B2925" opacity=".13"/>' +
      '<path d="' + blob(0, 3, w * .5, h * .46, seed + 1, .1) + '" fill="#FFF8F0" stroke="#E2D7CC" stroke-width="1.4"/>' +
      '<path d="' + blob(0, -1, w * .52, h * .44, seed, .13) + '" fill="' + roof + '" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="1.2"/>' +
      '<path d="M' + (-w * .34).toFixed(1) + ',-1 Q0,' + (-h * .1).toFixed(1) + ' ' + (w * .34).toFixed(1) + ',-1" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
      '<path d="' + blob(w * .12, h * .46, w * .14, h * .1, seed + 2, .2) + '" fill="#C9A98F"/></g>';
  }
  /* the town: a dense cluster on the north-west shore: shops in rows, a little church, a plaza with a palm */
  function town() {
    var R = ['#F5B5C8', '#F2A66B', '#EAD9C5', '#7FC6D6', '#C9A98F', '#F5B5C8', '#F2A66B'], out = '', pts = [
      [350, 32, 32, 24, -4], [398, 36, 30, 22, 6], [362, 68, 30, 24, 3], [346, 100, 28, 22, -6], [392, 98, 30, 22, 5]
    ], i;
    for (i = 0; i < pts.length; i++) { out += bldg(pts[i][0], pts[i][1], pts[i][2], pts[i][3], R[i % R.length], pts[i][4], 11 + i * 7); }
    /* the church: taller, with a bell tower and a cross, at the head of the little plaza */
    out += '<g transform="translate(424,62) rotate(4)"><rect x="-13" y="-8" width="28" height="30" rx="3" fill="#3B2925" opacity=".12" transform="translate(2,3)"/><rect x="-13" y="-10" width="26" height="28" rx="3.5" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="1.6"/><rect x="-13" y="-10" width="26" height="9" rx="3" fill="#EAD9C5"/><rect x="-4" y="-22" width="8" height="12" rx="2" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="1.4"/><path d="M0,-30 v8 M-3,-27 h6" stroke="#B55573" stroke-width="1.8" stroke-linecap="round"/><rect x="-3" y="6" width="6" height="10" rx="3" fill="#C9A98F"/></g>';
    /* plaza, a palm, a bush or two */
    out += '<ellipse cx="396" cy="72" rx="13" ry="7.5" fill="#FBEFE4"/>' + palm(398, 74, .3) + '<circle cx="328" cy="48" r="4.5" fill="#7DBE9C"/><circle cx="332" cy="86" r="5" fill="#7DBE9C"/><circle cx="378" cy="50" r="3.6" fill="#97D0B1"/><circle cx="424" cy="104" r="4.4" fill="#97D0B1"/>';
    return out;
  }
  /* the houses: a tight little neighbourhood on the east shore, set back from the road, with yards */
  function neighbourhood() {
    var R = ['#F5B5C8', '#F2A66B', '#7FC6D6', '#EAD9C5', '#F5B5C8'], out = '', pts = [
      [718, 270, 30, 23, 10], [752, 304, 28, 22, -8], [722, 344, 30, 24, 5], [756, 380, 28, 22, -6], [728, 414, 26, 20, 8]
    ], i;
    for (i = 0; i < pts.length; i++) { out += bldg(pts[i][0], pts[i][1], pts[i][2], pts[i][3], R[i], pts[i][4], 41 + i * 5); }
    out += '<circle cx="740" cy="288" r="5" fill="#7DBE9C"/><circle cx="728" cy="322" r="4.6" fill="#97D0B1"/><circle cx="772" cy="344" r="5.4" fill="#7DBE9C"/><circle cx="744" cy="404" r="4.6" fill="#97D0B1"/>';
    return out;
  }
  /* a dive boat moored to its buoy: a short rope, one flag (on the boat) */
  function mooring(x, y, sc) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')"><ellipse cx="0" cy="10" rx="18" ry="5" fill="#FFFFFF" opacity=".55"/><circle cx="0" cy="2" r="9" fill="#F2A66B" stroke="#FFFFFF" stroke-width="2"/><path d="M-9,0 h18" stroke="#FFFFFF" stroke-width="3"/><circle cx="0" cy="-8" r="2.4" fill="none" stroke="#7A625B" stroke-width="1.6"/></g>';
  }
  /* an eagle ray seen from above, wings out, spotted, a long thin tail (points right) */
  function eagleRay(x, y, sc, rot) {
    return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ') scale(' + sc + ')"><ellipse cx="0" cy="12" rx="36" ry="8" fill="#3B2925" opacity=".1"/>' +
      '<path d="M-26,0 Q-62,-3 -92,3" stroke="#4A6579" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<g class="rw"><path d="M28,0 Q12,-10 -2,-38 Q-9,-20 -24,-7 L-32,0 L-24,7 Q-9,20 -2,38 Q12,10 28,0 Z" fill="#5F7F95"/><path d="M26,0 Q10,-6 -2,-26 Q-8,-12 -20,-4" fill="none" stroke="#8FB0C4" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>' +
      '<ellipse cx="24" cy="0" rx="10" ry="7.5" fill="#6E91A8"/><circle cx="27" cy="-4" r="1.7" fill="#1B2B36"/><circle cx="27" cy="4" r="1.7" fill="#1B2B36"/>' +
      '<g fill="#FFFFFF" opacity=".9"><circle cx="6" cy="-12" r="2.3"/><circle cx="-6" cy="-21" r="1.9"/><circle cx="8" cy="11" r="2.1"/><circle cx="-8" cy="18" r="1.9"/><circle cx="-1" cy="0" r="2.5"/><circle cx="-14" cy="-6" r="1.7"/><circle cx="-14" cy="8" r="1.7"/><circle cx="14" cy="-2" r="1.6"/></g></g>';
  }
  /* a moray eel looking out of a rock */
  function moray(x, y, sc) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')"><ellipse cx="2" cy="10" rx="20" ry="7" fill="#3B2925" opacity=".12"/><ellipse cx="0" cy="4" rx="18" ry="11" fill="#9A8A80"/><ellipse cx="-5" cy="1" rx="10" ry="6" fill="#B8A89D"/><ellipse cx="6" cy="3" rx="7" ry="5" fill="#3F302C"/>' +
      '<g class="mo"><path d="M6,2 q10,-10 2,-22 q-7,-10 5,-20" stroke="#A8A24E" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M6,2 q10,-10 2,-22 q-7,-10 5,-20" stroke="#F3EBB0" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="1 8"/>' +
      '<ellipse cx="15" cy="-44" rx="10" ry="6.5" transform="rotate(-24 15 -44)" fill="#B7B15A"/><path d="M8,-43 q9,7 18,-3" stroke="#5A3B2A" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M12,-41 l1.2,2.4 l1.2,-2.4 M17,-42 l1.2,2.4 l1.2,-2.4" stroke="#FFFFFF" stroke-width="1" fill="none"/><circle cx="12" cy="-48" r="2.4" fill="#FFFFFF"/><circle cx="12.5" cy="-48" r="1.1" fill="#1B2B36"/></g></g>';
  }

  function chair(x, y, col, rot) {
    return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ') scale(1.5)"><rect x="-5" y="-3" width="10" height="9" rx="2.5" fill="' + col + '"/><rect x="-5" y="-9" width="10" height="7" rx="2.5" fill="#FFFFFF" stroke="' + col + '" stroke-width="1.6"/><path d="M-5,0 h10" stroke="#FFFFFF" stroke-width="1.4"/><rect x="-6" y="5" width="2" height="4" rx="1" fill="#B98C66"/><rect x="4" y="5" width="2" height="4" rx="1" fill="#B98C66"/></g>';
  }
  function umbrella(x, y, col) {
    return '<g transform="translate(' + x + ',' + y + ') scale(1.4)"><ellipse cx="0" cy="14" rx="14" ry="3.4" fill="#3B2925" opacity=".12"/><rect x="-1" y="-6" width="2" height="20" rx="1" fill="#B98C66"/><path d="M-17,-5 Q0,-26 17,-5 Z" fill="' + col + '"/><path d="M-17,-5 Q-9,-12 0,-5 Q9,-12 17,-5" fill="#FFFFFF" opacity=".85"/></g>';
  }
  function bush(x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#7DBE9C"/><circle cx="' + (x - r * .35) + '" cy="' + (y - r * .3) + '" r="' + r * .55 + '" fill="#97D0B1"/>'; }
  function sail(x, y, s, col) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
      '<ellipse cx="0" cy="24" rx="46" ry="8" fill="#FFFFFF" opacity=".35"/>' +
      '<path d="M-36,12 Q0,36 36,12 L30,0 H-30 Z" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="3" stroke-linejoin="round"/><path d="M-32,8 H32" stroke="' + col + '" stroke-width="4"/>' +
      '<rect x="-1.6" y="-88" width="3.2" height="92" rx="1.6" fill="#7A625B"/>' +
      '<path d="M5,-84 L5,-5 L42,-5 Z" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M-5,-74 L-5,-5 L-30,-5 Z" fill="' + col + '" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/><path d="M0,-88 l16,5 l-16,5 z" fill="' + col + '"/></g>';
  }

  function content() {
    var h = '<defs><linearGradient id="seag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#93D1E2"/><stop offset=".55" stop-color="#85C8DC"/><stop offset="1" stop-color="#6DB5D0"/></linearGradient></defs>' +
      '<rect x="-700" y="-900" width="3000" height="3200" fill="url(#seag)"/>' +
      '<g transform="' + G + '">' +
        /* the shallows round the whole shore, the rounded tip at Bando, and the reefs in the water */
        '<path d="' + SHORE + '" stroke="#C6E9F0" stroke-width="170" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="' + SHORE + '" stroke="#DDF3F7" stroke-width="72" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        reef(822, 506, 70, 42, 21) + reef(962, 636, 58, 38, 31) + reef(930, 860, 92, 78, 41) + reef(560, 890, 52, 128, 51) + reef(905, 1045, 72, 46, 61) + reef(610, 765, 84, 48, 71) + reef(380, 960, 70, 40, 81) +
        reef(760, 1170, 150, 44, 91) + reef(1010, 1175, 130, 38, 92) + reef(1260, 1182, 120, 34, 93) +
        /* land */
        '<path d="' + LAND + '" fill="#F7DCC4"/>' +
        '<path d="' + blob(1620, 560, 300, 470, 4, .14) + '" fill="#9BCDAB"/><path d="' + blob(1610, 560, 235, 400, 5, .16) + '" fill="#86C09B"/><path d="' + blob(1450, 980, 190, 80, 12, .18) + '" fill="#9BCDAB"/>' +
        '<path d="' + blob(300, 140, 420, 190, 8, .16) + '" fill="#A9D6B5"/><path d="' + blob(1020, -100, 360, 150, 9, .16) + '" fill="#A9D6B5"/><path d="' + blob(1600, 150, 280, 150, 13, .16) + '" fill="#9BCDAB"/>' +
        '<path d="' + blob(1590, 175, 120, 92, 14, .2) + '" fill="#BEE5EA"/><path d="' + blob(1590, 175, 92, 70, 15, .2) + '" fill="#A5D8E2"/>' +
        '<path d="' + blob(1400, 905, 98, 66, 16, .2) + '" fill="#BEE5EA"/><path d="' + blob(1400, 905, 72, 46, 17, .2) + '" fill="#A5D8E2"/>' +
        '<path d="' + blob(1710, 470, 55, 75, 18, .2) + '" fill="#BEE5EA"/>' +
        '<path d="' + shoreLandD + '" stroke="#FBEFE4" stroke-width="70" fill="none" opacity=".85"/>' +
        '<path d="M1180,1062 Q1300,1100 1440,1108 Q1560,1090 1660,1030 Q1780,950 1840,830 Q1900,700 1925,560 Q1945,400 1960,200" stroke="#FBEFE4" stroke-width="40" fill="none" stroke-linecap="round" opacity=".9"/>' +
        '<path d="' + blob(1128, 1082, 78, 44, 34, .08) + '" fill="#FBEFE4"/><path d="' + blob(1130, 1080, 56, 28, 35, .08) + '" fill="#FFF6EA"/>' +
        palm(1290, 1070, 1.5) + palm(1350, 1086, 1.3) +
        '<path d="' + coastD + '" stroke="#FFFFFF" stroke-width="10" fill="none" stroke-dasharray="3 26" stroke-linecap="round" opacity=".9"/>' +
        '<path d="' + roadD + '" stroke="#E9E1D8" stroke-width="64" fill="none" stroke-linecap="round"/><path d="' + roadD + '" stroke="#FFFFFF" stroke-width="50" fill="none" stroke-linecap="round"/><path d="' + roadD + '" stroke="#F5C9D6" stroke-width="6" fill="none" stroke-dasharray="38 34"/>' +
        /* waves */
        '<path d="M700,680 q22,-10 44,0 M470,700 q22,-10 44,0 M760,930 q22,-10 44,0 M1010,990 q22,-10 44,0 M1120,640 q22,-10 44,0 M300,1000 q22,-10 44,0 M640,560 q22,-10 44,0 M1000,780 q22,-10 44,0 M200,1100 q22,-10 44,0 M1500,1220 q22,-10 44,0" stroke="#FFFFFF" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>' +
        /* the ferry pier, oversized: the pink end is the land end */
        '<g transform="translate(1086,520) rotate(30)"><rect x="-44" y="-4" width="96" height="360" rx="22" fill="#3B2925" opacity=".09" transform="translate(20,20)"/>' +
          '<rect x="-48" y="-8" width="96" height="360" rx="22" fill="#F6F1EA" stroke="#D9CEC2" stroke-width="4" stroke-linejoin="round"/>' +
          '<path d="M-40,52 h80 M-40,96 h80 M-40,140 h80 M-40,184 h80 M-40,228 h80 M-40,272 h80 M-40,316 h80" stroke="#E2D8CC" stroke-width="3" stroke-linecap="round"/>' +
          '<rect x="-48" y="-8" width="96" height="34" rx="17" fill="#F5B5C8"/><rect x="-38" y="-2" width="76" height="9" rx="4.5" fill="#FAD3DF" opacity=".9"/>' +
          '<g fill="#D7CABC"><circle cx="-48" cy="110" r="7"/><circle cx="48" cy="110" r="7"/><circle cx="-48" cy="230" r="7"/><circle cx="48" cy="230" r="7"/><circle cx="-34" cy="344" r="7"/><circle cx="34" cy="344" r="7"/></g>' +
          '<g transform="translate(-92,140) scale(2.5)"><path d="M-11,0 Q0,-14 11,0 V66 Q0,74 -11,66 Z" fill="#FFFFFF" stroke="#E6DCD2" stroke-width="1.5"/><rect x="-6" y="14" width="12" height="30" rx="3" fill="#B9E2EA"/><path d="M-11,56 H11" stroke="#EC5C97" stroke-width="3"/></g>' +
        '</g>' +
      '</g>';
    /* the little things, drawn upright in map coordinates */
    h += '<g class="bc bc-sail" data-crit="sail">' + sail(X(1125), Y(1125, 745), 0.46, '#EC5C97') + '</g><g class="bc bc-sail" data-crit="sail">' + sail(X(1178), Y(1178, 786), 0.44, '#F2A66B') + '</g><g class="bc bc-sail" data-crit="sail">' + sail(X(1120), Y(1120, 822), 0.42, '#7FC6D6') + '</g>';
    /* one cluster of reef fish, on the south reef, well away from the dock */
    h += '<g data-crit="fish">' + school(436, 524, '#F5B5C8', 3, 16, 8) + school(468, 530, '#F2A66B', 3, 16, -10) + school(450, 552, '#7FC6D6', 3, 16, 172) + school(480, 550, '#EC5C97', 2, 12, 6) +
      fish(452, 538, 1.2, -8, '#F7D365') + fish(470, 543, 1.05, 170, '#EC5C97') + '</g>';
    var ox = 266, oy = 360, bx = 150, by = 418;
    /* the cluster over the little reef: two octopus, a spotted eagle ray gliding past, a moray looking out of its rock */
    h += '<g class="bc bc-oct" data-crit="octopus">' + octopus(ox, oy, 0.5) + '<g class="bc-ink" data-crit="octopus"><circle cx="' + (ox - 12) + '" cy="' + (oy + 6) + '" r="7" fill="#7A5A8D"/><circle cx="' + (ox + 11) + '" cy="' + (oy + 8) + '" r="8" fill="#7A5A8D"/><circle cx="' + ox + '" cy="' + (oy + 16) + '" r="6" fill="#8B6A9C"/></g></g>' +
      '<g class="bc bc-oct" data-crit="octopus">' + octopus(302, 382, 0.34) + '</g>' +
      '<g class="bc bc-ray" data-crit="bayray">' + eagleRay(330, 452, 0.5, -24) + '</g>' +
      '<g class="bc bc-moray" data-crit="moray">' + moray(240, 462, 0.7) + '</g>';
    /* the dive boat tied to its buoy, with the one dive flag */
    h += '<path d="M' + (bx + 34) + ',' + (by + 12) + ' Q' + (bx + 52) + ',' + (by + 20) + ' ' + (bx + 70) + ',' + (by + 14) + '" stroke="#7A625B" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-dasharray="3 2"/>' +
      '<g class="bc bc-buoy" data-crit="diveboat">' + mooring(bx + 74, by + 12, 0.62) + '</g>' +
      '<g class="bc bc-dive" data-crit="diveboat">' + diveBoat(bx, by, 0.5) + '<g class="bc-bub" data-crit="diveboat"><circle cx="' + (bx - 38) + '" cy="' + (by + 14) + '" r="2.4" fill="#FFFFFF"/><circle cx="' + (bx - 44) + '" cy="' + (by + 8) + '" r="1.8" fill="#FFFFFF"/><circle cx="' + (bx - 36) + '" cy="' + (by + 4) + '" r="1.4" fill="#FFFFFF"/></g></g>';
    /* the two clusters of buildings */
    h += town() + neighbourhood();
    /* chairs on Bando Beach */
    h += umbrella(574, 546, '#EC5C97') + umbrella(632, 548, '#7FC6D6') +
      chair(558, 566, '#7FC6D6', -10) + chair(584, 570, '#F2A66B', 6) + chair(612, 562, '#EC5C97', -4) + chair(638, 568, '#F5B5C8', 8) + chair(662, 562, '#F2A66B', 4) +
      '<rect x="592" y="581" width="22" height="9" rx="4" fill="#FFFFFF" stroke="#F5B5C8" stroke-width="2" transform="rotate(-6 603 585)"/>';
    h += '<g transform="translate(860,50)" fill="#7A625B"><path d="M0,-20 l9,22 h-18 z"/><text y="22" font-size="16" font-weight="800" font-family="Nunito,sans-serif" text-anchor="middle">N</text></g>';
    /* Josie's hanging sign, oversized, on the land beside the dock end: a tall post with a long arm */
    h += '<g transform="translate(-60,0)"><ellipse cx="645" cy="233" rx="28" ry="7" fill="#3B2925" opacity=".14"/>' +
      '<rect x="638" y="26" width="14" height="206" rx="4" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="3"/><rect x="633" y="16" width="24" height="12" rx="4" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="3"/>' +
      '<rect x="478" y="34" width="174" height="11" rx="4" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="3"/>' +
      '<path d="M638,76 L612,48" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/><path d="M638,76 L612,48" stroke="#E2D7CC" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M520,45 V62 M606,45 V54" stroke="#7A625B" stroke-width="2.5" stroke-dasharray="4 3"/>' +
      '<image href="/img/sign.png" x="496" y="56" width="132" height="162"/></g>';
    return h;
  }
  w.J2BAY = {
    sign: [436, 56, 132, 162],
    layer: function () {
      return '<svg class="baylayer" width="1440" height="1240" viewBox="0 0 1440 1240" role="img" aria-label="Map of Utila Bay: Josie\'s Cafe is at the land end of the ferry dock, on the ferry road just off Main Street">' + content() + '</svg>';
    },
    thumb: function () {
      return '<svg viewBox="150 0 820 640" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + content().replace(/bayclip/g, 'bayclip2').replace('id="seag"', 'id="seag2"').replace('url(#seag)', 'url(#seag2)') + '</svg>';
    }
  };
}(window));
