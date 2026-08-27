# Mail-In Statewide Idaho Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/mail-in-repair` the definitive statewide Idaho mail-in repair page by rebuilding its geography section as a region directory, adding a town-lookup tool and proof map, expanding the spoke-page cluster from 4 to 12 cities, adding a printable shipping kit, and wiring statewide cross-links.

**Architecture:** Static multi-page site (no build framework — `build.sh` only minifies `style.css`/`main.js` for the homepage). All new page-specific CSS/JS goes **inline in the page that uses it** (this is the established pattern; it also avoids cache-busting `style.css`, which is served immutable for 1 year). New city spoke pages are created by copying `rexburg-repair.html` and applying a replacement checklist. The hub page `mail-in-repair.html` gets four new/rebuilt sections.

**Tech Stack:** Hand-authored HTML/CSS/vanilla JS, JSON-LD structured data, Netlify-style `_redirects`/`_headers`, Python 3 one-liners for verification.

## Global Constraints

- **Site domain:** `https://www.haileyrepair.com` — canonicals and og:url are extensionless (e.g. `/idaho-falls-repair`, not `.html`).
- **Contact:** phone display `208-450-1606`, links `tel:+12084501606` and `sms:+12084501606`. Email `samuel@haileyrepair.com`. Owner is "Samuel". Business name "Hailey Device Repair", short "HDR".
- **Title tags ≤ 60 characters. Meta descriptions 145–160 characters.** Verify every new/changed page with:
  ```bash
  python3 -c "
  import re,sys
  h=open(sys.argv[1]).read()
  t=re.search(r'<title>(.*?)</title>',h).group(1)
  d=re.search(r'name=\"description\" content=\"(.*?)\"',h).group(1)
  print(len(t),repr(t)); print(len(d),repr(d))
  assert len(t)<=60 and 145<=len(d)<=160, 'OUT OF RANGE'" FILE.html
  ```
  If a provided description string lands outside 145–160, adjust by swapping device words (`phone`↔`iPhone`, `console`↔`game console`) — do not change the message.
