/* Josie's World · Play mode, guest side. Inside the Play window the website uses the same pretend café as the POS. */
(function (w) {
  'use strict';
  var JC = w.JC, P = null;
  try { P = w.parent && w.parent !== w ? w.parent.J2PLAY : null; } catch (e) {}
  if (P && P.http) { if (P.store) { JC.get = P.store.get; JC.set = P.store.set; JC.del = P.store.del; } JC.http = function () { return P.http.apply(JC, arguments); }; w.J2PLAY = { on: true, guest: true }; }
  else { w.document.write('<div style="font-family:sans-serif;padding:30px;text-align:center">Play mode lives at <a href="/play/">josiescafe.com/play/</a>. Open the guest website from there.</div>'); w.stop && w.stop(); }
}(window));
