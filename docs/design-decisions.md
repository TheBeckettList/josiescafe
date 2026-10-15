# Josie's World: decisions that are settled

Source of truth for building. Updated Oct 15, 2026 from the design canvas review and Richard's answers.
Rules that already live in the build handoff (hard rules 1-11) still apply; this file adds what was decided since.

## There is no Ready. Anywhere.
- Kitchen and bar never mark anything: no Ready, no Seen, no Done. It is an extra step for them.
- An order ends in exactly one of two ways, both at the register:
  - **Stick back** (for here): the stick returns, the number completes.
  - **Picked up** (to go): marked after the handoff.
- Remove from the design: the tutorial step "Mark it ready", the "ready" entry in the manager map legend
  (keep open / making / waiting), and the "Ready" tag on the register edge-case board.
- Guests see "Making it" until pickup, then "Picked up".

## Wait times, not prep times
- Prep time is not measured. Fulfillment defines it.
- **Wait** = from the order being sent to its number completing (stick back or picked up).
- A stick that holds several orders has one wait for the number (fuzzy on purpose). Orders completed together share
  `orders.completed_at`; group by (stick_number, completed_at).
- Day in review shows station averages only, Josie only, never per person. Replace the "Bar 4 min / Kitchen 8 min"
  prep numbers with average wait for here and to go.

## Diet wording (honest by default)
- Toggles on the register: **Vegan**, **Gluten free**, **Kosher-style**. Never "Kosher" anywhere (gear included).
- What guests and tickets say comes from `diets.claim`: "vegan", "gluten-free ingredients", "kosher-style".
  The cafe is an open kitchen, so it never promises no cross-contact, and "kosher-style" never implies certification.
- Kosher-style also warns when one dish has meat and dairy together (`ingredients.meat` + `ingredients.dairy`).
- An ingredient with no diet mark yet is treated as fine and listed in the admin gear as "to confirm".
- Core ingredient (bacon on a BLT): the tile says "bacon is the dish", stays addable with "add anyway".
- Forcing a non-compliant ingredient back is allowed and shows on the ticket.

## Kitchen and bar ticket phone
Read only. Cooks scroll; nothing else.
- **One ticket per screen.** Each ticket fills the screen; the next ticket is a scroll away (vertical scroll-snap).
- **Fixed item size.** Every item row is the same big size, so a count of items fits predictably.
  Choose the size so a normal ticket (up to about 6 item rows) fits without scrolling on a small phone.
- **Long tickets** (more rows than fit) show a small "scroll for more" cue at the bottom edge that disappears
  once the end is reached. The cue is a hint, not a control.
- **The ticket alone is enough for the cook.** Each row carries:
  - the dish name and quantity,
  - icon chips for the changes: **without** (ingredient icon, crossed out), **add** (ingredient icon, plus),
    **swap** (old icon, arrow, new icon),
  - the diet that caused a change in words, e.g. "kosher-style", and forced-back ingredients marked,
  - ADD-ON tag with a link to the original stick, and the pinned STOPPED / CHANGED alerts at the top.
- Tapping a dish to open its build (the "Build it" / "LEAVE OFF" / "USE THIS" board) is allowed as read-only
  detail, but nothing on it changes state. Note: the design canvas shows this; the standing rule is still scroll-only
  for status, so keep it view-only.
- A ticket leaves 10 minutes after its number completes (Undo inside that window brings it back).

## Names and sample data in the design canvas
The canvas uses placeholder people (Ana, Luis, Marta, Carlos, Sofia) and a few dishes that are not on the real menu
(Banana bread, Baleada). The real staff are in the database; the real menu is the 45 items in `supabase/005_real_menu.sql`.
Do not build the placeholders.

## Guest-facing times
- Guests never see "ready in" times. Online orders do not ask for a pickup time in the new checkout.
  `orders.pickup_at` stays in the database for the live v1.2 flow only, and the new ticket does not show it.