- **Turnaround canon** (door-to-door, must be used consistently everywhere; matches existing live claims):
  | Region | Claim |
  |---|---|
  | Treasure Valley (Boise, Meridian, Nampa, Caldwell, Eagle, Kuna, Mountain Home, Emmett) | 2–3 days |
  | Magic Valley (Twin Falls, Jerome, Burley, Rupert, Gooding, Shoshone) | 3–4 days, or 80-minute drive |
  | Eastern Idaho (Idaho Falls, Pocatello, Blackfoot, Rexburg, Rigby, St. Anthony, Driggs, Victor) | 3–4 days |
  | Central Mountains (McCall, Salmon, Challis, Stanley, Arco) | 3–4 days |
  | North Idaho / Palouse (Coeur d'Alene, Post Falls, Hayden, Kellogg, Moscow, Lewiston, Grangeville, Orofino) | 4–5 days |
  | Far North (Sandpoint, Priest River, Bonners Ferry) | 4–6 days |
  | Wood River Valley (Hailey, Bellevue, Ketchum, Sun Valley) | Don't mail it — come in / text first |
- **No invented facts.** Repair policies quoted anywhere must already exist on the site: quote-by-text before any work, free return shipping, 40-day warranty, text updates at every step, price range $59–$349 (AggregateOffer). Data-safety claims must match `/tips/data-safe-during-repair.html` — read it before writing those answers. The proof map names **towns and device categories only** (the site already claims "Here's where our customers ship from"), never specific fabricated repair jobs.
- **Every new page must contain** the `<style id="vt-css">` view-transition block and load `/main.js?v=home-20260514` (both come free when copying `rexburg-repair.html` — verify, don't re-add).
- **Do not modify `style.css`** in this plan. All new styling is inline `<style>` blocks in the owning page. (If you ever do touch `style.css`, you must run `./build.sh` and bump the `?v=` query on all 31 pages that reference it — avoid this.)
- **`data-animate`** attributes get reveal-on-scroll behavior from `/main.js` automatically — use it on new cards/sections, no JS needed.
- **Each spoke task is fully self-contained**: it adds its own `_redirects`, `sitemap.xml`, `llms.txt`, and `llms-full.txt` entries so it is shippable alone.
- Commit after every task. Prefix: `feat:` for new pages/features, `content:` for copy-only changes.

### Shared: City Spoke Replacement Checklist (used by Tasks 1–8)

Every spoke task says "apply the Replacement Checklist with the content table below." That means, in order:

1. `cp rexburg-repair.html {slug}.html` (slug given per task).
2. **Head block** — replace with the task's content table values:
   - `<title>`, `<meta name="description">`, `<meta name="keywords">` (write 8–12 keyword phrases from the table's city + nearby towns + device terms)
   - `og:title` (= title), `og:description` (= description), `og:url` and `rel=canonical` → `https://www.haileyrepair.com/{slug}` (no `.html`)
   - `twitter:title` / `twitter:description` mirror og.
3. **Rename page-scoped CSS classes:** `grep -c 'rexburg-' {slug}.html` will show ~23 occurrences (`rexburg-hero-title`, `rexburg-page`, etc. in the inline `<style>` and markup). Global-replace `rexburg-` → `{css-prefix}-` (given per task). After: `grep -c 'rexburg-' {slug}.html` must be **0**.
4. **Visible copy:** replace the H1, hero paragraph(s), and each `section-title` + its body per the content table. The rexburg page's 10 H2 sections map as:
   | Rexburg section | Becomes |
   |---|---|
   | "A practical repair option for Rexburg and BYU-Idaho" | **Local reality** section (table: `local-reality`) |
   | "How this works across Rexburg and nearby towns" | Same H2 pattern with city/nearby towns; keep the 3-step text/quote/ship flow copy, swap place names |
   | "What to text me so I can quote it fast" | Keep verbatim (city-neutral) |
   | "What turnaround usually looks like from Rexburg-area addresses" | **Turnaround** section (table: `turnaround`) |
   | "What Rexburg-area customers usually ship us" | Keep structure; swap city name; devices list stays generic |
   | "When Rexburg-area mail-in makes sense — and when it doesn't" | **When it makes sense** (table: `makes-sense` bullets) |
   | "Why this works well for students and young families" | **Angle** section (table: `angle` — this is the city's unique hook; delete student-discount framing unless the table keeps it) |
   | "Questions Rexburg-area customers usually ask first" | **FAQ** (table: `faqs` — replace all visible `<details>` items AND the FAQPage JSON-LD with exactly these Q&As) |
   | "Text me your device and what's wrong" | Keep; swap city name |
5. **JSON-LD (4 blocks — all must parse):**
   - `Service`: `name` → "{City} Device Repair by Mail", `url` → canonical, `description` → meta description, `areaServed` → the table's `schema-cities` list, each as `{"@type":"City","name":"...","containedInPlace":{"@type":"State","name":"Idaho"}}`.
   - `LocalBusiness`: only change `areaServed` to the same city list (keep Hailey business identity, geo, phone as-is).
   - `FAQPage`: rebuild from the table's `faqs` (Question/Answer text must equal the visible FAQ text).
   - `BreadcrumbList`: last item name/url → this page.
   - If the copied page has a `HowTo` block with Rexburg mentions, swap city names only.
6. **Residue check:** `grep -ciE 'rexburg|byu|sugar city|madison county' {slug}.html` must be **0** (exception: none of these pages keep a student discount unless the table says so).
7. **Cross-links:** the page must link `/mail-in-repair` at least twice (hero CTA area + closing CTA — the rexburg base already does; keep them) and `sms:+12084501606` at least twice.
8. **Infra entries:**
   - `_redirects` — add both lines, matching existing format/alignment:
     ```
     /{slug}      /{slug}.html     200
     /{slug}.html /{slug}          301
     ```
     (Pretty-URL 200 rule goes in the top block with the other 200 rules; the `.html` 301 goes with the other 301s at the top of the file.)
   - `sitemap.xml` — add before `</urlset>`:
     ```xml
     <url>
       <loc>https://www.haileyrepair.com/{slug}</loc>
       <lastmod>2026-07-04</lastmod>
     </url>
     ```
   - `llms.txt` — add one line in the locations list (around lines 56–58, next to the Boise/Rexburg/Twin Falls entries): `- [{City} repair option](/{slug}): {one-line summary from the table}`
   - `llms-full.txt` — add the same line in the corresponding section.
9. **Verify (every spoke):**
   ```bash
   python3 -c "
   import re,sys,json
   h=open(sys.argv[1]).read()
   for m in re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>',h,re.S):
       json.loads(m)
   print('JSON-LD OK')" {slug}.html
   grep -c 'vt-css' {slug}.html            # expect 1
   grep -c 'main.js' {slug}.html           # expect ≥1
   grep -ciE 'rexburg|byu-idaho' {slug}.html  # expect 0
   ```
   Plus the title/description length check from Global Constraints.
10. **Commit:** `git add {slug}.html _redirects sitemap.xml llms.txt llms-full.txt && git commit -m "feat: add {city} mail-in spoke page"`

---

### Task 1: Idaho Falls spoke page

**Files:**
- Create: `idaho-falls-repair.html` (copy of `rexburg-repair.html`, 970 lines)
- Modify: `_redirects`, `sitemap.xml`, `llms.txt`, `llms-full.txt`

**Interfaces:**
- Consumes: `rexburg-repair.html` as base; Replacement Checklist above.
- Produces: live URL `/idaho-falls-repair` that Task 9's region directory links to.

- [ ] **Step 1: Apply the Replacement Checklist** with `slug = idaho-falls-repair`, `css-prefix = idahofalls-`, and this content table:

| Field | Content |
|---|---|
| title | `Idaho Falls Device Repair by Mail — 3–4 Days Door to Door` |
| description | `Ship your iPhone, MacBook, iPad or game console from Idaho Falls — quote by text before any work, free return shipping, and a 40-day warranty from HDR.` |
| H1 | `Idaho Falls device repair, handled by text and mail.` |
| hero sub | `Idaho Falls has big-box options and long waits. We're the other path: text photos of your device, approve a firm quote, drop the box at any post office — USPS Priority runs about two days each way between Bonneville County and Hailey.` |
| local-reality (H2 + body) | H2: `A practical repair option for Idaho Falls and Bonneville County` — Body: `Idaho Falls is the biggest city in eastern Idaho, but device repair there still usually means a mall kiosk, a carrier store that ships it out anyway, or a drive. Mail-in flips that: your quote is approved by text before the box ships, the part is staged before your device arrives, and return shipping is free. Rigby, Shelley, Ammon, and Ucon addresses see the same timelines.` |
| turnaround (H2 + body) | H2: `What turnaround usually looks like from Idaho Falls addresses` — Body keeps the rexburg structure with these numbers: USPS Priority ~2 days each way, repair typically same-day once the device lands (part staged in advance), **3–4 days door-to-door** for most repairs. |
| makes-sense bullets | Mail it: cracked screens, batteries, charging ports, water-damage assessment, MacBook keyboards/screens. Think twice: devices that won't power on AND hold the only copy of critical data (start with a text instead); anything under active manufacturer warranty. |
| angle (H2 + body) | H2: `Why eastern Idaho families use mail-in` — Body: `A household's phones, a work laptop, and a kid's Switch usually break in different months — one repair shop by text means one number to save, one warranty policy (40 days), and no second trip across town. Multiple devices in one box are welcome; each gets its own quote.` |
| faqs (visible + JSON-LD, 4) | **Q:** How long does mail-in repair take from Idaho Falls? **A:** Three to four days door-to-door for most repairs: about two days in the mail each way plus the repair itself, which is usually done the day your device arrives because the part is staged after you approve the quote. **Q:** Is it safe to mail a phone or laptop? **A:** Yes — USPS Priority includes tracking, and we text you at every step: when it arrives, when work starts, when it's done, and when it ships back with a tracking number. The packing guide on the mail-in page shows exactly how to protect it in the box. **Q:** What does it cost? **A:** You get a firm quote by text before you ship anything, and no work happens without your approval. Most mail-in repairs run $59–$349 depending on device and part, and return shipping is free. **Q:** Do you fix more than phones? **A:** Yes — iPhone, Android, MacBook, Windows laptops, iPad, and game consoles all ship the same way. |
| schema-cities | Idaho Falls, Ammon, Rigby, Shelley, Blackfoot |
| llms line | `- [Idaho Falls repair option](/idaho-falls-repair): Eastern Idaho mail-in repair — quote by text first, ~3–4 days door-to-door, free return shipping.` |

- [ ] **Step 2: Run the Checklist verification commands** (step 9 of the checklist). Expected: JSON-LD OK, vt-css 1, rexburg residue 0, title 58 chars, description in range.

- [ ] **Step 3: Commit** per checklist step 10.

---

### Task 2: Pocatello spoke page

**Files:**
- Create: `pocatello-repair.html`
- Modify: `_redirects`, `sitemap.xml`, `llms.txt`, `llms-full.txt`

**Interfaces:**
- Consumes: `rexburg-repair.html` base + Replacement Checklist.
- Produces: `/pocatello-repair` for Task 9 links.

- [ ] **Step 1: Apply the Replacement Checklist** with `slug = pocatello-repair`, `css-prefix = pocatello-`. This is the one new spoke that **keeps the student-discount framing** (rexburg's base has it), retargeted to Idaho State University:

| Field | Content |
|---|---|
| title | `Pocatello Device Repair by Mail — ISU Student Discount` |
| description | `Ship your iPhone, MacBook, iPad or game console from Pocatello or ISU — quote by text before any work, free return shipping, plus a 15% student discount.` |
| H1 | `Pocatello device repair, handled by text and mail.` |
| hero sub | `From Pocatello or the ISU campus, USPS Priority reaches our Hailey bench in about two days. Text photos first, approve a firm quote, then ship — most repairs are back in your hands in three to four days, with a 15% discount for students.` |
| local-reality | H2: `A practical repair option for Pocatello and Idaho State` — Body: `Pocatello sits far enough from everything that a cracked screen usually means living with it. Mail-in fixes that without a drive: quote approved by text before you ship, part staged before your device arrives, free return shipping. Chubbuck, American Falls, and Fort Hall addresses see the same timelines.` |
| turnaround | Same structure, numbers: ~2 days each way, **3–4 days door-to-door**. |
| makes-sense bullets | Same as Task 1's list. |
| angle | Keep the rexburg student/roommate framing, swapped to ISU: student budgets, 15% student discount (matches the existing sitewide student-military offer — link `/student-military`), roommates batching devices in one box. |
| faqs (4) | **Q:** How does the ISU student discount work? **A:** Mention you're a student when you text for your quote — 15% off the repair, same as our in-person student discount. See the student & military page for details. **Q:** How long does mail-in take from Pocatello? **A:** Three to four days door-to-door for most repairs — about two days in the mail each way, with the repair itself usually done the day it arrives. **Q:** Is it safe to mail my phone? **A:** (same safety answer as Task 1). **Q:** What if the quote isn't worth it? **A:** Then don't ship it — the quote happens by text with photos before anything goes in a box, so saying no costs you nothing. |
| schema-cities | Pocatello, Chubbuck, American Falls, Blackfoot, Fort Hall |
| llms line | `- [Pocatello repair option](/pocatello-repair): Southeast Idaho mail-in repair with 15% ISU student discount — quote by text first, 3–4 days door-to-door.` |

- [ ] **Step 2: Verify** (checklist step 9; note `byu` residue check still must be 0 — the student angle is rewritten, not kept verbatim). Confirm `/student-military` link present: `grep -c 'student-military' pocatello-repair.html` ≥ 1.

- [ ] **Step 3: Commit.**

---

### Task 3: Coeur d'Alene spoke page

**Files:**
- Create: `coeur-dalene-repair.html`
- Modify: `_redirects`, `sitemap.xml`, `llms.txt`, `llms-full.txt`

**Interfaces:** Base + Checklist; produces `/coeur-dalene-repair` for Task 9.

- [ ] **Step 1: Apply the Replacement Checklist** with `slug = coeur-dalene-repair`, `css-prefix = cda-`:

| Field | Content |
|---|---|
| title | `Coeur d'Alene Device Repair by Mail — Idaho, Not a Queue` |
| description | `Ship your iPhone, MacBook, iPad or console from Coeur d'Alene — an Idaho shop, a firm quote by text before any work, free return shipping, 40-day warranty.` |
| H1 | `Coeur d'Alene device repair, handled by text and mail.` |
| hero sub | `North Idaho usually gets pointed at Spokane for repair. Keeping it in-state is simpler than it sounds: text photos, approve a firm quote, ship USPS Priority — four to five days door-to-door, tracked and updated by text the whole way.` |
| local-reality | H2: `A practical repair option for Coeur d'Alene, Post Falls, and Hayden` — Body: `The Panhandle is a full day's drive from most of Idaho, which is exactly what mail-in is for. Your quote is approved before the box ships, the part is staged before your device arrives, and return shipping is free. Post Falls, Hayden, Rathdrum, and the Silver Valley ship on the same timeline.` |
| turnaround | Numbers: USPS Priority typically 2 days each way from Kootenai County, **4–5 days door-to-door**. |
| makes-sense bullets | Task 1 list, plus: `Mail it: anything where the alternative is a drive across the state line and a mall queue.` |
| angle | H2: `Why North Idaho keeps it in-state` — Body: `One technician, one text thread, one 40-day warranty — instead of a cross-border errand and a counter that ships your device out anyway. You'll know the price before the box leaves Kootenai County, and you'll get a text at every step while it's gone.` |
| faqs (4) | **Q:** How long does mail-in repair take from Coeur d'Alene? **A:** Four to five days door-to-door for most repairs — roughly two days in the mail each way plus the repair, which is usually done the day the device arrives. **Q:** Is it safe to mail a phone that far? **A:** (Task 1 safety answer). **Q:** Why not just go to Spokane? **A:** You can — but you'd still usually wait days, and many counters mail devices out for anything beyond a screen. Mail-in gives you a firm quote before anything ships and a 40-day warranty from an Idaho shop. **Q:** What does it cost? **A:** (Task 1 cost answer). |
| schema-cities | Coeur d'Alene, Post Falls, Hayden, Rathdrum, Kellogg |
| llms line | `- [Coeur d'Alene repair option](/coeur-dalene-repair): North Idaho mail-in repair — quote by text first, 4–5 days door-to-door, free return shipping.` |

- [ ] **Step 2: Verify** (checklist step 9). Watch the apostrophe: use `Coeur d'Alene` with a typographic apostrophe consistently in visible copy, plain `'` in JSON-LD strings.

- [ ] **Step 3: Commit.**

---

### Task 4: Nampa & Meridian spoke page

**Files:**
- Create: `nampa-meridian-repair.html`
- Modify: `_redirects`, `sitemap.xml`, `llms.txt`, `llms-full.txt`

**Interfaces:** Base + Checklist; produces `/nampa-meridian-repair`. Note `boise-repair.html` already covers Boise proper — this page must link to it once ("Boise proper? See the Boise page.") and target the suburb identity.

- [ ] **Step 1: Apply the Replacement Checklist** with `slug = nampa-meridian-repair`, `css-prefix = nampa-`:

| Field | Content |
|---|---|
| title | `Nampa & Meridian Device Repair by Mail — 2–3 Days Total` |
| description | `Ship your iPhone, MacBook, iPad or game console from Nampa, Meridian or Caldwell — quote by text before any work, free return shipping, 40-day warranty.` |
| H1 | `Nampa &amp; Meridian device repair, without the Boise errand.` |
| hero sub | `Treasure Valley mail is fast: USPS Priority from Nampa, Meridian, or Caldwell often reaches our Hailey bench next day. Text photos, approve a firm quote, ship — most repairs are back in two to three days without you crossing the valley once.` |
| local-reality | H2: `A practical repair option for the west Treasure Valley` — Body: `Nampa and Meridian have half a million neighbors and most of the repair counters are still a freeway drive away — then a second drive to pick up. Mail-in replaces both trips with a padded box and a text thread. Caldwell, Kuna, Star, and Middleton ship on the same timeline. Boise proper? There's a dedicated page for you: see the Boise repair page.` (link `/boise-repair`) |
| turnaround | Numbers: Priority often **next-day** each way inside southwest Idaho, **2–3 days door-to-door**. |
| makes-sense bullets | Task 1 list, plus: `Mail it: any repair where two freeway round-trips cost more of your week than two days of shipping.` |
| angle | H2: `Why commuter households mail it` — Body: `The math is simple: a repair counter means driving twice and waiting once; the mailbox means neither. You approve the exact price by text before shipping, the part is staged before your box lands, and everything is under the same 40-day warranty.` |
| faqs (4) | **Q:** How fast is mail-in from Nampa or Meridian? **A:** Two to three days door-to-door for most repairs — USPS Priority frequently runs next-day between the Treasure Valley and Hailey, and the repair itself is usually same-day once it lands. **Q:** Why not use a local kiosk? **A:** If you have a good one nearby, use it. Mail-in wins when you want a firm quote before committing, OEM-quality parts staged in advance, and zero drives — with a 40-day warranty either way. **Q:** Is it safe to mail my device? **A:** (Task 1 safety answer). **Q:** What does it cost? **A:** (Task 1 cost answer). |
| schema-cities | Nampa, Meridian, Caldwell, Kuna, Star, Middleton |
| llms line | `- [Nampa & Meridian repair option](/nampa-meridian-repair): West Treasure Valley mail-in repair — often next-day shipping each way, 2–3 days door-to-door.` |

- [ ] **Step 2: Verify** (checklist step 9) plus `grep -c 'boise-repair' nampa-meridian-repair.html` ≥ 1.

- [ ] **Step 3: Commit.**

---

### Task 5: McCall spoke page

**Files:**
- Create: `mccall-repair.html`
- Modify: `_redirects`, `sitemap.xml`, `llms.txt`, `llms-full.txt`

**Interfaces:** Base + Checklist; produces `/mccall-repair`.

- [ ] **Step 1: Apply the Replacement Checklist** with `slug = mccall-repair`, `css-prefix = mccall-`:

| Field | Content |
|---|---|
| title | `McCall Device Repair by Mail — Skip the Drive to Boise` |
| description | `Ship your iPhone, MacBook, iPad or game console from McCall, Cascade or Donnelly — quote by text before work, free return shipping, and a 40-day warranty.` |
| H1 | `McCall device repair, handled by text and mail.` |
| hero sub | `A broken screen in McCall usually means a two-hour drive down Highway 55 — twice. The post office is closer: text photos, approve a firm quote, ship USPS Priority, and most repairs are back at your door in three to four days.` |
| local-reality | H2: `A practical repair option for McCall, Donnelly, and Cascade` — Body: `Mountain-town repair is our home ground — we run the same service from Hailey, another Idaho mountain town. Your quote is approved by text before anything ships, the part is staged before your device arrives, and return shipping is free. New Meadows and Riggins ship on the same timeline.` |
| turnaround | Numbers: 1–2 days each way, **3–4 days door-to-door**. |
| makes-sense bullets | Task 1 list, plus: `Mail it: December through March, when Highway 55 is the worst part of any errand.` |
| angle | H2: `From one mountain town to another` — Body: `We're not a metro mail-order operation — Hailey is a ski-town main street two mountain ranges over. Seasonal work schedules, one main highway, devices that earn their living outdoors: that's the customer we already fix for every day, by text, with a 40-day warranty.` |
| faqs (4) | **Q:** How long does mail-in take from McCall? **A:** Three to four days door-to-door for most repairs — a day or two in the mail each way, and the repair itself usually done the day it arrives. **Q:** Is winter shipping a problem? **A:** USPS Priority runs year-round and every box is tracked; you get a text when it arrives, when work starts, and when it ships back. Pack per the guide on the mail-in page and weather isn't a factor inside the box. **Q:** Is it safe to mail my phone? **A:** (Task 1 safety answer). **Q:** What does it cost? **A:** (Task 1 cost answer). |
| schema-cities | McCall, Donnelly, Cascade, New Meadows, Riggins |
| llms line | `- [McCall repair option](/mccall-repair): West-central mountain-town mail-in repair — quote by text first, 3–4 days door-to-door.` |

- [ ] **Step 2: Verify** (checklist step 9).

- [ ] **Step 3: Commit.**

---

### Task 6: Salmon spoke page

**Files:**
- Create: `salmon-repair.html`
- Modify: `_redirects`, `sitemap.xml`, `llms.txt`, `llms-full.txt`

**Interfaces:** Base + Checklist; produces `/salmon-repair`.

- [ ] **Step 1: Apply the Replacement Checklist** with `slug = salmon-repair`, `css-prefix = salmon-`:

| Field | Content |
|---|---|
| title | `Salmon ID Device Repair by Mail — 3–4 Days Door to Door` |
| description | `Ship your iPhone, MacBook, iPad or game console from Salmon or Challis — a firm quote by text before any work, free return shipping, 40-day warranty.` |
| H1 | `Salmon device repair, handled by text and mail.` |
| hero sub | `Salmon is one of the most repair-isolated towns in the lower 48 — hours from any counter in any direction. It's also two mail days from our Hailey bench, straight down Highway 93. Text photos, approve the quote, ship it: three to four days door-to-door.` |
| local-reality | H2: `A practical repair option for Salmon, Challis, and the Lemhi Valley` — Body: `When the nearest repair counter is a mountain pass away, "just drop it off" was never real advice. Mail-in is: quote approved by text before you ship, part staged before your device arrives, free return shipping, and a text at every step while it's gone. Challis, Leadore, and North Fork ship on the same timeline.` |
| turnaround | Numbers: 1–2 days each way via US-93 routing, **3–4 days door-to-door**. |
| makes-sense bullets | Task 1 list, plus: `Mail it: any repair at all — from Salmon, the box beats the drive every single time.` |
| angle | H2: `Built for towns like Salmon` — Body: `This service exists precisely for the parts of Idaho that repair chains skipped. One technician reads your text, quotes the exact price, fixes it the day it lands, and ships it back free under a 40-day warranty. No trip over Galena or Lost Trail required.` |
| faqs (4) | **Q:** How long does mail-in take from Salmon? **A:** Three to four days door-to-door for most repairs — about two mail days each way and a same-day repair once it arrives, since your part is staged when you approve the quote. **Q:** Do I need special packaging? **A:** No — a sturdy box, padding on every side, and no loose movement is the whole recipe. The mail-in page has a step-by-step packing guide, and a printable version you can take to the post office. **Q:** Is it safe to mail my phone? **A:** (Task 1 safety answer). **Q:** What does it cost? **A:** (Task 1 cost answer). |
| schema-cities | Salmon, Challis, North Fork, Leadore, Mackay |
| llms line | `- [Salmon repair option](/salmon-repair): Lemhi Valley mail-in repair for Idaho's most repair-isolated towns — 3–4 days door-to-door.` |

- [ ] **Step 2: Verify** (checklist step 9).

- [ ] **Step 3: Commit.**

---

### Task 7: Sandpoint spoke page

**Files:**
- Create: `sandpoint-repair.html`
- Modify: `_redirects`, `sitemap.xml`, `llms.txt`, `llms-full.txt`

**Interfaces:** Base + Checklist; produces `/sandpoint-repair`.

- [ ] **Step 1: Apply the Replacement Checklist** with `slug = sandpoint-repair`, `css-prefix = sandpoint-`:

| Field | Content |
|---|---|
| title | `Sandpoint Device Repair by Mail — Keep It in Idaho` |
| description | `Ship your iPhone, MacBook, iPad or game console from Sandpoint or Bonners Ferry — quote by text before any work, free return shipping, 40-day warranty.` |
| H1 | `Sandpoint device repair, handled by text and mail.` |
| hero sub | `From Bonner County, device repair usually means Coeur d'Alene or Spokane — an afternoon gone either way. The alternative: text photos, approve a firm quote, ship USPS Priority, and get it back in four to six days without leaving town.` |
| local-reality | H2: `A practical repair option for Sandpoint, Priest River, and Bonners Ferry` — Body: `The far Panhandle is the longest mail run in Idaho and it still beats the drive. Your quote is approved before the box ships, the part is staged before your device arrives, and return shipping is free — with tracking and a text at every step. Ponderay, Priest River, and Bonners Ferry ship on the same timeline.` |
| turnaround | Numbers: 2–3 days each way this far north, **4–6 days door-to-door** — set expectations honestly. |
| makes-sense bullets | Task 1 list, plus: `Think twice: if you're in Sandpoint with a dead-simple screen job and a free afternoon, Coeur d'Alene may be quicker — we'll tell you so when you text.` |
| angle | H2: `Honest math for the far north` — Body: `We're the slowest mail run in the state and we'd rather say so than surprise you. What you get for those extra days: a firm quote before anything ships, one technician (not a counter rotation), OEM-quality parts staged in advance, and a 40-day warranty from an Idaho shop.` |
| faqs (4) | **Q:** How long does mail-in take from Sandpoint? **A:** Four to six days door-to-door for most repairs — the Panhandle is Idaho's longest mail run at two to three days each way, and the repair itself is usually done the day the device arrives. **Q:** Wouldn't Spokane be faster? **A:** Sometimes, if you count the drive as free. Mail-in wins on total effort: no trips, a firm price by text before you commit, and text updates the whole way. When a local counter is genuinely the better call, we'll say so. **Q:** Is it safe to mail my phone? **A:** (Task 1 safety answer). **Q:** What does it cost? **A:** (Task 1 cost answer). |
| schema-cities | Sandpoint, Ponderay, Priest River, Bonners Ferry, Clark Fork |
| llms line | `- [Sandpoint repair option](/sandpoint-repair): Far-north Idaho mail-in repair — honest 4–6 day door-to-door timeline, free return shipping.` |

- [ ] **Step 2: Verify** (checklist step 9).

- [ ] **Step 3: Commit.**

---

### Task 8: Teton Valley spoke page

**Files:**
- Create: `teton-valley-repair.html`
- Modify: `_redirects`, `sitemap.xml`, `llms.txt`, `llms-full.txt`

**Interfaces:** Base + Checklist; produces `/teton-valley-repair`.

- [ ] **Step 1: Apply the Replacement Checklist** with `slug = teton-valley-repair`, `css-prefix = teton-`:

| Field | Content |
|---|---|
| title | `Driggs & Victor Device Repair by Mail — Teton Valley` |
| description | `Ship your iPhone, MacBook, iPad or game console from Driggs, Victor or Tetonia — quote by text before any work, free return shipping, 40-day warranty.` |
| H1 | `Teton Valley device repair, handled by text and mail.` |
| hero sub | `Driggs and Victor sit in one of the best valleys in the Rockies and one of the worst places to get a phone fixed — over the pass to Jackson or an hour-plus to Idaho Falls. Or: text photos, approve a firm quote, ship it, three to four days door-to-door.` |
| local-reality | H2: `A practical repair option for Driggs, Victor, and Tetonia` — Body: `Teton Valley errands all involve a mountain pass or an hour of highway, so device repair joins the "next time I'm in town" list and stays broken. Mail-in takes it off that list: quote approved before you ship, part staged before it arrives, free return shipping, one ski-town shop to another.` |
| turnaround | Numbers: ~2 days each way, **3–4 days door-to-door**. |
| makes-sense bullets | Task 1 list, plus: `Mail it: in winter, when Teton Pass is the alternative.` |
| angle | H2: `Ski-town to ski-town` — Body: `Hailey is a resort-valley main street too — we know devices that live in parkas, glove-cracked screens, and cold-soaked batteries. Same weather, same repairs, one text thread, 40-day warranty.` |
| faqs (4) | **Q:** How long does mail-in take from Driggs or Victor? **A:** Three to four days door-to-door for most repairs — about two days in the mail each way, with the repair usually done the day it arrives. **Q:** Why not Jackson? **A:** The pass, the parking, and the pickup trip — twice. And resort-town counter pricing. A firm quote by text before you ship means you know the exact price without leaving the valley. **Q:** Is it safe to mail my phone? **A:** (Task 1 safety answer). **Q:** What does it cost? **A:** (Task 1 cost answer). |
| schema-cities | Driggs, Victor, Tetonia, Ashton, St. Anthony |
| llms line | `- [Teton Valley repair option](/teton-valley-repair): Driggs/Victor mail-in repair — no Teton Pass required, 3–4 days door-to-door.` |

- [ ] **Step 2: Verify** (checklist step 9).

- [ ] **Step 3: Commit.**

---

### Task 9: Rebuild the hub's Idaho section as a 5-region directory + expand City schema

**Files:**
- Modify: `mail-in-repair.html` — replace the section containing `<h2 class="section-title">Serving all of Idaho — by mail</h2>` (starts line ~2127; the section's `mail-cities-grid` div ends right before the `<!-- THE PROMISE — 3 GUARANTEES -->` comment) and the `areaServed` array inside the LocalBusiness JSON-LD (starts line ~134).

**Interfaces:**
- Consumes: spoke URLs from Tasks 1–8 plus existing `/boise-repair`, `/twin-falls-repair`, `/rexburg-repair`, `/ketchum-repair`.
- Produces: region section with id `id="idaho"` and the anchor `#idaho` that Tasks 10–11 place near; class names `mail-region`, `mail-region-head`, `mail-region-towns` used only here.

- [ ] **Step 1: Replace the section HTML.** Keep the enclosing `<section>`/`<div class="container">` wrappers and the existing H2/sub styling classes. New H2: `Serving all of Idaho — every region, by mail`. New sub: `We're based in Hailey, and USPS Priority makes every corner of the state two mail days away or less. Find your region — the turnaround numbers are door-to-door, not marketing.` Then five region blocks with this exact structure (repeat per region):

```html
<div class="mail-region" data-animate="">
  <div class="mail-region-head">
    <h3>Treasure Valley &amp; Southwest</h3>
    <span class="mail-region-time">2–3 days door-to-door</span>
  </div>
  <p class="mail-region-note">Boise, Meridian, Nampa, Caldwell, Eagle, Kuna, Mountain Home, Emmett. Priority mail often runs next-day each way — the fastest region in the state.</p>
  <p class="mail-region-links">Dedicated pages: <a href="/boise-repair">Boise</a> · <a href="/nampa-meridian-repair">Nampa &amp; Meridian</a></p>
</div>
```

The five regions (use the turnaround canon; each `mail-region-note` names the towns listed in the canon table for that region):
1. **Treasure Valley &amp; Southwest** — `2–3 days door-to-door` — links: `/boise-repair` (Boise), `/nampa-meridian-repair` (Nampa &amp; Meridian).
2. **Magic Valley &amp; South Central** — `3–4 days — or drive up once` — note ends with: `Twin Falls is the one region close enough to choose: mail it, or drive 80 minutes with the part staged before you leave.` — link: `/twin-falls-repair` (Twin Falls).
3. **Eastern Idaho** — `3–4 days door-to-door` — links: `/idaho-falls-repair` (Idaho Falls), `/pocatello-repair` (Pocatello), `/rexburg-repair` (Rexburg), `/teton-valley-repair` (Teton Valley).
4. **Central Mountains** — `3–4 days door-to-door` — note ends with: `Wood River Valley neighbors: skip the box — you're local.` — links: `/mccall-repair` (McCall), `/salmon-repair` (Salmon), `/ketchum-repair` (Ketchum &amp; Sun Valley).
5. **North Idaho &amp; the Palouse** — `4–6 days door-to-door` — note names Coeur d'Alene, Post Falls, Hayden, Kellogg, Moscow, Lewiston, Sandpoint, Bonners Ferry and states honestly: `The longest mail run in Idaho — and still shorter than the drive.` — links: `/coeur-dalene-repair` (Coeur d'Alene), `/sandpoint-repair` (Sandpoint).

Add `id="idaho"` to the section tag if not present.

- [ ] **Step 2: Add the section's CSS** to the page's existing large inline `<style>` block (the one containing `.mailin-page` rules), appended at the end:

```css
.mail-region{border:1px solid var(--border-default);border-radius:16px;padding:1.4rem 1.6rem;margin-bottom:1rem;background:var(--bg-card)}
.mail-region-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:.5rem;margin-bottom:.5rem}
.mail-region-head h3{font-size:1.25rem;margin:0}
.mail-region-time{font-size:.85rem;font-weight:700;color:var(--accent);white-space:nowrap}
.mail-region-note{color:var(--text-secondary);margin:0 0 .55rem}
.mail-region-links{font-size:.9rem;margin:0}
.mail-region-links a{color:var(--accent);text-decoration:underline;text-underline-offset:3px}
```

- [ ] **Step 3: Expand the LocalBusiness `areaServed`** (line ~134 block) from its current city list to exactly these 16 City nodes (same `containedInPlace` State Idaho shape as the existing entries): Hailey, Ketchum, Sun Valley, Bellevue, Boise, Meridian, Nampa, Twin Falls, Idaho Falls, Pocatello, Rexburg, Coeur d'Alene, Sandpoint, McCall, Salmon, Driggs.

- [ ] **Step 4: Verify:**
```bash
python3 -c "
import re,json
h=open('mail-in-repair.html').read()
[json.loads(m) for m in re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>',h,re.S)]
print('JSON-LD OK')"
grep -c 'mail-region' mail-in-repair.html          # expect ≥ 20
grep -c '"@type": "City"' mail-in-repair.html      # expect 16
for u in idaho-falls pocatello coeur-dalene nampa-meridian mccall salmon sandpoint teton-valley; do grep -c "/$u-repair" mail-in-repair.html; done   # each ≥ 1
```

- [ ] **Step 5: Commit:** `git commit -am "feat: rebuild mail-in Idaho section as 5-region directory, expand City schema to 16"`

---

### Task 10: "Check your town" lookup widget on the hub

**Files:**
- Modify: `mail-in-repair.html` — insert a new section immediately **before** the region directory section from Task 9 (`id="idaho"`), plus inline `<script>` before `</body>` (next to the existing page inline scripts).

**Interfaces:**
- Consumes: turnaround canon; region section anchor `#idaho`.
- Produces: section `id="town-lookup"`; global function none (all scoped in IIFE); element ids `townInput`, `townResult`, datalist `townList`.

- [ ] **Step 1: Insert the section HTML:**

```html
<section class="section" id="town-lookup">
  <div class="container">
    <div class="section-eyebrow">Your Town</div>
    <h2 class="section-title">How far are you from fixed?</h2>
    <p class="section-sub">Type your town or ZIP — get the honest door-to-door estimate for mail-in repair from your address.</p>
    <div class="town-lookup-box" data-animate="">
      <input id="townInput" list="townList" type="text" inputmode="text" autocomplete="off"
             placeholder="e.g. Sandpoint, Driggs, 83814…" aria-label="Your town or ZIP code"/>
      <datalist id="townList"></datalist>
      <div id="townResult" class="town-result" role="status" aria-live="polite" hidden>
        <div class="town-result-time" id="townResultTime"></div>
        <p class="town-result-note" id="townResultNote"></p>
        <p class="town-result-cta"><a class="btn btn-primary" href="sms:+12084501606">Text photos for your quote</a></p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Append the CSS** to the same inline `<style>` block as Task 9's:

```css
.town-lookup-box{max-width:560px;margin:0 auto}
.town-lookup-box input{width:100%;padding:1rem 1.2rem;font-size:1.05rem;font-family:var(--font-body);color:var(--text-primary);background:var(--bg-input);border:1px solid var(--border-strong);border-radius:14px;outline:none}
.town-lookup-box input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-dim)}
.town-result{margin-top:1rem;padding:1.3rem 1.5rem;border:1px solid var(--border-default);border-radius:16px;background:var(--bg-card)}
.town-result-time{font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:var(--accent);margin-bottom:.35rem}
.town-result-note{color:var(--text-secondary);margin:0 0 .9rem}
.town-result-cta{margin:0}
```

- [ ] **Step 3: Insert the script** before `</body>` (after the existing inline scripts):

```html
<script id="town-lookup-js">(function(){
var input=document.getElementById('townInput'),res=document.getElementById('townResult'),
    tEl=document.getElementById('townResultTime'),nEl=document.getElementById('townResultNote'),
    list=document.getElementById('townList');
if(!input)return;
// t=town, d=door-to-door claim, n=note. Claims must match the turnaround canon.
var LOCAL="You're local — skip the box. Text first and come by the shop in Hailey.";
var TOWNS=[
 {t:"Boise",d:"2–3 days",n:"Priority mail often runs next-day each way from Ada County.",p:"/boise-repair"},
 {t:"Meridian",d:"2–3 days",n:"Same run as Boise — often next-day each way.",p:"/nampa-meridian-repair"},
 {t:"Nampa",d:"2–3 days",n:"Fastest mail region in the state.",p:"/nampa-meridian-repair"},
 {t:"Caldwell",d:"2–3 days",n:"Fastest mail region in the state.",p:"/nampa-meridian-repair"},
 {t:"Eagle",d:"2–3 days",n:"Same run as Boise — often next-day each way.",p:"/boise-repair"},
 {t:"Kuna",d:"2–3 days",n:"Same run as Boise — often next-day each way.",p:"/nampa-meridian-repair"},
 {t:"Mountain Home",d:"2–3 days",n:"Fast Treasure Valley routing.",p:"/boise-repair"},
 {t:"Emmett",d:"2–3 days",n:"Fast Treasure Valley routing.",p:"/boise-repair"},
 {t:"Twin Falls",d:"3–4 days — or drive up once",n:"Close enough to choose: mail it, or drive 80 minutes with your part staged before you leave.",p:"/twin-falls-repair"},
 {t:"Jerome",d:"3–4 days — or drive up once",n:"Same choice as Twin Falls: box or an 80-minute drive.",p:"/twin-falls-repair"},
 {t:"Burley",d:"3–4 days",n:"Mini-Cassia ships on the Magic Valley timeline.",p:"/twin-falls-repair"},
 {t:"Rupert",d:"3–4 days",n:"Mini-Cassia ships on the Magic Valley timeline.",p:"/twin-falls-repair"},
 {t:"Gooding",d:"3–4 days",n:"Or a short drive over to Hailey — text first either way.",p:"/twin-falls-repair"},
 {t:"Shoshone",d:"3–4 days",n:"Or a short drive up ID-75 — text first either way.",p:"/twin-falls-repair"},
 {t:"Idaho Falls",d:"3–4 days",n:"About two mail days each way from Bonneville County.",p:"/idaho-falls-repair"},
 {t:"Ammon",d:"3–4 days",n:"Ships on the Idaho Falls timeline.",p:"/idaho-falls-repair"},
 {t:"Rigby",d:"3–4 days",n:"Ships on the Idaho Falls timeline.",p:"/idaho-falls-repair"},
 {t:"Blackfoot",d:"3–4 days",n:"Ships on the eastern Idaho timeline.",p:"/pocatello-repair"},
 {t:"Pocatello",d:"3–4 days",n:"ISU students: mention it when you text — 15% off.",p:"/pocatello-repair"},
 {t:"Chubbuck",d:"3–4 days",n:"Ships on the Pocatello timeline.",p:"/pocatello-repair"},
 {t:"American Falls",d:"3–4 days",n:"Ships on the Pocatello timeline.",p:"/pocatello-repair"},
 {t:"Rexburg",d:"3–4 days",n:"BYU-Idaho students: mention it when you text — 15% off.",p:"/rexburg-repair"},
 {t:"St. Anthony",d:"3–4 days",n:"Ships on the Rexburg timeline.",p:"/rexburg-repair"},
 {t:"Driggs",d:"3–4 days",n:"No Teton Pass required.",p:"/teton-valley-repair"},
 {t:"Victor",d:"3–4 days",n:"No Teton Pass required.",p:"/teton-valley-repair"},
 {t:"Tetonia",d:"3–4 days",n:"Ships on the Teton Valley timeline.",p:"/teton-valley-repair"},
 {t:"Ashton",d:"3–4 days",n:"Ships on the eastern Idaho timeline.",p:"/teton-valley-repair"},
 {t:"McCall",d:"3–4 days",n:"Beats two trips down Highway 55.",p:"/mccall-repair"},
 {t:"Donnelly",d:"3–4 days",n:"Ships on the McCall timeline.",p:"/mccall-repair"},
 {t:"Cascade",d:"3–4 days",n:"Ships on the McCall timeline.",p:"/mccall-repair"},
 {t:"Riggins",d:"3–4 days",n:"Ships on the McCall timeline.",p:"/mccall-repair"},
 {t:"Salmon",d:"3–4 days",n:"Two mail days down US-93 — the box beats the drive every time.",p:"/salmon-repair"},
 {t:"Challis",d:"3–4 days",n:"Ships on the Salmon timeline.",p:"/salmon-repair"},
 {t:"Mackay",d:"3–4 days",n:"Ships on the central-mountains timeline.",p:"/salmon-repair"},
 {t:"Stanley",d:"3–4 days",n:"Or come over Galena when the pass is friendly — text first.",p:null},
 {t:"Arco",d:"3–4 days",n:"Ships on the central-mountains timeline.",p:null},
 {t:"Coeur d'Alene",d:"4–5 days",n:"Keep it in Idaho — no Spokane trip.",p:"/coeur-dalene-repair"},
 {t:"Post Falls",d:"4–5 days",n:"Ships on the Coeur d'Alene timeline.",p:"/coeur-dalene-repair"},
 {t:"Hayden",d:"4–5 days",n:"Ships on the Coeur d'Alene timeline.",p:"/coeur-dalene-repair"},
 {t:"Kellogg",d:"4–5 days",n:"Silver Valley ships on the North Idaho timeline.",p:"/coeur-dalene-repair"},
 {t:"Moscow",d:"4–5 days",n:"U of I students: mention it when you text — 15% off.",p:null},
 {t:"Lewiston",d:"4–5 days",n:"Ships on the North Idaho timeline.",p:null},
 {t:"Grangeville",d:"4–5 days",n:"Ships on the north-central timeline.",p:null},
 {t:"Orofino",d:"4–5 days",n:"Ships on the north-central timeline.",p:null},
 {t:"Sandpoint",d:"4–6 days",n:"Idaho's longest mail run — and still shorter than the drive.",p:"/sandpoint-repair"},
 {t:"Priest River",d:"4–6 days",n:"Ships on the Sandpoint timeline.",p:"/sandpoint-repair"},
 {t:"Bonners Ferry",d:"4–6 days",n:"Ships on the Sandpoint timeline.",p:"/sandpoint-repair"},
 {t:"Hailey",d:"You're 5 minutes away",n:LOCAL,p:null},
 {t:"Bellevue",d:"You're 10 minutes away",n:LOCAL,p:null},
 {t:"Ketchum",d:"You're 20 minutes away",n:LOCAL,p:"/ketchum-repair"},
 {t:"Sun Valley",d:"You're 20 minutes away",n:LOCAL,p:"/ketchum-repair"}
];
// ZIP prefix fallback (Idaho is 832xx–838xx). Local WRV ZIPs handled first.
var WRV={"83333":1,"83313":1,"83340":1,"83353":1,"83348":1};
var ZIP3={"832":["3–4 days","Southeast Idaho ships on the eastern timeline."],
          "833":["3–4 days","Magic Valley / Wood River region — if you're in the valley, just come in."],
          "834":["3–4 days","Eastern Idaho — about two mail days each way."],
          "835":["4–5 days","Lewiston–Clearwater region timeline."],
          "836":["2–3 days","Treasure Valley — often next-day mail each way."],
          "837":["2–3 days","Boise — often next-day mail each way."],
          "838":["4–6 days","North Idaho — the longest run in the state, still shorter than the drive."]};
TOWNS.forEach(function(x){var o=document.createElement('option');o.value=x.t;list.appendChild(o);});
function norm(s){return s.toLowerCase().replace(/[^a-z0-9 ]/g,'').trim();}
function show(d,n,p){
  tEl.textContent=d;
  nEl.innerHTML=n+(p?' <a href="'+p+'">See your local page.</a>':'');
  res.hidden=false;
}
function lookup(){
  var q=norm(input.value);
  if(q.length<3){res.hidden=true;return;}
  var zip=q.match(/^(\d{5})/);
  if(zip){
    if(WRV[zip[1]]){show("You're local",LOCAL,null);return;}
    var z3=ZIP3[zip[1].slice(0,3)];
    if(z3){show(z3[0]+" door-to-door",z3[1],null);return;}
    show("Anywhere in Idaho works","Not a ZIP we recognize — but if USPS picks up there, we can fix from there. Text photos and we'll confirm the timeline.",null);
    return;
  }
  var hit=null;
  for(var i=0;i<TOWNS.length;i++){
    var t=norm(TOWNS[i].t);
    if(t===q||t.indexOf(q)===0){hit=TOWNS[i];break;}
  }
  if(hit){show(/day/.test(hit.d)?hit.d+" door-to-door":hit.d,hit.n,hit.p);}
  else{show("Anywhere in Idaho works","Your town isn't in our shortlist yet, but every Idaho post office reaches us in one to three days. Text photos and we'll confirm your exact timeline.",null);}
}
input.addEventListener('input',lookup);
input.addEventListener('change',lookup);
})();</script>
```

- [ ] **Step 4: Verify in a browser:**
```bash
python3 -m http.server 8742 &
```
Open `http://localhost:8742/mail-in-repair.html` (Playwright or manual) and check: typing `Sandpoint` shows `4–6 days door-to-door` + Sandpoint page link; typing `83814` shows `4–5 days`; typing `Hailey` shows the local message; typing `zzz` after 3 chars shows the fallback. No console errors. Kill the server after.

- [ ] **Step 5: Commit:** `git commit -am "feat: add town/ZIP lookup widget to mail-in hub"`

---

### Task 11: Statewide proof map on the hub

**Files:**
- Modify: `mail-in-repair.html` — insert a new section immediately **after** the region directory (`id="idaho"`) section.
- Create: `assets/idaho-map.svg` is **not** created — the SVG is inline (it needs CSS-variable theming).

**Interfaces:**
- Consumes: nothing from other tasks (standalone section).
- Produces: section `id="proof-map"`.

**Truthfulness constraint:** The page already states "Here's where our customers ship from." Pins therefore mark **towns + device categories**, e.g. "Boise — phones &amp; MacBooks". Do not write specific repair anecdotes.

- [ ] **Step 1: Generate the SVG geometry.** Run this script; it prints the outline path and pin coordinates to paste into the section:

```python
python3 - <<'EOF'
# Stylized simplified Idaho outline (lat, lon vertices, clockwise from NW corner)
outline=[(49.001,-117.032),(49.001,-116.049),(48.5,-115.85),(47.95,-115.05),(47.4,-114.85),
(46.9,-114.45),(46.6,-114.32),(46.0,-114.45),(45.65,-114.0),(45.7,-113.45),(45.0,-113.0),
(44.5,-112.8),(44.36,-111.48),(44.5,-111.05),(42.0,-111.046),(42.0,-117.026),(43.8,-117.03),
(44.25,-116.97),(44.85,-116.85),(45.3,-116.7),(45.62,-116.46),(45.95,-116.79),(46.42,-117.04)]
pins={"Boise":(43.615,-116.202),"Twin Falls":(42.556,-114.470),"Idaho Falls":(43.492,-112.040),
"Pocatello":(42.871,-112.445),"Rexburg":(43.826,-111.789),"Coeur d'Alene":(47.678,-116.780),
"Sandpoint":(48.277,-116.553),"Moscow":(46.732,-117.000),"Lewiston":(46.416,-117.017),
"McCall":(44.911,-116.099),"Salmon":(45.176,-113.896),"Driggs":(43.723,-111.111),
"Nampa":(43.574,-116.564),"HAILEY":(43.520,-114.315)}
def xy(lat,lon): return (round((lon+117.243)*70.0,1), round((49.001-lat)*100.0,1))
d="M "+" L ".join(f"{x} {y}" for x,y in (xy(a,b) for a,b in outline))+" Z"
print(f'<path d="{d}"/>' )
for name,(a,b) in pins.items():
    x,y=xy(a,b); print(f'{name}: cx="{x}" cy="{y}"')
EOF
```

- [ ] **Step 2: Insert the section HTML** (fill in the path `d` and each pin's `cx`/`cy` from Step 1's output):

```html
<section class="section section--alt" id="proof-map">
  <div class="container">
    <div class="section-eyebrow">Already Statewide</div>
    <h2 class="section-title">Boxes come in from every corner of Idaho</h2>
    <p class="section-sub">Where mail-in customers ship from, and what they send. If your town has a post office, you're on this map already — it just doesn't know it yet.</p>
    <div class="proof-map-wrap" data-animate="">
      <svg class="proof-map-svg" viewBox="0 0 435 700" role="img" aria-label="Map of Idaho showing towns mail-in repair customers ship from">
        <path class="pm-outline" d="[FROM STEP 1]"/>
        <!-- one <g> per pin; HAILEY uses class pm-home; all others pm-pin -->
        <g class="pm-pin"><circle cx="[Boise x]" cy="[Boise y]" r="6"/><text x="[x+12]" y="[y+4]">Boise — phones &amp; MacBooks</text></g>
        <!-- repeat for: Nampa (laptops &amp; consoles), Twin Falls (phones), Pocatello (student phones),
             Idaho Falls (phones &amp; iPads), Rexburg (student devices), Driggs (phones),
             Salmon (phones &amp; laptops), McCall (phones), Lewiston (laptops), Moscow (student devices),
             Coeur d'Alene (phones &amp; MacBooks), Sandpoint (phones) -->
        <g class="pm-home"><circle cx="[Hailey x]" cy="[Hailey y]" r="8"/><text x="[x+14]" y="[y+5]">HDR — Hailey</text></g>
      </svg>
    </div>
  </div>
</section>
```

Place label `<text>` to the **left** of pins in the east (Idaho Falls, Rexburg, Driggs, Salmon — use `x="[x-12]"` with `text-anchor="end"`) so labels stay inside the viewBox. Nudge any overlapping labels ±10px vertically (Moscow/Lewiston are 30px apart — offset one).

- [ ] **Step 3: Append the CSS** to the same inline `<style>` block:

```css
.proof-map-wrap{max-width:520px;margin:0 auto}
.proof-map-svg{width:100%;height:auto;display:block}
.pm-outline{fill:var(--bg-card);stroke:var(--border-strong);stroke-width:2;stroke-linejoin:round}
.pm-pin circle{fill:var(--accent);opacity:.9}
.pm-pin text{fill:var(--text-secondary);font-family:var(--font-body);font-size:13px}
.pm-home circle{fill:var(--color-green)}
.pm-home text{fill:var(--text-primary);font-weight:700;font-family:var(--font-body);font-size:14px}
@media (prefers-reduced-motion: no-preference){
  .pm-pin circle{animation:pmPulse 3s ease-in-out infinite}
  .pm-pin:nth-of-type(odd) circle{animation-delay:1.5s}
  @keyframes pmPulse{0%,100%{opacity:.55}50%{opacity:1}}
}
@media (max-width:640px){.pm-pin text{font-size:15px}}
```

- [ ] **Step 4: Verify:** serve locally, screenshot the section, and check: outline reads as Idaho (tall panhandle, wide south), no label clipped at the viewBox edge, Hailey pin green, pins pulse. `grep -c 'pm-pin' mail-in-repair.html` = 13.

- [ ] **Step 5: Commit:** `git commit -am "feat: add statewide proof map to mail-in hub"`

---

### Task 12: Hub FAQ expansion (+ JSON-LD sync)

**Files:**
- Modify: `mail-in-repair.html` — the `#faq` section's `.faq-list` (line ~2499) and the FAQPage JSON-LD block.
- Read first: `tips/data-safe-during-repair.html` — the data-privacy answer below must not contradict it; if it conflicts, rewrite the answer using only that page's claims.

**Interfaces:** none produced; visible FAQ text and JSON-LD `Answer.text` must match each other exactly.

- [ ] **Step 1: Append five `<details class="faq-item" data-animate="">` items** to `.faq-list`, copying the existing item markup shape (summary → `faq-question`, div → `faq-answer`):

1. **Q:** `Is it actually safe to mail a phone or laptop?` **A:** `Yes. USPS Priority includes tracking on every box, our packing guide below shows exactly how to immobilize the device, and you get a text when it arrives, when work starts, when it's done, and when it ships back with a tracking number. Thousands of devices cross Idaho in the mail every day — packed right, yours is just one more.`
2. **Q:** `Do you need my passcode, and is my data safe?` **A:** `Most hardware repairs don't require access to your data, and we tell you up front when a passcode would genuinely help testing. Nothing is browsed, copied, or backed up on our end — and our guide on device data during repair explains exactly what a shop does and doesn't need.` (link the phrase "device data during repair" → `/tips/data-safe-during-repair`)
3. **Q:** `How long does mail-in take from North Idaho?` **A:** `Coeur d'Alene, Moscow, and Lewiston typically run four to five days door-to-door; Sandpoint and Bonners Ferry four to six. It's the longest mail run in the state — and still shorter than driving it twice.`
4. **Q:** `Do I need the original box to ship my device?` **A:** `No. Any sturdy box with padding on all six sides works — the packing guide on this page walks through it in five minutes with materials you already have. There's also a printable packing sheet you can take to the post office.` (link "printable packing sheet" → `/mail-in-kit`)
5. **Q:** `Which carrier should I use?` **A:** `USPS Priority Mail from any Idaho post office is the sweet spot: one to three days to reach us from anywhere in the state, tracking included, and free return shipping on the way back. UPS and FedEx work too if one is more convenient for you.`

- [ ] **Step 2: Append the same five as Question/Answer nodes** in the FAQPage JSON-LD `mainEntity` array (Answer text = visible text, links stripped to plain phrases).

- [ ] **Step 3: Verify:** JSON-LD parse check (Task 9 Step 4 command); `grep -c 'faq-item' mail-in-repair.html` increased by exactly 5; `grep -c '"@type": "Question"' mail-in-repair.html` increased by exactly 5 (was 18).

- [ ] **Step 4: Commit:** `git commit -am "content: add 5 statewide FAQ items to mail-in hub with schema sync"`

---

### Task 13: Printable mail-in kit page + hub links

**Files:**
- Create: `mail-in-kit.html` — standalone, self-contained (own tiny inline CSS, print-first; does NOT load style.css or main.js; DOES include the vt-css block copied from any page).
- Modify: `mail-in-repair.html` (two links), `_redirects`, `sitemap.xml`, `robots`-relevant nothing (page is indexable), `llms.txt`, `llms-full.txt`.

**Interfaces:**
- Consumes: nothing.
- Produces: `/mail-in-kit` URL used by Task 12's FAQ answer #4.

**Constraint:** The site's flow is quote-first — the ship-to address is given by text after quote approval, and the page must reflect that (blank write-in line), not print a street address (none is published anywhere on the site).

- [ ] **Step 1: Create `mail-in-kit.html`** with exactly this structure (head: title `Mail-In Repair Packing Sheet — Hailey Device Repair` (53 chars), description `Print this one-page packing sheet for your mail-in repair: five packing steps, what to include in the box, and carrier tips. From Hailey Device Repair.` (~151 — verify), canonical `https://www.haileyrepair.com/mail-in-kit`, `<meta name="robots" content="index,follow">`, favicon links copied from any page, vt-css block):

Body content (single `<main class="sheet">`):
1. Header row: "Hailey Device Repair — Mail-In Packing Sheet" + "208-450-1606 · text photos first" + note "Step 0: If you haven't texted for your quote yet, do that first — no work happens without your approved quote."
2. **Five packing steps** (numbered, one line + sub-line each): ① Back it up if it powers on. ② Power off; for phones remove the case; for laptops, ship the charger only if asked. ③ Wrap in soft padding; the device must not move when you shake the box. ④ Pad all six sides — two inches everywhere. ⑤ USPS Priority with tracking; text us the tracking number.
3. **"Write this on a note inside the box"** card with blank lines: Name ___ · Callback number ___ · Device &amp; model ___ · What happened ___ · Quote approved by text on (date) ___
4. **Ship-to line:** "Ship to: you'll get the address by text when your quote is approved — write it here:" + three blank ruled lines.
5. Footer line: "Free return shipping · 40-day warranty · haileyrepair.com/mail-in-repair"

CSS (inline `<style>`): plain sheet — white background, black text, `max-width:720px`, system font stack for print reliability, `.sheet{padding:2rem}`, blank lines as `border-bottom:1px solid #999;height:1.6em`, and:
```css
@media print{ .no-print{display:none} body{background:#fff} @page{margin:12mm} }
```
Add a `.no-print` button at top: `<button class="no-print" onclick="print()">Print this sheet</button>` and a `.no-print` link back to `/mail-in-repair`.

- [ ] **Step 2: Link it from the hub** in `mail-in-repair.html`: (a) at the end of the "How to pack your device for shipping" section body add: `<p><a href="/mail-in-kit">Print the one-page packing sheet →</a></p>`; (b) Task 12's FAQ item 4 already links it — verify both exist.

- [ ] **Step 3: Infra entries** (same four files/formats as the spoke checklist step 8, slug `mail-in-kit`, llms line: `- [Mail-in packing sheet](/mail-in-kit): Printable one-page packing checklist for mail-in repairs.`).

- [ ] **Step 4: Verify:** title/desc length check; `grep -c 'vt-css' mail-in-kit.html` = 1; open locally and run a print preview (or Playwright `page.emulateMedia({media:'print'})` screenshot) — one page, button hidden.

- [ ] **Step 5: Commit:** `git commit -am "feat: add printable mail-in packing sheet page"`

---

### Task 14: Mail-in callout on all tips & guides articles

**Files:**
- Modify: all 21 `tips/*.html` + all 4 `guides/*.html` (25 files) via script.

**Interfaces:** none. The callout is self-contained (own scoped `<style>`), palette-neutral so it survives all four /tips design languages (uses translucent gray + `currentColor`-adjacent styling, no site CSS variables).

- [ ] **Step 1: Run this injection script** from the repo root:

```python
python3 - <<'EOF'
import glob
SNIPPET='''<aside class="hdr-mailin-callout">
<style>.hdr-mailin-callout{margin:2.5rem auto;max-width:720px;padding:1.2rem 1.4rem;border:1px solid rgba(128,128,128,.35);border-radius:14px;background:rgba(128,128,128,.08);font-family:inherit;line-height:1.55}.hdr-mailin-callout strong{display:block;margin-bottom:.3rem}.hdr-mailin-callout a{text-decoration:underline;text-underline-offset:3px;color:inherit;font-weight:600}</style>
<strong>Not in the Wood River Valley?</strong>
We fix this exact problem by mail for all of Idaho — quote by text before you ship, free return shipping, 40-day warranty. <a href="/mail-in-repair">See how mail-in repair works&nbsp;&rarr;</a>
</aside>
'''
done=skip=0
for f in sorted(glob.glob('tips/*.html')+glob.glob('guides/*.html')):
    h=open(f).read()
    if 'hdr-mailin-callout' in h: skip+=1; continue
    i=h.find('<footer')
    if i==-1: print('NO FOOTER:',f); skip+=1; continue
    open(f,'w').write(h[:i]+SNIPPET+h[i:])
    done+=1
print(f'injected {done}, skipped {skip}')
EOF
```
Expected: `injected 25, skipped 0` (if any print `NO FOOTER`, inject that file manually before the page's closing content container and note it in the commit message).

- [ ] **Step 2: Spot-check rendering** on one page from each design tier — serve locally and screenshot `tips/water-damaged-phone.html`, `tips/switch-joycon-drift.html`, `guides/iphone-screen-repair.html`: the callout must read cleanly in each (it will look intentionally neutral, not broken).

- [ ] **Step 3: Verify count:** `grep -rl 'hdr-mailin-callout' tips guides | wc -l` → 25.

- [ ] **Step 4: Commit:** `git commit -am "content: add statewide mail-in callout to all tips and guides articles"`

---

### Task 15: Final sitewide verification pass

**Files:** none created; fixes only if checks fail.

- [ ] **Step 1: Full link + schema sweep:**
```bash
python3 -m http.server 8742 &
# every internal href on the hub resolves (200 via pretty URL needs _redirects on the host,
# so check the .html file exists instead):
python3 - <<'EOF'
import re,os
h=open('mail-in-repair.html').read()
for u in sorted(set(re.findall(r'href="(/[a-z0-9-]+)"',h))):
    p=u.lstrip('/')+'.html'
    print(('OK  ' if os.path.exists(p) else 'MISS ')+u)
EOF
# JSON-LD parses on every new/changed page:
for f in mail-in-repair.html idaho-falls-repair.html pocatello-repair.html coeur-dalene-repair.html nampa-meridian-repair.html mccall-repair.html salmon-repair.html sandpoint-repair.html teton-valley-repair.html mail-in-kit.html; do
  python3 -c "
import re,json,sys
h=open('$f').read()
[json.loads(m) for m in re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>',h,re.S)]
print('$f OK')"
done
```
Expected: no `MISS` lines, all `OK`.

- [ ] **Step 2: Consistency greps:**
```bash
# turnaround canon — no page may claim numbers outside its region's canon:
grep -o '[0-9]–[0-9] days' *-repair.html mail-in-repair.html | sort | uniq -c
# every spoke links the hub:
for f in idaho-falls pocatello coeur-dalene nampa-meridian mccall salmon sandpoint teton-valley; do echo "$f: $(grep -c 'mail-in-repair' $f-repair.html)"; done   # each ≥ 2
# sitemap has all 9 new URLs:
grep -c 'idaho-falls-repair\|pocatello-repair\|coeur-dalene-repair\|nampa-meridian-repair\|mccall-repair\|salmon-repair\|sandpoint-repair\|teton-valley-repair\|mail-in-kit' sitemap.xml   # expect 9
```

- [ ] **Step 3: Browser pass** (Playwright): load the hub, exercise the town widget (Sandpoint / 83814 / Hailey / unknown), confirm the proof map renders and the region directory's 12 spoke links navigate (with a `.html` fallback locally). Zero console errors other than the known `_vercel/insights` 404 on localhost.

- [ ] **Step 4: Kill the server, final commit if any fixes were made:** `git commit -am "fix: statewide mail-in verification pass fixes"`

---

## Self-Review Notes (already applied)

- Spec coverage: region directory → Task 9; town lookup → Task 10; spokes ×8 → Tasks 1–8; proof map → Task 11; shipping-kit friction → Task 13 (printable sheet; prepaid-label *program* deliberately excluded — business decision flagged to Samuel, not buildable); SEO finishing (H1 already reads "Mail-In Device Repair for Idaho" — no change needed; FAQ → Task 12; City schema → Task 9 Step 3; tips/guides cross-links → Task 14; sitemap/llms/redirects → folded per-task).
- Type consistency: CSS class names (`mail-region*`, `town-*`, `pm-*`, `hdr-mailin-callout`, `.sheet`) each used only within their owning task; widget element ids consistent between HTML and JS steps; `/mail-in-kit` produced in Task 13 and consumed in Task 12's FAQ — if executing Task 12 before Task 13 the link 404s locally until Task 13 lands; execute in order.
- Turnaround claims in every content table cross-checked against the canon table.
