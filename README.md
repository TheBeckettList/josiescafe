# Josie's Cafe — website + POS (MVP)

- The whole website is static files, no build step. Publish the repo root as josiescafe.com.
  - `/` home: open/closed right now, hours, where to find us (10 languages)
  - `/menu/` the menu, read live from the same tables the POS edits (sold out shows straight away)
  - `/order/` order ahead: pick-up time, here or to go, pay at the counter
  - `/pos/` the POS: register, payment, kitchen/bar screens, manager screens
- `supabase/001_schema.sql` — database (already run on project tuthebxguxvogmiowhcx)
- `supabase/002_seed_menu.sql` — the SAMPLE menu (already loaded; edit or delete in POS › Manage › Menu)
- `supabase/003_online_orders.sql` + `004_tighten_online_functions.sql` — v1.1: open/closed switch, online ordering, real hours (both already applied to the live project)

## Online orders (v1.1)
1. A customer orders on `/order/`. `place_online_order` re-prices everything from the menu (the browser's prices
   are never trusted), checks the cafe is open at the pick-up time, and saves an **open** (unpaid) order numbered W1, W2…
2. The register shows **Online orders · n** in the left rail. Tickets reach the kitchen/bar screens **20 minutes before
   pick-up**, marked ONLINE with the time.
3. At pick-up: Online orders › **Take payment** → normal cash/card screen. The customer's page flips to "Ready" when
   the stations bump it, and to "Enjoy" once paid.
4. **Manage › Open / closed**: close for today or through a date (with a note for the website), reopen, or pause
   online orders. Regular hours stay in Manage › Money & hours.
Limits: max 3 open online orders per phone number, 20 of an item, 30 lines; pick-up 10 minutes to 7 days ahead.

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
