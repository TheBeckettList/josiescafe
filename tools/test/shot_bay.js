var H = require('./harness');
(async function () {
  var h = await H.start({ reset: true });
  var p = await h.page('/', { viewport: { width: 1280, height: 800 }, init: function () { try { localStorage.clear(); } catch (e) {} } });
  await p.waitForTimeout(1500); await p.click('[data-act="bayFlip"]'); await p.waitForTimeout(400);
  await p.screenshot({ path: '/tmp/claude-0/shots/bay_desk.png', clip: { x: 0, y: 0, width: 1280, height: 720 } });
  await p.setViewportSize({ width: 390, height: 800 }); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/claude-0/shots/bay_phone.png', clip: { x: 0, y: 0, width: 390, height: 420 } });
  await h.stop();
})();
