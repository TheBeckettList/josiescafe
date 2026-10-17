# Josie's cafe box: Raspberry Pi backup POS (spec)

A small computer in the cafe that keeps the POS, the kitchen/bar printers and the day's sales going when the
power or the internet is out, then hands everything back to the cloud when it returns.
Status: **spec, nothing built yet.** Written Oct 17, 2026 from the repo as it stands (migrations 001–021, POS 2.0.0).

Numbers marked *(verify)* are ballpark figures or product facts to check before buying.

---

## MVP (decided Oct 17): Pi 4, a few hours, cheap

Decisions from Richard: **outage cover is a few hours at most** (if the day is gone, the cafe closes, because the
espresso machines are electric), **Pi 4**, **target ~US$150**, printers already planned. Everything below overrides
the bigger "full version" in sections 7 and 8, which stay as the later upgrade path.

### Update (Oct 17, later): SD card, power bank, phones, her router

**Devices.** One main POS tablet; **phones are everything else**, including kitchen and bar. Kitchen/bar phones already poll
`tickets2_feed` every 4 s with the 6-digit code (no login), so they work against the Pi too, with the same failover as the
register. Web Push does not work offline, so in an outage the phone must have the tickets page open on screen.
**Because the phones show tickets, printers are not needed for the Pi to be useful in an outage.** Printers (Ethernet or USB, both
fine) are an add-on and the only part that needs real AC power.

**SD card:** fine. Use a **high-endurance** card (the ones sold for dashcams), 32–64 GB, keep a cloned spare, and let the Pi
upload a nightly database backup to the cloud. Postgres stays on default safe settings (`fsync` on).

**Used power bank as the Pi's UPS: yes, but only a bank that can charge and power at the same time without a blip.**
- Many banks cut output for a moment when the charger is plugged in or pulled. The Pi reboots, which is exactly what we are avoiding.
  Look for "pass-through charging" or "UPS function" and **test it**: run the Pi, pull the wall plug, then plug it back in, 5 times.
- Pi 4 needs a bank that gives a steady 5 V/3 A (15 W) on USB-C. Pi 4 + SD draws about 4–6 W.
- Size: a 20,000 mAh bank is ~74 Wh nominal, ~50 Wh real, so the Pi alone runs **~8 h**. That covers "a few hours" on its own.
- Safety: used lithium banks can be worn or swollen. Skip any that is puffy or hot, keep it in a vented spot, never under a cover.
- Cleaner alternative, ~$20–30: a small Pi UPS board with 18650 cells (built for this, reports power-lost to the Pi). Either works.
- Shut-down: a bank can't tell the Pi it is running low. Fix: the Pi watches an input (a $5 power-sense module, or "ping
  the router"), starts backup mode when the wall power drops, and does a clean `shutdown` after 4 h on battery.
- It will NOT run the printers (24 V) or the router. To print during an outage you need the small UPS from before, or a
  tiny AC power station, for the printers only.
- **Power plan: Pi on the bank (~$0 if you have one) + phones/tablet on their own batteries = whole POS for hours.
  Printers on a UPS only if you want paper.** This puts the ~$150 target within reach: Pi 4 + case + supply + SD + clock ≈ $75–90.

**Piggybacking her router: yes, that is the normal-day setup already (Pi on Ethernet, same Wi-Fi as everyone).** No special
port is needed: any LAN port works, and phones/tablet stay on the usual Wi-Fi. What it needs from the router:
1. **A DHCP reservation** so the Pi always gets the same address.
2. **DNS:** `pos.josiescafe.com` has to resolve to the Pi even when the internet is down. Easiest: set the router's DHCP DNS to the Pi
   (secondary 1.1.1.1). If the router won't let you, the Pi can't help phones on the normal Wi-Fi in an internet-only outage; they
   then need the Pi's own Wi-Fi.
3. **No "client isolation" / "AP isolation"** on the main Wi-Fi (guest networks usually have it), or phones can't reach the Pi.
4. **Her okay** to change those router settings.
Her router is **not** on the battery in this plan, so in a **power** cut the Pi starts its own `josies-pos` Wi-Fi and the phones
join it; in an **internet-only** cut (power fine) nothing changes for staff: everything keeps working through the router.
Security with everyone on one network: Postgres listens only on the Pi itself; only HTTPS (443) is open; every call needs the
device login or the kitchen code; and the Pi's admin login uses keys, not the default password. A separate network for the Pi is
optional and most home routers can't do one.

