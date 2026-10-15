/* Josie's World · the bay map (from the simple map on the site: Utila Bay, the ferry dock, the road, and Josie's hanging sign).
   The sign is the fixed point between the two maps: layer() lines the bay up so its sign sits exactly where the sign is on the cafe map
   (design box 1440 x 1240, sign at 114,92, 132 wide), so flipping between them the sign does not move. Plain ES5. */
(function (w) {
  'use strict';
  var COAST = 'M-600,185 L0,135 C60,105 120,92 190,100 C260,108 300,140 345,180 C400,228 460,280 520,320 L1900,1180';
  function content(withSign) {
    var h = '<rect x="-700" y="-700" width="3000" height="3000" fill="#FBEFE4"/>' +
      '<path d="' + COAST + ' L1900,1500 L-600,1500 Z" fill="#7FC6D6"/>' +
      '<path d="' + COAST + '" stroke="#B9E2EA" stroke-width="30" fill="none"/>' +
      '<path d="' + COAST + ' L1900,-700 L-600,-700 Z" fill="#FBEFE4"/>' +
      '<path d="M70,300 q14,-6 28,0 M150,250 q14,-6 28,0 M60,210 q12,-5 24,0 M300,330 q14,-6 28,0 M420,380 q14,-6 28,0 M210,420 q14,-6 28,0 M520,470 q14,-6 28,0 M120,480 q14,-6 28,0 M380,560 q14,-6 28,0 M250,640 q14,-6 28,0" stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>' +
      '<g transform="translate(46,-58)"><path d="' + COAST + '" stroke="#E9E1D8" stroke-width="16" fill="none" stroke-linecap="round"/><path d="' + COAST + '" stroke="#FFFFFF" stroke-width="12" fill="none" stroke-linecap="round"/></g>' +
      '<path d="M345,180 L396.5,121.4" stroke="#E9E1D8" stroke-width="14" stroke-linecap="round"/><path d="M345,180 L396.5,121.4" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>' +
      '<g transform="translate(345,180) rotate(41.3)"><rect x="-13" y="-4" width="26" height="150" rx="4" fill="#F6F1EA" stroke="#D2C6BA" stroke-width="2"/>' +
      '<path d="M-13,24 h26 M-13,52 h26 M-13,80 h26 M-13,108 h26 M-13,136 h26" stroke="#D2C6BA" stroke-width="1.5"/>' +
      '<g transform="translate(34,58)"><path d="M-11,0 Q0,-14 11,0 V66 Q0,74 -11,66 Z" fill="#FFFFFF" stroke="#E6DCD2" stroke-width="1.5"/><rect x="-6" y="14" width="12" height="30" rx="3" fill="#B9E2EA"/><path d="M-11,56 H11" stroke="#EC5C97" stroke-width="3"/></g></g>' +
      '<ellipse cx="372" cy="191" rx="16" ry="4" fill="#3B2925" opacity=".14"/>' +
      '<rect x="367" y="22" width="10" height="169" rx="2" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="1.5"/><rect x="364" y="16" width="16" height="8" rx="2" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="1.5"/>' +
      '<rect x="272" y="25" width="105" height="8" rx="2" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="1.5"/>' +
      '<path d="M367,58 L343,33" stroke="#FFFFFF" stroke-width="5.5" stroke-linecap="round"/><path d="M367,58 L343,33" stroke="#E2D7CC" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M302,33 V58 M346,33 V46" stroke="#7A625B" stroke-width="1.5" stroke-dasharray="2.5 1.5"/>';
    if (withSign) { h += '<image href="/img/sign.png" x="280" y="42" width="84" height="108"/>'; }
    return h;
  }
  var K = 132 / 84, OX = 114 - 280 * K, OY = 92 - 42 * K;          // bay units -> cafe-map design units, sign on sign
  var B = w.J2BAY = {
    /* full-size layer in cafe-map design coordinates; sign lines up with the cafe map's sign */
    layer: function () {
      return '<svg class="baylayer" width="1440" height="1240" viewBox="0 0 1440 1240" role="img" aria-label="Map of Utila Bay: Josie\'s Cafe is at the land end of the ferry dock, on the ferry road just off Main Street">' +
        '<g transform="translate(' + OX + ',' + OY + ') scale(' + K + ')">' + content(true) + '</g>' +
        '<g transform="translate(46,60)" fill="#7A625B"><path d="M0,-18 l9,21 h-18 z"/><text y="26" font-size="20" font-weight="800" text-anchor="middle" font-family="Nunito,sans-serif">N</text></g></svg>';
    },
    /* the small inset: the whole bay as the simple map showed it */
    thumb: function () {
      return '<svg viewBox="0 0 520 360" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + content(true) + '</svg>';
    }
  };
}(window));
