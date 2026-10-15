var H = require('./harness'), fs = require('fs');
(async function () {
  var h = await H.start({ reset: false });
  var p = await h.page('/', { viewport: { width: 1100, height: 900 }, init: function () { try { localStorage.clear(); } catch (e) {} } });
  await p.waitForTimeout(800);
  await p.evaluate(function () {
    var A = window.J2ART, names = ['Espresso','Americano','Cappuccino','Latte','Chai latte','Dirty chai latte','Honey cinnamon latte','Drip coffee','Flavor shot','Iced latte','Iced Americano','Iced chai latte','Iced dirty chai latte','Iced honey cinnamon latte','Frappuccino','Coffee smoothie','Sunrise','Sunset','Tropical limeade','Watermelon slush','Fresh pressed juice','Small water','Large water','Soda, glass bottle','Soda, plastic bottle','Full plate','Avocado toast','Breakfast BLT','Fruit bowl','Bagel with cream cheese','Original pancakes','Banana cinnamon pancakes','Chocolate chip pancakes','Classic','Josie bagel','Oh so good','High roller','Garden bagel','Chicken Caesar salad',"Grace's chicken Caesar",'House veggie salad','House veggie salad with chicken','Lunch BLT','Chicken burger','Buffalo chicken burger'].concat(A.pastryBank.map(function (x) { return x[0]; }));
    var h = '<div style="display:flex;flex-wrap:wrap;padding:10px;background:#FFF6F2;font:12px Nunito,sans-serif">';
    names.forEach(function (n) { var k = A.keyFor(n); h += '<div style="width:116px;margin:6px;text-align:center"><div style="width:96px;height:96px;margin:0 auto;border-radius:24px;background:' + (k && A.menu[k] ? A.menu[k].bg : '#eee') + ';display:flex;align-items:center;justify-content:center">' + (k ? A.svg('menu', k, 84) : '??') + '</div>' + n + '</div>'; });
    document.body.innerHTML = h + '</div>';
  });
  await p.screenshot({ path: '/tmp/claude-0/shots/icons.png', fullPage: true });
  await h.stop();
})();