### Update: a spare used phone

Good fit as a **helper**, poor fit as the **server**.

**1. Cellular uplink for the Pi (best use).** Plug the phone into the Pi by USB and turn on USB tethering (Android; Linux sees it as a
normal network port). That replaces the LTE modem: the phone brings the SIM and its own battery, and the Pi charges it. The Pi uses it only for
the small sync traffic (early upload, pausing online orders, nightly backup), never for the tablets. Needs a prepaid data SIM (test signal at
the cafe first; usage is tiny, tens of MB a day). Phone must have a healthy battery; set "stay connected" and disable battery optimization for tethering.

**2. Kitchen and bar ticket screens.** An old phone per station on the wall, screen kept on while charging, tickets page open. This is
already how tickets are shown. One small change needed: in an outage there is no push buzz, so the tickets page should **play a chime when a new ticket
arrives**. I have not checked whether the page does that; it is a small addition if not.

**3. Not as the server or the hotspot.** Reasons:
- Android kills background apps; Postgres + PostgREST + Caddy inside Termux/proot is fragile and unproven, and phone updates can break it.
- A phone's hotspot hands out its own DNS, so `pos.josiescafe.com` can't point at the Pi when there is no internet. The Pi's own Wi-Fi (dnsmasq) fixes that.
- Phones kept at 100 % on a charger 24/7 swell their batteries over time. Fine for hours-a-day screens, not for an always-on box in a closed cabinet.
- The repo has a JS stand-in for the server (`play/engine-sim.js`, used for testing). It is a second copy of the rules, not the real migrations, so I would not
  run the cafe's money on it.

Cost: $0 (spare phone) to ~$40 (used one) + prepaid data. The Pi stays the server.

### What the MVP does
Power goes out → tablets switch to the Pi → orders, payments, completing numbers, 86'ing, stock and staff sign-in
keep working → **kitchen and bar tickets print** → when power or internet returns, everything uploads to the cloud.

### What the MVP leaves out (on purpose)
| Left out | Instead |
|---|---|
| LTE modem / second Wi-Fi radio | Pi 4's one radio is the tablets' network **only while power is out**. Normal days it is on Ethernet to the router. Optional free uplink: a phone plugged into the Pi by USB (tethering) so sync can happen early |
| Router and ISP modem on the battery | A power cut usually takes the ISP too. The Pi makes its own Wi-Fi (`josies-pos`) so nothing else needs power. Saves ~20 W, which is about half the battery cost |
| Pi UPS HAT | The small UPS has a USB port; the Pi reads it with NUT: "on battery" starts backup mode, "low battery" shuts down cleanly |
| Phase 2 (printing every day), dashboards, Tailscale | later |
| Receipts printer / cash drawer | add if wanted: same printer code |

Kept, because they are the point: the same database rules on the Pi (section 4), the outbox and catch-up, `pos.josiescafe.com`
with a real certificate (section 5), and `printd` for the bar and kitchen printers (section 6).

### Network in the MVP
- **Power on:** Pi on Ethernet to the router (DHCP reservation, router hands out the Pi as DNS). Wi-Fi AP is off.
- **Power cut:** the UPS signal turns the Pi's AP on (`josies-pos`, own DHCP+DNS). Tablets have it saved as a second
  network. The app's failover (section 5, client changes) picks the Pi.
- If tablets don't hop networks by themselves on an iPad, staff tap the network once; the band on the register says so.

