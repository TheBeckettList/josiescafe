/* Josie's World · one icon per menu item. Each is built from the art kit: a base picture (cup, plate, bagel, bowl...) with the item's key
   ingredients stuck on as little round stickers, so a chai latte, a honey cinnamon latte and a dirty chai all look related but different.
   The pastries are drawn here. Registers every icon in J2ART.menu; J2ART.keyFor("Chai latte") gives the key (or null). Needs art/art.js. Plain ES5. */
(function (w) {
  'use strict';
  var ART = w.J2ART; if (!ART) { return; }
  function slug(en) { return String(en || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  /* a round ingredient sticker from the kit */
  function sticker(ing, cx, cy, r) {
    var e = ART.ing[ing]; if (!e) { return ''; }
    var s = (r * 2 * 0.86) / 48;
    return '<circle cx="' + cx + '" cy="' + (cy + .6) + '" r="' + (r + 1.2) + '" fill="#3B2925" opacity=".12"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#FFFFFF" stroke="#F5C9D6" stroke-width="1.4"/>' +
      '<g transform="translate(' + (cx - 24 * s).toFixed(2) + ',' + (cy - 24 * s).toFixed(2) + ') scale(' + s.toFixed(3) + ')">' + e.svg + '</g>';
  }
  var SPOTS = { 1: [[35, 35]], 2: [[36, 36], [13, 37]] };

  /* ── drawn icons (48 x 48, flat pastel shapes like the kit) ── */
  var D = {};
  D['key-lime-pie'] = { bg: '#E7F4D2', svg: '<path d="M5 31 L43 31 L41 40 Q24 46 7 40 Z" fill="#D9A15F"/><path d="M6 33 L42 33 L41 36 Q24 41 7 36 Z" fill="#E8B777"/><path d="M7 20 L41 20 L43 31 L5 31 Z" fill="#C5E58F"/><path d="M9 22 L39 22 L40 25 L8 25 Z" fill="#DDF2B0" opacity=".8"/><path d="M12 20 q1 -7 6 -4 q3 -6 7 -2 q5 -4 7 3 q4 -2 5 3 z" fill="#FFF8EC"/><circle cx="24" cy="12" r="6.5" fill="#8FB98B"/><circle cx="24" cy="12" r="5" fill="#D3EAA6"/><path d="M24 7 V17 M19 9.5 L29 14.5 M29 9.5 L19 14.5" stroke="#8FB98B" stroke-width="1"/>' };
  D['cinnamon-streusel-muffin'] = { bg: '#FBE3CC', svg: '<path d="M10 28 L38 28 L35 43 Q24 45 13 43 Z" fill="#F5B5C8"/><path d="M15 28 L17 43 M21 28 L22 44 M27 28 L26 44 M33 28 L31 43" stroke="#EE95B3" stroke-width="1.6"/><path d="M7 28 Q5 14 24 12 Q43 14 41 28 Z" fill="#E2A66A"/><path d="M10 24 Q12 16 24 15 Q34 16 38 24 Z" fill="#EDBB82" opacity=".8"/><g fill="#B98050"><circle cx="15" cy="21" r="2.4"/><circle cx="22" cy="17" r="2.4"/><circle cx="30" cy="19" r="2.6"/><circle cx="35" cy="24" r="2.2"/><circle cx="19" cy="25" r="2"/><circle cx="27" cy="25" r="2.2"/></g><g fill="#F6DDB0"><circle cx="18" cy="19" r="1.4"/><circle cx="26" cy="21" r="1.4"/><circle cx="33" cy="21" r="1.3"/></g>' };
  D['protein-balls'] = { bg: '#F3E6D2', svg: '<g><ellipse cx="24" cy="41" rx="19" ry="3" fill="#3B2925" opacity=".1"/><circle cx="15" cy="32" r="9.5" fill="#C99A66"/><circle cx="33" cy="32" r="9.5" fill="#C28F5B"/><circle cx="24" cy="19" r="9.5" fill="#CFA06C"/></g><g fill="#EBD3A4"><ellipse cx="12" cy="29" rx="2.6" ry="1.2" transform="rotate(-30 12 29)"/><ellipse cx="18" cy="35" rx="2.6" ry="1.2" transform="rotate(25 18 35)"/><ellipse cx="31" cy="29" rx="2.6" ry="1.2" transform="rotate(20 31 29)"/><ellipse cx="22" cy="15" rx="2.6" ry="1.2" transform="rotate(-20 22 15)"/><ellipse cx="28" cy="22" rx="2.6" ry="1.2"/></g><g fill="#5A3626"><path d="M14 35 l3 0 l-1.5 3 z"/><path d="M34 35 l3 0 l-1.5 3 z"/><path d="M25 17 l3 0 l-1.5 3 z"/><path d="M30 31 l3 0 l-1.5 3 z"/><path d="M19 22 l3 0 l-1.5 3 z"/></g><circle cx="21" cy="14" r="2.2" fill="#E6C48F" opacity=".7"/>' };
  D['chocolate-chip-banana-bread'] = { bg: '#FDEDF1', svg: '<rect x="5" y="17" width="38" height="23" rx="7" fill="#C98A52"/><rect x="8" y="12" width="32" height="13" rx="6.5" fill="#E2A66A"/><g fill="#4A2C20"><path d="M13 19 l4 0 l-2 4 z"/><path d="M22 15 l4 0 l-2 4 z"/><path d="M31 19 l4 0 l-2 4 z"/><path d="M18 29 l4 0 l-2 4 z"/><path d="M28 31 l4 0 l-2 4 z"/><path d="M12 32 l4 0 l-2 4 z"/><path d="M35 28 l3.4 0 l-1.7 3.4 z"/></g><g fill="#F7D35C" opacity=".95"><circle cx="24" cy="26" r="2"/><circle cx="14" cy="26" r="1.6"/><circle cx="35" cy="22" r="1.6"/></g>' };
  D['pumpkin-pie'] = { bg: '#FCE3C8', svg: '<path d="M5 31 L43 31 L41 40 Q24 46 7 40 Z" fill="#D9A15F"/><path d="M6 33 L42 33 L41 36 Q24 41 7 36 Z" fill="#E8B777"/><path d="M7 19 L41 19 L43 31 L5 31 Z" fill="#E8913E"/><path d="M9 21 L39 21 L40 24 L8 24 Z" fill="#F2A95C" opacity=".85"/><path d="M13 19 q1 -7 6 -4 q3 -6 7 -2 q5 -3 7 3 q3 -1 4 3 z" fill="#FFF8EC"/><path d="M20 12 q4 -4 8 0" stroke="#B98050" stroke-width="1.4" fill="none"/><path d="M23 6 q3 -3 6 0 q-2 4 -6 3 z" fill="#8FB98B"/><g fill="#B25E24"><circle cx="14" cy="27" r="1"/><circle cx="24" cy="26" r="1"/><circle cx="33" cy="27" r="1"/><circle cx="20" cy="29" r=".8"/><circle cx="29" cy="29" r=".8"/></g>' };
  D['chocolate-chip-cookies'] = { bg: '#FBE3CC', svg: '<ellipse cx="24" cy="41" rx="17" ry="2.6" fill="#3B2925" opacity=".1"/><circle cx="20" cy="25" r="15" fill="#D9A15F"/><circle cx="20" cy="25" r="12.5" fill="#E5B677"/><circle cx="33" cy="30" r="11" fill="#D39A58"/><circle cx="33" cy="30" r="9" fill="#E0B070"/><g fill="#5A3626"><path d="M13 20 l4 0 l-2 4 z"/><path d="M22 17 l4 0 l-2 4 z"/><path d="M19 27 l4 0 l-2 4 z"/><path d="M12 29 l4 0 l-2 4 z"/><path d="M29 26 l3.4 0 l-1.7 3.4 z"/><path d="M34 33 l3.4 0 l-1.7 3.4 z"/><path d="M30 35 l3 0 l-1.5 3 z"/></g>' };
  D['carrot-cake'] = { bg: '#FDEBD3', svg: '<path d="M6 36 L42 36 L41 42 Q24 45 7 42 Z" fill="#C98A52"/><path d="M6 27 L42 27 L42 36 L6 36 Z" fill="#D69A5C"/><path d="M6 31 L42 31" stroke="#FFF6E8" stroke-width="3.4"/><path d="M6 20 L42 20 L42 27 L6 27 Z" fill="#D69A5C"/><path d="M5 19 Q24 15 43 19 L43 24 Q36 25 30 23 Q24 26 18 23 Q10 25 5 24 Z" fill="#FFF6E8"/><g fill="#B98050"><circle cx="13" cy="33" r="1.3"/><circle cx="22" cy="38" r="1.3"/><circle cx="32" cy="34" r="1.3"/><circle cx="16" cy="23" r="1.2"/><circle cx="35" cy="24" r="1.2"/></g><path d="M21 12 L29 12 L26 3 Z" fill="#EE8A3A" transform="rotate(35 25 10)"/><path d="M24 4 q-2 -3 -5 -3 q2 3 5 3 z M25 4 q2 -3 5 -3 q-2 3 -5 3 z" fill="#8FB98B"/><path d="M8 17 L12 12 L16 17 Z" fill="#D9B27C" opacity=".9"/>' };
  D['brownie'] = { bg: '#EBDCD3', svg: '<rect x="6" y="26" width="30" height="14" rx="3.5" fill="#4A2C20"/><rect x="12" y="14" width="30" height="16" rx="3.5" fill="#5A3626"/><rect x="12" y="14" width="30" height="5" rx="2.5" fill="#7A4A33"/><g fill="#8A5A40"><path d="M17 22 l5 -1 l1 3 z"/><path d="M28 20 l6 1 l-2 3 z"/><path d="M22 26 l6 0 l-3 2 z"/></g><circle cx="38" cy="18" r="2.4" fill="#F6E7D0"/><circle cx="19" cy="17" r="1.6" fill="#F6E7D0"/>' };
  D['lemon-bar'] = { bg: '#FBF3C8', svg: '<rect x="6" y="28" width="36" height="12" rx="3.5" fill="#E8C68C"/><rect x="6" y="18" width="36" height="14" rx="3.5" fill="#F4DC6A"/><rect x="6" y="18" width="36" height="5" rx="2.5" fill="#FAEA95"/><g fill="#FFFFFF" opacity=".95"><circle cx="13" cy="21" r="1.3"/><circle cx="20" cy="24" r="1.3"/><circle cx="28" cy="21" r="1.3"/><circle cx="35" cy="24" r="1.3"/><circle cx="24" cy="19" r="1.1"/></g><circle cx="36" cy="12" r="6" fill="#F4DC6A"/><circle cx="36" cy="12" r="4.4" fill="#FAEA95"/><path d="M36 8 V16 M32 10 L40 14 M40 10 L32 14" stroke="#F4DC6A" stroke-width="1"/>' };
  D['blueberry-muffin'] = { bg: '#E6E9F7', svg: '<path d="M10 28 L38 28 L35 43 Q24 45 13 43 Z" fill="#B9C2EE"/><path d="M15 28 L17 43 M21 28 L22 44 M27 28 L26 44 M33 28 L31 43" stroke="#9AA6E4" stroke-width="1.6"/><path d="M7 28 Q5 14 24 12 Q43 14 41 28 Z" fill="#E8B777"/><path d="M10 24 Q12 16 24 15 Q34 16 38 24 Z" fill="#F0C58E" opacity=".8"/><g fill="#5E6BC4"><circle cx="15" cy="22" r="2.6"/><circle cx="24" cy="18" r="2.6"/><circle cx="33" cy="21" r="2.6"/><circle cx="29" cy="26" r="2.3"/><circle cx="19" cy="26" r="2.3"/></g><g fill="#8B96DA"><circle cx="14.2" cy="21.2" r=".8"/><circle cx="23.2" cy="17.2" r=".8"/><circle cx="32.2" cy="20.2" r=".8"/></g>' };
  D['tres-leches-cake'] = { bg: '#FFF3DC', svg: '<ellipse cx="24" cy="40" rx="20" ry="4" fill="#FFFFFF"/><ellipse cx="24" cy="40" rx="20" ry="4" fill="none" stroke="#F1E3C6" stroke-width="1.5"/><path d="M8 38 L8 22 Q24 19 40 22 L40 38 Q24 41 8 38 Z" fill="#FFE7B5"/><path d="M8 22 Q24 19 40 22 L40 26 Q24 23 8 26 Z" fill="#FFF8EC"/><path d="M8 33 Q24 36 40 33 L40 38 Q24 41 8 38 Z" fill="#F8F2E4"/><circle cx="24" cy="17" r="5" fill="#EE7A8E"/><path d="M22 12 q2 -3 4 0 q-2 2 -4 0 z" fill="#8FB98B"/><g fill="#C98A52" opacity=".8"><circle cx="14" cy="21" r="1"/><circle cx="31" cy="20" r="1"/><circle cx="36" cy="22" r="1"/></g>' };
  D['cheesecake'] = { bg: '#FFE9EC', svg: '<path d="M5 36 L43 36 L42 42 Q24 46 6 42 Z" fill="#B98050"/><path d="M6 21 L42 21 L43 36 L5 36 Z" fill="#FFE9B8"/><path d="M8 24 L40 24 L40 27 L8 27 Z" fill="#FFF3D6" opacity=".9"/><path d="M5 20 Q24 15 43 20 Q41 24 38 24 Q36 30 33 24 Q28 26 24 24 Q22 31 18 24 Q12 26 9 24 Q6 24 5 20 Z" fill="#EE7A8E"/><circle cx="24" cy="15" r="3.6" fill="#EE7A8E"/><path d="M22 11 q2 -3 4 0 q-2 2 -4 0 z" fill="#8FB98B"/>' };
  D['oatmeal-raisin-cookie'] = { bg: '#F3E6D2', svg: '<ellipse cx="24" cy="41" rx="17" ry="2.6" fill="#3B2925" opacity=".1"/><circle cx="24" cy="25" r="17" fill="#CFA06C"/><circle cx="24" cy="25" r="14.4" fill="#DDB27C"/><g fill="#EBD3A4"><ellipse cx="15" cy="20" rx="3" ry="1.3" transform="rotate(-25 15 20)"/><ellipse cx="29" cy="17" rx="3" ry="1.3" transform="rotate(20 29 17)"/><ellipse cx="22" cy="31" rx="3" ry="1.3" transform="rotate(10 22 31)"/><ellipse cx="33" cy="29" rx="3" ry="1.3" transform="rotate(-30 33 29)"/></g><g fill="#5C3550"><ellipse cx="20" cy="23" rx="2.4" ry="1.8" transform="rotate(25 20 23)"/><ellipse cx="29" cy="25" rx="2.4" ry="1.8"/><ellipse cx="25" cy="17" rx="2.4" ry="1.8" transform="rotate(-20 25 17)"/><ellipse cx="17" cy="30" rx="2.4" ry="1.8"/></g>' };
  D['flavor-shot'] = { bg: '#FDEDF1', svg: '<rect x="19" y="4" width="10" height="6" rx="2" fill="#B55573"/><rect x="22" y="9" width="4" height="5" fill="#8C6A3E"/><path d="M26 6 h9 q3 0 3 3" stroke="#B55573" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="14" y="13" width="20" height="28" rx="6" fill="#F7D6A0"/><rect x="14" y="13" width="20" height="9" rx="4.5" fill="#FBE5BD"/><rect x="14" y="24" width="20" height="10" fill="#FFFFFF"/><path d="M20 29 h8" stroke="#F5B5C8" stroke-width="2.4" stroke-linecap="round"/>' };
  D['soda-glass-bottle'] = { bg: '#E3F3EA', svg: '<rect x="20" y="3" width="8" height="5" rx="1.5" fill="#E24D5C"/><path d="M21 8 H27 V17 Q33 20 33 28 V40 Q33 44 29 44 H19 Q15 44 15 40 V28 Q15 20 21 17 Z" fill="#8FCFA8"/><path d="M21 8 H24 V17 Q18 20 18 28 V42 Q15 42 15 40 V28 Q15 20 21 17 Z" fill="#B6E3C6" opacity=".8"/><rect x="15" y="26" width="18" height="10" fill="#FFFFFF"/><path d="M20 31 h8" stroke="#E24D5C" stroke-width="2.4" stroke-linecap="round"/>' };
  D['soda-plastic-bottle'] = { bg: '#E3F0F8', svg: '<rect x="20" y="3" width="8" height="5" rx="1.5" fill="#EC5C97"/><path d="M21 8 H27 V13 Q34 16 34 24 V40 Q34 44 30 44 H18 Q14 44 14 40 V24 Q14 16 21 13 Z" fill="#9CD3EA"/><path d="M14 38 H34 V40 Q34 44 30 44 H18 Q14 44 14 40 Z" fill="#7FC0DD"/><path d="M15 18 Q19 22 15 26 M33 18 Q29 22 33 26" stroke="#7FC0DD" stroke-width="1.4" fill="none"/><rect x="14" y="26" width="20" height="9" fill="#FFFFFF"/><path d="M19 30.5 h10" stroke="#EC5C97" stroke-width="2.4" stroke-linecap="round"/>' };
  var k;
  for (k in D) { if (D.hasOwnProperty(k)) { ART.menu[k] = { vb: '0 0 48 48', svg: D[k].svg, bg: D[k].bg, name: k }; } }

  /* ── every menu item: base picture + key ingredients ── */
  var ITEMS = {
    'espresso': ['hot-coffee', 'coffee-beans'], 'americano': ['hot-coffee', 'water'], 'cappuccino': ['hot-coffee', 'milk-foam'], 'latte': ['hot-coffee', 'milk'],
    'chai-latte': ['hot-coffee', 'chai'], 'dirty-chai-latte': ['hot-coffee', 'chai', 'coffee-beans'], 'honey-cinnamon-latte': ['hot-coffee', 'honey', 'cinnamon'], 'drip-coffee': ['hot-coffee', 'coffee-beans'], 'mocha': ['hot-coffee', 'chocolate'],
    'iced-latte': ['iced-coffee', 'milk'], 'iced-americano': ['iced-coffee', 'ice'], 'iced-chai-latte': ['iced-coffee', 'chai'], 'iced-dirty-chai-latte': ['iced-coffee', 'chai', 'coffee-beans'],
    'iced-honey-cinnamon-latte': ['iced-coffee', 'honey', 'cinnamon'], 'frappuccino': ['iced-coffee', 'ice', 'milk-foam'], 'iced-mocha': ['iced-coffee', 'chocolate'], 'cold-brew': ['iced-coffee', 'coffee-beans'],
    'coffee-smoothie': ['smoothie', 'coffee-beans', 'peanut-butter'], 'sunrise': ['smoothie', 'orange', 'pineapple'], 'sunset': ['smoothie', 'orange', 'strawberry'],
    'tropical-limeade': ['smoothie', 'pineapple', 'lime-and-lemon'], 'watermelon-slush': ['smoothie', 'watermelon', 'mint'],
    'fresh-pressed-juice': ['juice', 'orange'], 'small-water': ['water'], 'large-water': ['water', 'ice'],
    'full-plate': ['full-plate', 'fritters', 'beans'], 'avocado-toast': ['avocado-toast', 'egg', 'avocado'], 'breakfast-blt': ['sandwich', 'bacon', 'egg'],
    'fruit-bowl': ['fruit-bowl', 'granola', 'yogurt'], 'bagel-with-cream-cheese': ['bagel', 'cream-cheese'], 'original-pancakes': ['pancakes', 'bacon'],
    'banana-cinnamon-pancakes': ['pancakes', 'banana', 'cinnamon'], 'chocolate-chip-pancakes': ['pancakes', 'chocolate'],
    'classic': ['bagel', 'egg', 'cheese'], 'josie-bagel': ['bagel', 'avocado', 'bacon'], 'oh-so-good': ['bagel', 'onion', 'tomato'], 'high-roller': ['bagel', 'red-apple', 'arugula'], 'garden-bagel': ['bagel', 'avocado', 'lettuce'],
    'chicken-caesar-salad': ['salad', 'chicken', 'croutons'], 'graces-chicken-caesar': ['salad', 'chicken', 'bacon'], 'house-veggie-salad': ['salad', 'tomato'], 'house-veggie-salad-with-chicken': ['salad', 'tomato', 'chicken'],
    'lunch-blt': ['sandwich', 'bacon', 'potato'], 'chicken-burger': ['burger', 'chicken', 'cabbage'], 'buffalo-chicken-burger': ['burger', 'chili', 'chicken'], 'fries': ['fries'],
    'croissant': ['croissant'], 'cinnamon-roll': ['cinnamon-roll', 'cinnamon'], 'banana-bread': ['banana-bread', 'banana'], 'coconut-bread': ['coconut-bread', 'coconut']
  };
  var DRAWN_STICKERS = {
    'key-lime-pie': ['lime-and-lemon'], 'cinnamon-streusel-muffin': ['cinnamon'], 'protein-balls': ['peanut-butter', 'granola'], 'chocolate-chip-banana-bread': ['chocolate', 'banana'],
    'pumpkin-pie': ['cinnamon'], 'chocolate-chip-cookies': ['chocolate'], 'carrot-cake': ['cream-cheese'], 'brownie': ['chocolate'], 'lemon-bar': ['lime-and-lemon'], 'blueberry-muffin': [],
    'tres-leches-cake': ['milk'], 'cheesecake': ['strawberry'], 'oatmeal-raisin-cookie': ['cinnamon'], 'flavor-shot': ['vanilla']
  };
  var drawnKeys = {}; for (k in D) { if (D.hasOwnProperty(k)) { drawnKeys[k] = 1; } }
  var made = {};
  function build(key, parts, stickers) {
    var base = ART.menu[parts], st = stickers || [], svg, i, spots;
    if (!base) { return; }
    svg = base.svg; spots = SPOTS[st.length] || [];
    for (i = 0; i < st.length && i < 2; i++) { svg += sticker(st[i], spots[i][0], spots[i][1], 9.2); }
    ART.menu[key] = { vb: '0 0 48 48', svg: svg, bg: base.bg, name: key };
    made[key] = 1;
  }
  for (k in ITEMS) { if (ITEMS.hasOwnProperty(k)) { build(k, ITEMS[k][0], ITEMS[k].slice(1)); } }
  for (k in DRAWN_STICKERS) { if (DRAWN_STICKERS.hasOwnProperty(k) && DRAWN_STICKERS[k].length) { build(k, k, DRAWN_STICKERS[k]); } }
  /* the pastries bank wording: Josie may call them a little differently */
  var ALIAS = { 'chocolate-chip-cookie': 'chocolate-chip-cookies', 'cinnamon-streusel-muffins': 'cinnamon-streusel-muffin', 'tres-leches': 'tres-leches-cake', 'oatmeal-raisin-cookies': 'oatmeal-raisin-cookie',
    'soda-glass-bottle': 'soda-glass-bottle', 'soda-glass': 'soda-glass-bottle', 'soda-plastic-bottle': 'soda-plastic-bottle', 'soda-plastic': 'soda-plastic-bottle', 'pastry': 'croissant' };
  ART.keyFor = function (en) {
    var s = slug(en); if (ALIAS[s]) { s = ALIAS[s]; }
    if (made[s] || drawnKeys[s]) { return s; }
    // soda with a comma: "Soda, glass bottle"
    if (/soda/.test(s)) { return /plastic/.test(s) ? 'soda-plastic-bottle' : /glass/.test(s) ? 'soda-glass-bottle' : null; }
    return null;
  };
  /* bank of pastries (names for the database, EN + ES), in the order they show */
  ART.pastryBank = [
    ['Key lime pie', 'Pay de limón'], ['Cinnamon streusel muffin', 'Muffin de canela con streusel'], ['Protein balls', 'Bolitas de proteína'], ['Chocolate chip banana bread', 'Pan de banano con chispas de chocolate'],
    ['Pumpkin pie', 'Pay de calabaza'], ['Chocolate chip cookies', 'Galletas con chispas de chocolate'], ['Carrot cake', 'Pastel de zanahoria'], ['Croissant', 'Croissant'], ['Cinnamon roll', 'Rollo de canela'],
    ['Banana bread', 'Pan de banano'], ['Coconut bread', 'Pan de coco'], ['Brownie', 'Brownie'], ['Lemon bar', 'Barra de limón'], ['Blueberry muffin', 'Muffin de arándanos'], ['Tres leches cake', 'Pastel de tres leches'],
    ['Cheesecake', 'Cheesecake'], ['Oatmeal raisin cookie', 'Galleta de avena y pasas']
  ];
}(window));
