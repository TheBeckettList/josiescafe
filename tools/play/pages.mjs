// Makes the two Play pages from the real ones, so Play never needs a hook inside /pos or the website:
//   play/app/index.html    = pos/index.html, served as if it lived in /pos/ (<base>), with play.js in front of the app
//   play/guest/index.html  = index.html with guest.js in front of the app
// Run again whenever pos/index.html or index.html changes:  node tools/play/pages.mjs
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const root = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
function make(src, out, inject, base, after) {
  let s = fs.readFileSync(path.join(root, src), 'utf8');
  const apiTag = s.match(/<script src="[^"]*js\/api\.js[^"]*"><\/script>/);
  if (!apiTag) throw new Error('no api.js tag in ' + src);
  s = s.replace(apiTag[0], apiTag[0] + '\n<script src="' + inject + '"></script>');
  if (after) { s = s.replace('<script src="' + inject + '"></script>', '<script src="' + inject + '"></script>\n<script src="' + after + '"></script>'); }
  s = s.replace(/<link rel="manifest"[^>]*>\n?/, '');
  s = s.replace('<head>', '<head>\n<meta name="robots" content="noindex">' + (base ? '\n<base href="' + base + '">' : ''));
  fs.mkdirSync(path.dirname(path.join(root, out)), { recursive: true });
  fs.writeFileSync(path.join(root, out), s);
  console.log('wrote', out);
}
make('pos/index.html', 'play/app/index.html', '/play/play.js?v=8', '/pos/', '/play/scenarios.js?v=2');
make('index.html', 'play/guest/index.html', '/play/guest.js?v=5', '');