### Shopping list (ballpark US$, *verify*)
| Item | Cheap | Notes |
|---|---|---|
| Raspberry Pi 4, 2 GB (4 GB if the price gap is small) | ~$45–55 | Postgres + PostgREST + Caddy run fine in 2 GB |
| Official 5 V/3 A USB-C supply | ~$10 | |
| Case with fan/heatsink | ~$10 | hot, humid cafe |
| Boot/data drive | USB SSD 120–250 GB ~$20–25 **(recommended)**, or a high-endurance microSD ~$12 | plain SD cards die from the power cuts this project exists for. With SD only: nightly backup to the cloud and a cloned spare card |
| RTC module (DS3231) | ~$5 | Pi 4 has no clock; offline boots would have the wrong time |
| Ethernet cable | ~$3 | |
| **Pi build subtotal** | **~$95–110** | |
| Line-interactive UPS, 600–1000 VA with USB | ~$80–120 new (cheaper used or with new batteries) | Pi + printers only |
| **Total with UPS** | **~$175–230** | printers not included |

So ~$150 buys the **Pi build plus a bare minimum of power**. Two ways to land near $150: (a) a used or refurbished UPS with new
batteries, SD instead of SSD (~$130–150 total), or (b) pay ~$200 and have an SSD and a new UPS. I'd take (b); the drive is the
part that fails first on an island grid.

