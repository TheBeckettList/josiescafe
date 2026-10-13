# Josie's Cafe — website + POS (MVP)

- `site/` — the whole website, static files, no build step. Publish this folder as josiescafe.com.
  - `/` home + menu in 10 languages (reads the menu from Supabase)
  - `/pos/` the POS: register, payment, kitchen/bar screens, manager screens
- `supabase/001_schema.sql` — database (already run on project tuthebxguxvogmiowhcx)
- `supabase/002_seed_menu.sql` — the SAMPLE menu (already loaded; edit or delete in POS › Manage › Menu)

## Works on old devices
Plain ES5 JavaScript, XMLHttpRequest, flexbox with -webkit- prefixes, no CSS grid or `gap`.
Target: Safari on iOS 9+ (every iPad mini), any Android tablet, any computer.
Reopening the POS with no internet needs iOS 11.3+ (service worker); older iPads keep working
offline as long as the page stays open.

## Offline
Menu, staff and settings are kept on each device. Every paid order is saved on the device first,
then uploaded (retried every 8 seconds). Order IDs are made on the device, so uploads can repeat safely.
Limit: with no internet, the kitchen/bar screen on another device gets new tickets only once the
internet is back. A small local box in the cafe fixes this, together with thermal printing.

## One-time setup
1. Supabase › Authentication › Users › Add user: `pos@josiescafe.com`, a password, "Auto confirm".
   (That email is already allowed into the POS. Add others to the `pos_users` table.)
2. Supabase › Authentication › Sign In / Providers: turn off "Allow new users to sign up".
3. On each tablet open https://josiescafe.com/pos/, sign in the device, then Share › Add to Home Screen.
4. First staff login: "Manager", PIN 1234 — change it in Manage › Staff.

## DNS at GoDaddy (GitHub Pages)
- A records for `@`: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
- CNAME `www` → `<github-username>.github.io`
