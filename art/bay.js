/* Josie's World · the bay map for the website's home page. Mostly bay (about two thirds), with the shore, the road and Josie's hanging sign
   around it, an oversized ferry pier and a few anchored sailboats. Drawn in the cafe map's design box (1440 x 1240) so the hanging sign sits
   exactly where it sits on the cafe map: flipping between the two, the sign does not move. Plain ES5. */
(function (w) {
  'use strict';
  var SHORE = 'M-100,290 C250,310 450,290 700,245 S1150,155 1540,150';
  var ROAD = 'M-100,205 C250,225 450,205 700,160 S1150,70 1540,66';
  function sail(x, y, s, rot, col) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ') rotate(' + rot + ')">' +
      '<ellipse cx="0" cy="24" rx="58" ry="11" fill="#FFFFFF" opacity=".35"/><ellipse cx="0" cy="24" rx="40" ry="7" fill="#FFFFFF" opacity=".35"/>' +
      '<path d="M-72,34 Q-60,26 -48,14" stroke="#7A625B" stroke-width="2.5" stroke-dasharray="4 4" fill="none"/>' +
      '<path d="M-36,12 Q0,36 36,12 L30,0 H-30 Z" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="3" stroke-linejoin="round"/><path d="M-32,8 H32" stroke="' + col + '" stroke-width="4"/>' +
      '<rect x="-1.6" y="-88" width="3.2" height="92" rx="1.6" fill="#7A625B"/>' +
      '<path d="M5,-84 L5,-5 L42,-5 Z" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M-5,-74 L-5,-5 L-30,-5 Z" fill="' + col + '" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M0,-88 l16,5 l-16,5 z" fill="' + col + '"/></g>';
  }
  function bush(x, y, r) { return '<ellipse cx="' + x + '" cy="' + (y + r * .8) + '" rx="' + r * 1.1 + '" ry="' + r * .25 + '" fill="#3B2925" opacity=".12"/><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#7DBE9C"/><circle cx="' + (x - r * .4) + '" cy="' + (y - r * .3) + '" r="' + r * .55 + '" fill="#97D0B1"/>'; }
  function content() {
    var h = '<rect x="-700" y="-500" width="3000" height="2600" fill="#8FCFE0"/>' +
      '<path d="M-100,600 C300,520 700,560 1000,470 S1400,380 1600,330" stroke="#A8DBE8" stroke-width="150" fill="none" opacity=".55"/>' +
      '<path d="' + SHORE + '" stroke="#C6E9F0" stroke-width="66" fill="none"/><path d="' + SHORE + '" stroke="#DDF3F7" stroke-width="30" fill="none"/>' +
      '<path d="' + SHORE + ' L1600,-500 L-100,-500 Z" fill="#F7DCC4"/>' +
      '<path d="M-100,290 C250,310 450,290 700,245 S1150,155 1540,150" stroke="#FFFFFF" stroke-width="7" fill="none" stroke-dasharray="2 22" stroke-linecap="round" transform="translate(0,42)" opacity=".9"/>' +
      '<path d="' + ROAD + '" stroke="#E9E1D8" stroke-width="46" fill="none" stroke-linecap="round"/><path d="' + ROAD + '" stroke="#FFFFFF" stroke-width="36" fill="none" stroke-linecap="round"/>' +
      '<path d="' + ROAD + '" stroke="#F5C9D6" stroke-width="4" fill="none" stroke-dasharray="26 22" transform="translate(0,0)"/>' +
      bush(560, 108, 30) + bush(610, 118, 20) + bush(930, 52, 34) + bush(1010, 44, 24) + bush(1240, 30, 30) +
      /* waves */
      '<path d="M120,420 q18,-8 36,0 M240,520 q18,-8 36,0 M110,640 q18,-8 36,0 M420,600 q18,-8 36,0 M690,720 q18,-8 36,0 M1050,330 q18,-8 36,0 M1290,520 q18,-8 36,0 M1200,700 q18,-8 36,0 M830,520 q18,-8 36,0 M960,610 q18,-8 36,0 M330,700 q18,-8 36,0" stroke="#FFFFFF" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".8"/>' +
      /* the pier, oversized */
      '<g transform="translate(335,282) rotate(-28)">' +
        '<ellipse cx="14" cy="250" rx="70" ry="250" fill="#3B2925" opacity=".1" transform="translate(30,30)"/>' +
        '<rect x="-40" y="-6" width="80" height="476" rx="8" fill="#F6F1EA" stroke="#D2C6BA" stroke-width="4"/>' +
        '<path d="M-40,40 h80 M-40,80 h80 M-40,120 h80 M-40,160 h80 M-40,200 h80 M-40,240 h80 M-40,280 h80 M-40,320 h80 M-40,360 h80 M-40,400 h80 M-40,440 h80" stroke="#D2C6BA" stroke-width="2.5"/>' +
        '<rect x="-96" y="448" width="192" height="64" rx="10" fill="#F6F1EA" stroke="#D2C6BA" stroke-width="4"/><path d="M-96,480 h192" stroke="#D2C6BA" stroke-width="2.5"/>' +
        '<rect x="-40" y="-6" width="80" height="22" rx="6" fill="#F5B5C8"/>' +
        '<g fill="#CDBFB0" stroke="#B9AB9C" stroke-width="2"><circle cx="-40" cy="100" r="8"/><circle cx="40" cy="100" r="8"/><circle cx="-40" cy="220" r="8"/><circle cx="40" cy="220" r="8"/><circle cx="-40" cy="340" r="8"/><circle cx="40" cy="340" r="8"/><circle cx="-96" cy="512" r="8"/><circle cx="96" cy="512" r="8"/><circle cx="-96" cy="448" r="8"/><circle cx="96" cy="448" r="8"/></g>' +
      '</g>' +
      /* the ferry, alongside */
      '<g transform="translate(486,586) rotate(-28) scale(2.7)"><path d="M-11,0 Q0,-14 11,0 V66 Q0,74 -11,66 Z" fill="#FFFFFF" stroke="#E6DCD2" stroke-width="1.5"/><rect x="-6" y="14" width="12" height="30" rx="3" fill="#B9E2EA"/><path d="M-11,56 H11" stroke="#EC5C97" stroke-width="3"/></g>' +
      sail(800, 440, 1.15, -3, '#EC5C97') + sail(1010, 540, 1.3, 2, '#F2A66B') + sail(850, 650, 1, -2, '#7FC6D6') + sail(1240, 420, 1.1, 3, '#EC5C97') + sail(1180, 660, 1.2, -3, '#B55573') +
      '<g font-family="Baloo 2,Nunito,sans-serif" font-weight="800" text-anchor="middle"><text x="1010" y="360" font-size="64" fill="#FFFFFF" opacity=".75">Utila Bay</text></g>' +
      '<g transform="translate(430,430) rotate(-28)"><rect x="-70" y="-24" width="140" height="48" rx="24" fill="#FFFFFF" stroke="#F5B5C8" stroke-width="4"/><text y="9" font-family="Baloo 2,Nunito,sans-serif" font-weight="800" font-size="26" fill="#B55573" text-anchor="middle">Ferry dock</text></g>' +
      /* Josie's hanging sign: the fixed point (same place as on the cafe map) */
      '<ellipse cx="270" cy="335" rx="34" ry="8" fill="#3B2925" opacity=".14"/>' +
      '<rect x="262" y="66" width="16" height="268" rx="4" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="3"/><rect x="256" y="52" width="28" height="16" rx="4" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="3"/>' +
      '<rect x="70" y="74" width="208" height="14" rx="4" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="3"/>' +
      '<path d="M262,120 L228,86" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round"/><path d="M262,120 L228,86" stroke="#E2D7CC" stroke-width="2" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M138,88 V104 M222,88 V98" stroke="#7A625B" stroke-width="3" stroke-dasharray="4 3"/>' +
      '<image href="/img/sign.png" x="114" y="92" width="132" height="162"/>';
    return h;
  }
  w.J2BAY = {
    layer: function () {
      return '<svg class="baylayer" width="1440" height="1240" viewBox="0 0 1440 1240" role="img" aria-label="Map of Utila Bay: Josie\'s Cafe is at the land end of the ferry dock, on the ferry road just off Main Street">' + content() + '</svg>';
    },
    thumb: function () {
      return '<svg viewBox="60 20 860 620" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + content() + '</svg>';
    }
  };
}(window));