### Runtime on a small UPS (Pi 4 + 2 printers ≈ 25 W)
A 600–1000 VA UPS holds about 100 Wh usable (lead-acid, ~50 % depth; check the maker's runtime chart for your model).
| Load | Runtime |
|---|---|
| Pi + 2 printers, ~25 W | ~3.5–4 h |
| the same plus router/modem, ~45 W | ~2 h |
| tablets: each runs on its own battery (8–10 h), so they are not on the UPS | |
Do **not** put the espresso machine or fridges on it: even a big UPS would last minutes.
Cheap UPSes output a stepped sine; Pi and printer supplies are fine with that *(verify the printer's supply)*.
Thermal printer peaks (~60 W for a moment) are well inside a 600 W UPS.

### MVP build order
1. Database on the Pi 4 (Postgres + PostgREST + auth shim + migrations 001–021) passing `tools/test` scenarios.
2. Client failover and `pos.josiescafe.com` HTTPS (one CNAME at GoDaddy for the certificate).
3. `022_pi_sync.sql`, outbox wrappers, catch-up. Test with a simulated 2-hour outage.
4. `printd` for two printers.
5. Install: UPS, NUT, AP on power loss, monthly pull-the-plug test.

Open for the MVP: **printer models** (LAN or USB), and **how many tablets** and whether iPads hop to `josies-pos` on their own.

---

## 1. What in the database decides the design

Read from `supabase/` and `pos/js/core.js`:

1. **The POS talks to exactly two Supabase services.** PostgREST (`/rest/v1/<table>` and `/rest/v1/rpc/<fn>`) and
   GoTrue auth (`/auth/v1/token`). There is no other server code except the `kitchen-push` edge function. So the Pi
   can be a **drop-in copy of those two services** and the POS needs almost no change.
2. **All the rules live in Postgres functions** (`sync_order2`, `pay_orders`, `complete_number`, `place_stick`,
   `stop_item`, `floor_state`, `tickets2_build`, …). All are `security definer` and gated by `is_pos()`
   (JWT email must be in `pos_users`). People sign in with a PIN, which opens a **shift**; the shift id is the token
   that `need_role()` checks. Running the **same 21 migrations on the Pi** means we never re-implement the rules.
3. **Every write is idempotent by an id the tablet makes** (`orders.id`, `order_items.id`, `payments.id`,
   `order_pieces.id`; all `on conflict do nothing`). The tablets already keep a write queue and retry
   (`S.queue`, `J.syncNext`). That is what makes safe catch-up possible: replaying an event twice is harmless.
4. **Stock is delta-based** (`apply_stock`, `add_stock`), so replaying orders in order gives the right pastry counts.
5. **Cloud-only dependencies** in the migrations: `pg_cron` (daily bank rate), `pg_net` (rate fetch, push to
   kitchen phones), `pgcrypto` (PIN hashes), and `auth.jwt()`. `tools/test/setup-db.sh` already runs 001–021
   on a plain Postgres 16 with those stubbed, so this is proven, not a guess.
6. **No printing exists anywhere in the repo.** Kitchen/bar get tickets as web pages and push notifications.
   Thermal printing is new work (section 6).
7. **The "no internet" story today is per tablet only.** The README says it plainly: with no internet another
   device's kitchen/bar screen gets nothing until it returns, and "a small local box in the cafe fixes this, together
   with thermal printing". That box is this project.

---

## 2. Architecture and modes

```
 tablets / phones (Wi-Fi)
        │  https://pos.josiescafe.com  (LAN address, real certificate)
        ▼
 ┌──────────────────────── Raspberry Pi 5 ────────────────────────┐
 │ Caddy (HTTPS) → PostgREST + auth shim → Postgres 16 (migrations 001–021)
 │ sync daemon  (snapshot down · outbox up)      printd (ESC/POS)  │
 └───────┬───────────────────────────────┬────────────────────────┘
         │ uplink: router → SIM/phone hotspot  │ USB / LAN
         ▼                                     ▼
   Supabase cloud                      kitchen + bar (+ register) printers
```

| Mode | When | Tablets talk to | Pi does |
|---|---|---|---|
| **Standby** | cloud reachable (normal day) | cloud | pulls a config snapshot every 5 min; keeps a warm, current copy |
| **Island** | tablets can't reach the cloud, or power is out | the Pi | serves the POS API, prints tickets, logs every write to an outbox |
| **Catch-up** | uplink is back and the outbox isn't empty | **still the Pi** | replays the outbox to the cloud, in order |
| back to Standby | outbox empty and the cloud confirms | cloud | resumes snapshots |

Rule that prevents split brain: **tablets stay on the Pi until the outbox is empty**, even if the cloud is
reachable again. Otherwise open orders and sticks exist in two places. The Pi publishes `GET /health →
{mode, outbox}` and the tablets follow it.

During Island mode the Pi's uplink (SIM/hotspot) is used **only by the sync daemon**, never to carry tablet
traffic. A flaky LTE link must not slow the register.

---

## 3. Pi software stack

| Piece | Choice | Why |
|---|---|---|
| OS | Raspberry Pi OS Lite 64-bit, boot from NVMe/SSD, read-mostly config, nightly cloned spare image | SD cards corrupt on power loss and wear out |
| Database | PostgreSQL 16 (arm64), `pgcrypto`, migrations 001–021 unmodified | same rules as cloud |
| API | PostgREST (aarch64 build) | same `/rest/v1` surface as Supabase |
| Auth shim | ~100 lines (Node or Go): `POST /auth/v1/token?grant_type=password\|refresh_token`, signs HS256 JWTs with `role=authenticated` and `email` | `is_pos()` only reads the `email` claim; no GoTrue needed |
| Web/HTTPS | Caddy: TLS, CORS for `https://josiescafe.com`, static copy of `/pos/` as a fallback | PostgREST's own CORS is limited |
| DNS/DHCP | dnsmasq on the Pi (break-glass AP mode, section 5) | names must resolve with no internet |
| Sync | `pi-sync` daemon (Node/Python) | section 4 |
| Printing | `printd` (python-escpos or node-escpos) | section 6 |
| Remote admin | Tailscale (outbound only) | LTE SIMs are usually behind carrier NAT, so there is no inbound port |
| Time | Pi 5 RTC + battery, chrony | timestamps matter offline; tablets also stamp `created_at` themselves |
| Watchdog | systemd units + hardware watchdog + `/health` | auto-recover from a hung process |

---

## 4. Database spec

### 4.1 Table classes

| Class | Tables | Flow | Rule |
|---|---|---|---|
| **A. Config** | `settings`, `fx_rates`, `categories`, `items`, `ingredients`, `dish_ingredients`, `swaps`, `diets`, `diet_marks`, `tables`, `pos_users`, `people` (with `pin_hash`), `ticket_link` (the 6-digit code the kitchen/bar phones type) | cloud → Pi | full snapshot; small (45 items, 46 ingredients, 151 dish links). No `updated_at` on most tables, so don't bother with deltas |
| **B. Shift state** | `ingredients.light`, `items.available`, `items.stock`, `sticks`, `shifts`, `people.fail_count/locked_until` | both ways | snapshot down **only in Standby with an empty outbox**; changes made on the Pi go up as events or rows (below) |
| **C. Transactions** | `orders`, `order_items`, `order_pieces`, `payments`, `ticket_alerts`, `ingredient_log` | Pi → cloud | append-only in practice; replay by id |
| **D. Cloud only** | `payroll_periods/lines`, `owner_invites`, `owner_guard`, `push_subs`, `push_keys`, web-guest views | none | schema exists on the Pi (so migrations run) but stays empty; payroll and owner sign-in say "needs the internet" in Island mode (the client already does this for `sign_in_owner`) |

Counted pastry `items.stock` lives in class B on purpose. It changes by deltas inside `sync_order2`, so replay is
correct, but a snapshot overwrite while orders are unsent would erase sales.

### 4.2 Pi-only schema (`pi/900_pi_local.sql`, not run in the cloud)

```
pi.outbox(seq bigserial pk, event_id uuid unique, fn text, body jsonb, received_at timestamptz,
          device text, sent_at timestamptz, result jsonb)
pi.state(id=1, mode text, last_snapshot_at, last_replay_at)
pi.print_log(piece_id uuid / alert_id uuid pk, station text, printed_at, attempts int, error text)
```

Write wrappers: a script renames each write function to `core.<fn>` and creates `public.<fn>` with the same
signature. The wrapper inserts into `pi.outbox`, then calls `core.<fn>`, **in one transaction**, so a write is
never accepted without being logged. Wrapped list (the tablet's `JOBS` plus the admin writes):
`sync_order2, pay_orders, complete_number, undo_complete, place_stick, stop_item, cancel_order, set_light,
set_dish_out, add_stock, catalog_write, people_save, my_settings` and legacy `sync_order, bump`.
`sign_in / sign_out / sign_in_owner` are **not** replayed as calls; see shifts below.

Stub the cloud extensions exactly as `tools/test/setup-db.sh` does. `net.http_post` as a no-op also silences the
`orders_push` / `alerts_push` triggers, so nothing tries to push to phones from the Pi.

### 4.3 Cloud side: one new migration (`022_pi_sync.sql`)

- `pi_snapshot()` returns class A plus open shifts (last 16 h) as one jsonb document. Callable only by the Pi's device login.
- `pi_ingest(batch jsonb)` applies a batch of outbox events. Per event: skip if its `event_id` is already in
  `pi_ingest_log`, otherwise call the same function the tablet would have, record the result.
- `pi_ingest` sets a transaction-local flag (`pi.replay`) that `person_of()` / `need_role()` honor, because a shift
  that was open on the Pi may be closed or older than 16 h by the time we replay (`person_of` otherwise rejects it).
  Only `pi_ingest` can set that flag.
- A `pi@josiescafe.com` row in `pos_users` (its own login, separate from the tablets').

### 4.4 Shifts and the clock-in (the tricky one)

`sign_in` mints a shift id that tablets keep as their token, and `shifts_one_open` allows only one open shift per
person. So:

- The snapshot copies **open shifts with their real ids** to the Pi. A person clocked in at 6:30 and signing in
  again on the Pi during an outage finds the *same* shift (`sign_in` already says "already on shift, hours never
  double"), and tokens the tablets hold keep working across the hand-off.
- New or closed shifts created on the Pi go up as **rows** (upsert by id with the real `in_at` / `out_at`), not as
  `sign_in` replays, which would stamp replay time and corrupt payroll.

### 4.5 Replay rules

1. Strict `seq` order; batch of 50; stop at a network failure and retry with backoff.
2. A function returning `ok:false` (e.g. a stick completed while unpaid) is **not dropped**: store the result,
   mark it, and show it on a "needs a look" list in the manager view. Never lose a sale silently.
3. `now()` inside a few functions (`stop_item.stopped_at`, `set_light.light_set_at`, `set_dish_out.updated_at`) will
   record replay time. These are display-only; to fix, add an optional `at` (as `complete_number` already has).
   Do that in 022, not later.
4. Pi → cloud only ever *inserts* orders and *applies* events. The Pi never deletes cloud data.
5. After each batch the Pi stores `sent_at`. The outbox is kept 30 days for audit, then pruned.

### 4.6 Online (website) orders during an outage

Customers can keep ordering on josiescafe.com while the cafe is dark, since the site and the cloud are unaffected.
Island mode therefore **sets `settings.online_orders = false` in the cloud** (the existing pause switch; the Pi
does it over the SIM the moment it enters Island mode) and restores it only if it was true before. If there is no
uplink at all, the website cannot be told. Worst case they queue in the cloud and appear on the register after
the catch-up. A small known gap, so decide whether that is acceptable (section 11).

---

## 5. Network, HTTPS and the tablets

The hard part is not the database. It is making a **tablet on `https://josiescafe.com` talk to a box on the LAN**:

- An HTTPS page cannot call plain `http://` (mixed content), and service workers (which let iOS reopen the app
  offline) and `localStorage` queues are **per origin**. If tablets switched to `http://192.168.x.x`, they would
  lose their queue, sign-in, and offline start.
- **Chosen design:** tablets keep loading the app from `josiescafe.com` (cached by the service worker, iOS 11.3+),
  and the API base becomes a **second URL, `https://pos.josiescafe.com`**, which resolves to the Pi's LAN
  address and has a **real certificate**.
- Certificate: Caddy gets a Let's Encrypt cert for `pos.josiescafe.com` by the **DNS-01** challenge (works with a
  private IP, and renews while online). DNS is at GoDaddy, which I believe restricts its DNS API to larger
  accounts *(verify)*. The simple workaround: CNAME `_acme-challenge.pos` to an acme-dns account and let the Pi
  update that. Pi must renew every ~60 days while online and keep a valid cert on disk.
- Name resolution with no internet: the Pi runs dnsmasq and answers `pos.josiescafe.com`. The cafe router hands
  out the Pi as DNS (secondary `1.1.1.1` so a dead Pi doesn't kill normal browsing).
- **Rejected alternatives:** a different origin served by the Pi (loses queue, session, offline start); a private
  CA profile on every iPad (works, but fiddly, and fragile on OS updates). Keep it only as a fallback.

### Topology

- **Primary:** Pi on Ethernet to the cafe router/switch, a DHCP reservation, and **router, ISP modem, Pi and printers
  all on the same battery**. Tablets never change network. The Pi's second radio and/or the SIM provide a
  backup uplink to the router or for the Pi alone.
- **Break-glass:** if the router dies, the Pi starts an AP (`josies-pos`, WPA2, its own DHCP+DNS at
  192.168.50.1). Every tablet has that network saved at lower priority. The built-in Wi-Fi can't be both an AP and a
  client reliably, which is what the extra radio is for: **wlan0 = AP for tablets, wlan1 = client to the
  phone hotspot**, and/or a USB LTE modem with the SIM.
- Hostname stays `pos.josiescafe.com` in both topologies; only the DNS answer changes.

### Client changes (small, in `js/api.js` and `pos/js/core.js`)

1. `JC.cfg.localUrl = 'https://pos.josiescafe.com'`; one `JC.base()` that chooses the cloud or the Pi from
   `GET /health` (cloud: existing `J.ping`; Pi: new) and the "stay on Pi until outbox empty" rule.
2. A second saved session: device setup signs in to both (the Pi shim has the same device login mirrored), stored under
   `pos.session.local`. Cloud refresh tokens can't be used on the Pi.
3. A visible band on the register and tickets: "Cafe box mode: orders upload when the internet is back"
   (strings in `strings.js`, EN/ES), plus the outbox count in Manage.
4. Everything else (queue, floor polling every 4 s, menu reload every 90 s, offline PIN sign-in) is unchanged. The
   Pi handles this load easily.

---

## 6. Printing (`printd`)

- **Trigger:** `NOTIFY` on insert into `order_pieces` and `ticket_alerts` (deferred to commit, so items exist).
  `printd` calls the existing **`tickets2_build(station, lang)`**, prints any piece not in `pi.print_log`, and
  retries failures with backoff. Reusing that function means the paper ticket says exactly what the phone says:
  stick number, items, no/add/swap chips, diet wording, ADD-ON, and the STOP / CHANGED alerts.
- **Stations:** the schema already has `bar` and `kitchen` pieces, so **two ticket printers**; a third at the
  register for customer receipts and the cash drawer kick (if you have a drawer). Each printer gets a fixed language (EN or ES), set in the Pi config.
- **Text is the first pass.** The phone uses icons for chips; paper prints words ("NO BACON", "BACON -> TEMPEH"). Raster
  icons from `art/` are an optional later step.
- **Characters:** ESC/POS code pages must cover Spanish (á é í ó ú ñ ¿ ¡). The ticket text uses `×`, `→`, `·`,
  which most pages lack, so `printd` transliterates them (`x`, `->`, `-`). Pick the code page per model.
- **Printer models:** 80 mm ESC/POS from Epson (TM-T20 family) or Star (TSP143 family) *(verify models)*.
  A **LAN** model is easiest (port 9100, no USB gymnastics, can sit away from the Pi). USB is fine for one near the
  Pi. Look for a **buzzer** option on the kitchen unit: today the phones chime; paper is silent.
- **Reliability:** print is at-least-once, with the `print_log` preventing re-prints, and a "reprint last N" button in Manage.
  Out-of-paper / offline printer shows up on `/health` and the tablets' band.
- **Receipts are non-fiscal**, like the tablet receipts now. If the cafe must issue SAR-compliant invoices
  during outages, that is a separate piece of work (section 11).
- **Phase 2 (optional):** run `printd` in Standby too, polling the cloud's `tickets2_pos`, so paper works every
  day and the Pi is proven daily instead of only on bad days.

---

## 7. Hardware (full version; the MVP list is at the top)

| Item | Spec | Notes |
|---|---|---|
| Computer | Raspberry Pi 5, 8 GB (4 GB is enough) | official 27 W PSU if not on the UPS HAT |
| Storage | NVMe SSD 256 GB + M.2 HAT+ (or a USB 3 SSD) | no SD card for the database |
| Spare | second NVMe with a cloned image, spare PSU | Utila shipping and customs mean weeks of lead time |
| Case/cooling | active cooler, vented metal case | the cafe is hot and humid |
| Wi-Fi radio 2 | USB 3 adapter with a well-supported Linux chipset (e.g. MediaTek MT7612U/MT7921AU) *(verify)* | PCIe is taken by the NVMe; use USB |
| Cellular | USB LTE modem (Quectel EC25-class) + external antenna, or a MiFi/phone hotspot | test Tigo/Claro signal on site first. Data use is tiny (<50 MB/day) |
| UPS for the Pi | 21700-cell UPS HAT for Pi 5, ≥5 V/5 A out *(verify)* | clean shutdown and a power-lost signal |
| Printers | 2× 80 mm thermal (bar, kitchen) + optional 3rd at register | LAN model preferred, spare paper rolls, spare print head cable |
| Network | 8-port switch, short patch cables | all on the battery |
| RTC | Pi 5 RTC battery | |
| Surge/AVR | surge-protected strip, preferably with brownout correction | island grids brown out; this is the thing that kills hardware |

Rough prices *(verify)*: Pi + NVMe + HAT + case ~US$180; UPS HAT ~$50; USB Wi-Fi ~$25; LTE modem+antenna ~$80–150;
printer ~$150–350 each; switch ~$25.

---

## 8. Backup power (full version; the MVP uses a small UPS, see the top)

### Load budget (assumptions; measure on site with a watt meter)

| Load | Average | Notes |
|---|---|---|
| Pi 5 + NVMe + radios + modem | 12 W | |
| Router + ISP ONT/modem + switch | 20 W | check the label on each |
| 2 thermal printers | 16 W | idle ~2 W each; ~60 W peaks for a moment while printing |
| Card terminal (if powered here) | 5 W | |
| **Core total** | **~55 W → budget 60 W** | |
| 3 tablets charging | +36 W | optional; they run 8–10 h on their own batteries |
| **Core + tablets** | **~95 W** | |

### Runtime (usable ≈ 77 % of nameplate Wh: ~85 % inverter × ~90 % LiFePO4 depth)

| Battery | At 60 W | At 95 W |
|---|---|---|
| 300 Wh | 3.9 h | 2.4 h |
| 500 Wh | 6.4 h | 4.0 h |
| **1,000 Wh** | **12.8 h** | **8.1 h** |

The cafe is open **6:15–14:30 (8.25 h)**. **A ~1 kWh LiFePO4 power station covers a full trading day even with the
tablets charging.** A 500 Wh unit covers a typical outage; choose 1 kWh if "the power was out all morning" is a thing here.

### Spec

- **Power station with an AC UPS/EPS mode** (switchover ≤ ~20 ms *(verify per model)*), pure sine,
  **≥ 1,000 W continuous** (printer motors and head spike), LiFePO4 (long life in heat).
  It plugs into the wall; the router, Pi, switch and printers plug into it. It keeps charging whenever the grid is up.
- **Two layers:** the station for hours, and the Pi's own UPS HAT for the switchover and a clean shutdown.
  The Pi sees "external power lost" from the HAT, logs it, starts Island mode early, and shuts itself down at
  ~15 % battery so the database is never cut mid-write.
- **Keep off the battery:** coffee machine, fridges, lighting, fans. Those are a separate decision (bigger system or
  solar), not part of this spec.
- **Ahead of the station:** surge/AVR strip, to protect the station itself.
- **Test monthly:** pull the wall plug at open for 10 minutes; one test a quarter for a full 4 hours.

---

## 9. Failure modes

| What fails | What happens |
|---|---|
| Power out, Pi + router on battery | tablets detect the cloud as unreachable, switch to the Pi, nothing changes for staff |
| Router dies | Pi AP `josies-pos`; tablets join it (saved network) |
| Pi dies | tablets fall back to their own offline queue, exactly as today; no kitchen/bar tickets; swap in the spare NVMe |
| Internet out, power fine | same as power out, minus the battery |
| Cert expired while offline | HTTPS fails: the tablets' own queue still works. Prevent with renew alerts and a 30-day margin |
| Printer out of paper | ticket stays in `print_log` unprinted, shows on the tablets' band, prints when fixed |
| Replay fails on an event | kept, flagged "needs a look", never dropped |
| Pi's disk full / corrupt | nightly local backup (pg_dump + the outbox); the cloned spare |
| Tablets cut over mid-order | the tablet's own queue holds it and flushes to whichever server answers |

---

## 10. Build order

1. **Prove the database on the Pi.** Postgres 16 + PostgREST + auth shim + migrations 001–021 with
   `tools/test/setup-db.sh` adapted. Point a laptop browser at it with `?api=` (a dev override). *Done when the existing
   `tools/test` scenarios pass against the Pi.*
2. **Client failover** (`js/api.js`, `core.js`, strings, the band) and the Caddy/cert/DNS setup. *Done when tablets move
   between cloud and Pi when Wi-Fi/uplink is cut, with no lost order.*
3. **`022_pi_sync.sql`, `pi-sync`, outbox wrappers.** *Done when a 2-hour simulated outage (random orders, pays, completes,
   86s, a shift) replays to the cloud with identical totals, shifts, and pastry stock.*
4. **`printd`** with real printers; tickets for every case in `play/` scenarios.
5. **Power and network install**, the monthly test, and a one-page "what to do" card on the wall.
6. **Phase 2:** printd in Standby; Pi dashboard on `/health`.

The Play runner (`tools/play`, `play/`) and the headless scenarios (`t_scenarios.js`) are the test bench for steps 1–3.

---

## 11. Decisions I need from you

1. **Printers:** which models do you already have or want, and LAN or USB? Is there a cash drawer? Where do bar,
   kitchen, register sit relative to the Pi?
2. **Outage length to plan for:** "a few hours" (500 Wh) or "a full trading day" (1 kWh)? Do tablets charge from the same battery?
3. **Network today:** what are the router, ISP modem, and ONT, and can the router's DNS be set? Will the router sit
   on the same battery? Would a router with a built-in SIM slot be simpler than a separate modem?
4. **Uplink:** SIM (which carrier, signal at the cafe) or the phone hotspot?
5. **Fiscal invoices:** do paper receipts have to be SAR invoices (CAI), or are the tablet-style receipts enough?
6. **Website during an outage:** acceptable if online orders can slip in when there's no uplink at all (section 4.6)?
7. **DNS:** OK to add one CNAME at GoDaddy for the certificate challenge?
8. **Access:** who gets to see Pi data (PIN hashes are on it)? Disk encryption (LUKS) costs a manual unlock at boot, so I'd skip
   it and rely on the box being physically locked away; say if you disagree.
