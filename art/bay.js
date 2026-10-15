/* Josie's World · the bay map for the website's home page, drawn from the real shape of Utila's bay (traced from the satellite view):
   the town and road along the north and east shore, the reef flats to the south, Josie's at the ferry dock. North is up. The pier and
   the hanging sign are drawn oversized; the boats are small. Plain ES5. */
(function (w) {
  'use strict';
  /* picture coordinates (the satellite view, 1914 x 1326) -> map design box (1440 x 1240): north up, scaled K, nudged right */
  var K = 0.56, OX = 130, OY = 50;
  function X(x) { return +(K * x + OX).toFixed(1); }
  function Y(x, y) { return +(K * y + OY).toFixed(1); }
  var G = 'translate(' + OX + ',' + OY + ') scale(' + K + ')';

  /* the coast, traced along the red line: north shore (left to right), then down the east shore, then round to the reef */
  var COAST = [[-500, 560], [10, 400], [100, 330], [200, 250], [300, 160], [400, 120], [520, 85], [650, 70], [760, 80], [870, 95], [1000, 105], [1080, 125], [1140, 170], [1200, 215], [1280, 270], [1340, 340], [1380, 430], [1392, 560], [1386, 680], [1370, 780], [1345, 845], [1352, 940], [1285, 1020], [1200, 1075], [1160, 1082], [1060, 1100], [960, 1150], [850, 1200], [740, 1232]];
  function smooth(p, close) {
    var d = 'M' + p[0][0] + ',' + p[0][1], i, mx, my;
    for (i = 1; i < p.length - 1; i++) { mx = (p[i][0] + p[i + 1][0]) / 2; my = (p[i][1] + p[i + 1][1]) / 2; d += ' Q' + p[i][0] + ',' + p[i][1] + ' ' + mx.toFixed(1) + ',' + my.toFixed(1); }
    d += ' L' + p[p.length - 1][0] + ',' + p[p.length - 1][1];
    return d;
  }
  /* a line parallel to the coast, pushed toward the land by `off` */
  function offset(p, off) {
    var out = [], i, a, b, tx, ty, l;
    for (i = 0; i < p.length; i++) {
      a = p[Math.max(0, i - 1)]; b = p[Math.min(p.length - 1, i + 1)]; tx = b[0] - a[0]; ty = b[1] - a[1]; l = Math.sqrt(tx * tx + ty * ty) || 1;
      out.push([+(p[i][0] + ty / l * off).toFixed(1), +(p[i][1] - tx / l * off).toFixed(1)]);
    }
    return out;
  }
  var coastD = smooth(COAST), roadD = smooth(offset(COAST.slice(1, 23), 62)), shoreLandD = smooth(offset(COAST, 14));
  var WATER = coastD + ' L740,1232 L-500,1232 Z';

  /* little town: a few small houses with pink and cream roofs, set back from the road, in groups with gaps */
  function houses() {
    var out = '', pts = COAST.slice(2, 23), i, j, a, b, n, px, py, t, tx, ty, l, k, hsh, roofs = ['#F5B5C8', '#F2A66B', '#EAD9C5', '#F5B5C8', '#C9A98F'], ang;
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
    return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ') scale(' + sc + ')"><path d="M-9,0 L-18,-7 L-18,7 Z" fill="' + col + '"/><ellipse cx="0" cy="0" rx="11" ry="6.5" fill="' + col + '"/><path d="M-2,-6 Q3,-2 -2,6" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".7"/><circle cx="6" cy="-1.5" r="1.5" fill="#3B2925"/></g>';
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
    var h = '<rect x="-700" y="-900" width="3000" height="3200" fill="#F7DCC4"/>' +
      '<g transform="' + G + '">' +
        /* land: mangrove green far in, then the town */
        '<path d="' + blob(1700, 700, 330, 520, 4, .16) + '" fill="#9BCDAB"/><path d="' + blob(1690, 700, 270, 440, 5, .18) + '" fill="#86C09B"/><path d="' + blob(1585, 735, 115, 150, 6, .2) + '" fill="#BEE5EA"/><path d="' + blob(1585, 735, 90, 120, 7, .2) + '" fill="#A5D8E2"/>' +
        '<path d="' + blob(1560, 140, 210, 110, 8, .2) + '" fill="#9BCDAB"/><path d="' + blob(1000, -60, 230, 90, 9, .2) + '" fill="#A9D6B5"/><path d="' + blob(520, -40, 190, 80, 10, .2) + '" fill="#A9D6B5"/>' +
        '<path d="' + blob(1560, 1010, 150, 90, 11, .2) + '" fill="#9BCDAB"/>' +
        palm(1330, 1030, 1.1) + palm(1260, 1065, .9) + palm(1395, 985, .95) +
        '<path d="' + shoreLandD + '" stroke="#FBEFE4" stroke-width="64" fill="none" opacity=".8"/>' +
        houses() +
        /* the outer reef sea to the south */
        '<path d="M-500,1232 L740,1232 L900,1250 L1200,1235 L1500,1195 L1780,1138 L2400,1138 L2400,1900 L-500,1900 Z" fill="#B7E7DE"/>' +
        '<path d="M740,1232 L900,1250 L1200,1235 L1500,1195 L1780,1138" stroke="#FBEFE4" stroke-width="40" fill="none" stroke-linecap="round"/>' +
        /* the bay */
        '<clipPath id="bayclip"><path d="' + WATER + '"/></clipPath><path d="' + WATER + '" fill="#8FCFE0"/>' +
        '<g clip-path="url(#bayclip)"><path d="' + coastD + '" stroke="#C6E9F0" stroke-width="150" fill="none"/><path d="' + coastD + '" stroke="#DDF3F7" stroke-width="64" fill="none"/>' +
          reef(470, 320, 150, 105, 21) + reef(850, 770, 170, 150, 31) + reef(255, 600, 110, 62, 41) + reef(235, 930, 130, 200, 51) + reef(770, 1150, 230, 80, 61) + reef(880, 440, 100, 62, 71) +
          reef(1020, 1010, 70, 45, 81) + reef(560, 960, 60, 40, 91) + '</g>' +
        '<path d="' + coastD + '" stroke="#FFFFFF" stroke-width="10" fill="none" stroke-dasharray="3 26" stroke-linecap="round" opacity=".9"/>' +
        /* the road along the shore */
        '<path d="' + roadD + '" stroke="#E9E1D8" stroke-width="64" fill="none" stroke-linecap="round"/><path d="' + roadD + '" stroke="#FFFFFF" stroke-width="50" fill="none" stroke-linecap="round"/><path d="' + roadD + '" stroke="#F5C9D6" stroke-width="6" fill="none" stroke-dasharray="38 34"/>' +
        /* the ferry pier, oversized: the pink end is the land end */
        '<g transform="translate(1062,170) rotate(30.2)"><rect x="-58" y="-6" width="116" height="560" rx="12" fill="#3B2925" opacity=".1" transform="translate(26,26)"/>' +
          '<rect x="-65" y="-10" width="130" height="560" rx="12" fill="#F6F1EA" stroke="#D2C6BA" stroke-width="7"/>' +
          '<path d="M-65,50 h130 M-65,100 h130 M-65,150 h130 M-65,200 h130 M-65,250 h130 M-65,300 h130 M-65,350 h130 M-65,400 h130 M-65,450 h130 M-65,500 h130" stroke="#D2C6BA" stroke-width="4"/>' +
                    '<rect x="-65" y="-10" width="130" height="36" rx="10" fill="#F5B5C8"/>' +
          '<g fill="#CDBFB0" stroke="#B9AB9C" stroke-width="3"><circle cx="-65" cy="140" r="12"/><circle cx="65" cy="140" r="12"/><circle cx="-65" cy="300" r="12"/><circle cx="65" cy="300" r="12"/><circle cx="-65" cy="460" r="12"/><circle cx="65" cy="460" r="12"/><circle cx="-65" cy="548" r="12"/><circle cx="65" cy="548" r="12"/></g>' +
          '<g transform="translate(-118,230) scale(3.4)"><path d="M-11,0 Q0,-14 11,0 V66 Q0,74 -11,66 Z" fill="#FFFFFF" stroke="#E6DCD2" stroke-width="1.5"/><rect x="-6" y="14" width="12" height="30" rx="3" fill="#B9E2EA"/><path d="M-11,56 H11" stroke="#EC5C97" stroke-width="3"/></g>' +
        '</g>' +
      '</g>';
    /* waves, boats and words are drawn upright in the map's own coordinates */
    h += '<path d="M640,420 q18,-8 36,0 M700,610 q18,-8 36,0 M520,690 q18,-8 36,0 M860,520 q18,-8 36,0 M960,690 q18,-8 36,0 M1180,470 q18,-8 36,0 M1260,640 q18,-8 36,0 M820,330 q18,-8 36,0 M1100,380 q18,-8 36,0" stroke="#FFFFFF" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".85"/>';
    /* three sailboats anchored together */
    h += sail(778, 352, 0.46, '#EC5C97') + sail(832, 384, 0.44, '#F2A66B') + sail(784, 418, 0.42, '#7FC6D6');
    /* fish over the reefs */
    h += school(X(850), Y(850, 770), '#F2A66B', 5, 26, -8) + school(X(880), Y(880, 800), '#7FC6D6', 3, 18, 170) + school(X(470), Y(470, 320), '#F5B5C8', 4, 24, 12) + school(X(235), Y(235, 930), '#F2A66B', 4, 22, -4) + school(X(770), Y(770, 1150), '#EC5C97', 4, 26, 6) + school(X(1020), Y(1020, 1010), '#7FC6D6', 3, 14, -170);
    /* Sturch Bank dive site, left side of the cove: dive boat, buoy, octopus on the reef */
    h += octopus(X(255), Y(255, 600) - 6, 0.55) + buoy(214, 352, 0.6) + diveBoat(132, 448, 0.55);
    h += '<g transform="translate(900,52)" fill="#7A625B"><path d="M0,-20 l9,22 h-18 z"/><text y="22" font-size="16" font-weight="800" font-family="Nunito,sans-serif" text-anchor="middle">N</text></g>' +
      /* Josie's hanging sign, oversized, at the land end of the pier */
      '<g transform="translate(80,50)"><ellipse cx="731" cy="104" rx="26" ry="6" fill="#3B2925" opacity=".14"/>' +
      '<rect x="724" y="14" width="14" height="90" rx="4" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="3"/><rect x="719" y="6" width="24" height="12" rx="4" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="3"/>' +
      '<rect x="566" y="18" width="168" height="11" rx="4" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="3"/>' +
      '<path d="M724,50 L700,26" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/><path d="M724,50 L700,26" stroke="#E2D7CC" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M606,29 V44 M690,29 V38" stroke="#7A625B" stroke-width="2.5" stroke-dasharray="4 3"/>' +
      '<image href="/img/sign.png" x="582" y="38" width="132" height="162"/></g>';
    return h;
  }
  w.J2BAY = {
    sign: [662, 88, 132, 162],
    layer: function () {
      return '<svg class="baylayer" width="1440" height="1240" viewBox="0 0 1440 1240" role="img" aria-label="Map of Utila Bay: Josie\'s Cafe is at the land end of the ferry dock, on the ferry road just off Main Street">' + content() + '</svg>';
    },
    thumb: function () {
      return '<svg viewBox="60 20 860 620" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + content().replace('id="bayclip"', 'id="bayclip2"').replace('url(#bayclip)', 'url(#bayclip2)') + '</svg>';
    }
  };
}(window));
