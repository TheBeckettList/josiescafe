# Josie's Cafe: notes for Claude

Cafe in Utila, Honduras. Static site + POS on GitHub Pages (josiescafe.com), Supabase backend (project tuthebxguxvogmiowhcx).
Read first: `docs/design-decisions.md` (settled decisions), `README.md` (v1.x setup, offline, hours). The design canvas
and the longer project docs live in the claude.ai Project "Josie's" (build handoff, connections, ops loop, diets, menu json).

## Where things are
- `/` `/menu` `/order`: public site (`js/site.js`, `js/api.js`, `css/site.css`). `/world`, `/pos2` only redirect.
- `/pos/`: the current POS (register, overview map, gear/setup, team, manager, tour). JS in `pos/js/`, styles `pos/css/pos2.css`.
  `/pos/tickets/`: read-only kitchen and bar phone. `/pos-classic/`, `/site-classic/`: the old v1.2 apps, kept as a fallback.
- `/play/`: scenario simulator (one order, rushes, out of milk) with a bottleneck report; built by `tools/play/`.
- `supabase/NNN_*.sql`: migrations, applied by hand in order. `supabase/functions/kitchen-push`: ticket push.
- `design/boards/`: HTML copies of the design canvas boards. Reference only; do not ship from them.
- `tools/test/`: headless browser tests (`t_*.js`) against a local Postgres (`setup-db.sh`, needs PG16 binaries and root).

## Rules that must not break
1. Kitchen and bar never touch phones: no Ready, no Seen, no Done. Tickets only arrive and scroll.
2. An order ends only at the register: stick back (for here) or picked up (to go). A number can hold several orders;
   everything on it must be paid first; Undo reopens all of them. Tickets leave 10 minutes after completion.
3. The cashier is the runner: ring up, place the stick, deliver, take it back, all on the register.
4. Guests are a name. No order numbers, no "ready in" times. Numbers (sticks) are for eating in, staff side only.
5. Guests can only add to an order before payment. Cancel and change are the POS person's, because money is involved.
6. An element out (bacon) never removes a dish: show "no bacon" plus swaps. A base out (pancake mix) makes the dish Out.
7. Diet wording is honest: "vegan", "gluten-free ingredients", "kosher-style" (never "Kosher").
8. Never show pay or margins to staff; never show per-person speed anywhere; no scores, streaks, coins, countdowns.
9. Never expose Josie's personal phone or WhatsApp. Staff never see payroll. Suppliers are phone calls (no ordering automation).
10. Tablet and computer behave identically (touch vs click); a phone shows the same screen full size.

## Code conventions
- Old tablets: plain ES5, XMLHttpRequest, flexbox with -webkit- prefixes, no CSS grid or `gap`, no build step for the site/POS.
- English first with EN | ES toggle on every screen; strings in `pos/js/strings.js`.
- Offline-first: every paid order is saved on the device first and uploaded with retries; ids are made on the device so repeats are safe.
- Soft shadows only (no hard offset shadows). Pastel pink theme, Baloo 2 + Nunito.

## Database notes
- The Supabase tool times out at about 60 s. Apply schema changes in groups of 3-4 statements.
- Draft ingredient data (008) is a draft; Josie corrects it in the gear. Rates and real PINs are not set yet.
- Never put passwords, PINs or keys in the repo or chat. Josie enters those herself.

## Working style
KISS, minimal text on screens. Do not change the live v1.2 flow unless asked. Add a test in `tools/test/` for new flow.
