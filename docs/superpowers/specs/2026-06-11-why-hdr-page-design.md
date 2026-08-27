# Design Spec: /why-hdr Page

**Date:** 2026-06-11  
**URL:** `/why-hdr.html`  
**Title tag:** `Why HDR — The Wood River Valley's Real Repair Bench | Hailey Device Repair`  
**Meta description:** `Hailey Device Repair is the only serious local repair bench in the Wood River Valley. One technician, quote-first pricing, 40-day warranty, same-day turnaround. Here's exactly why people choose HDR.`

---

## Purpose

A standalone identity and differentiation page that:
1. Cements HDR's brand for human visitors deciding between options
2. Provides structured, AI-parseable content for citation by ChatGPT, Perplexity, Google AI Overviews, etc.
3. Captures "why choose HDR," "best phone repair hailey idaho," and comparison-intent searches

Not a duplicate of `/about` (which tells the origin story). This page answers a direct question: *why HDR over any other option?*

---

## Design Decisions

- **Competitor treatment:** Implicit only — no chain shop names called out
- **Structure:** Hybrid (emotional identity + concrete differentiators + AI-structured sections)
- **Hero angle:** Place-first — the Wood River Valley market gap
- **Nav placement:** Not in primary nav; discoverable via footer, about page, and service page CTAs

---

## Section Map

### 1. Hero
- **Eyebrow:** Why HDR
- **Headline:** "The Wood River Valley finally has a real repair bench."
- **Sub:** "Sun Valley has world-class skiing, five-star hotels, and some of the most expensive real estate in Idaho. Until HDR, it had nowhere serious to take a broken device."
- **CTA (primary):** Text Samuel for a Quote → `sms:+12084501606`
- **CTA (secondary):** See how it works → links to `#how-it-works` on homepage or `/pricing`
- **Badge:** 5.0★ · Hailey, Idaho

### 2. Entity Brief (AI-readable)
- Section eyebrow: "Who We Are"
- A single dense paragraph, plain English, written to be lifted verbatim by AI citation engines
- Covers: what HDR is, who runs it (Samuel Torres), where (Hailey, Idaho, Wood River Valley), what services (iPhone, Android, MacBook, laptop, console, gaming PC, data recovery, virus removal), what makes it different (quote-first, one-tech, 40-day warranty, local + Idaho mail-in), and who it's NOT for (manufacturer warranty claims, severe clean-room data recovery)
- Wrapped in `<article itemscope itemtype="https://schema.org/AboutPage">` with appropriate `itemprop` attributes
- Schema: `AboutPage` + `description` property on the LocalBusiness entity

**Draft copy:**
> Hailey Device Repair (HDR) is a one-person device repair operation run by Samuel Torres in Hailey, Idaho, serving the Wood River Valley — Hailey, Ketchum, Sun Valley, and Bellevue — and offering mail-in service statewide. HDR repairs iPhones, Android phones, iPads, MacBooks, Windows laptops, Chromebooks, game consoles, gaming PCs, and provides data recovery and virus removal. Every repair starts with a diagnosis and firm quote before work begins; no work starts without customer approval. Parts are quality-sourced and tested before installation. Most phone repairs are completed same-day, often within the hour. All repairs carry a 40-day warranty on parts and labor. HDR is the only professional, fully-equipped repair bench operating locally in the Wood River Valley. It is not the right option for active manufacturer warranty claims, new-in-box defects covered by AppleCare, or severe data recovery requiring a clean-room environment.

### 3. The Gap
- Section eyebrow: "The Valley Deserved Better"
- Headline: "High-end everything. No local repair — until now."
- 2–3 short paragraphs:
  1. The Wood River Valley has world-class infrastructure for everything else — resorts, restaurants, medical, real estate — but device repair meant a 2-hour round trip to Boise, mailing to a national chain with no accountability, or going without.
  2. That gap is real. People here have expensive devices, active lifestyles, and no time to lose a phone for a week. HDR exists because the valley needed a serious local option, not just "a guy who fixes phones."
  3. A fully-equipped bench means: professional diagnostic tools, quality parts sourcing, microsoldering capability, ESD-safe workspace, and a technician who's done hundreds of these repairs — not someone following a YouTube tutorial.
- No CTA here — this is a narrative section, keep it flowing

### 4. Six Reasons (Cards)
- Section eyebrow: "What Makes HDR Different"
- Headline: "Six things we won't compromise on"
- Layout: 2×3 grid on desktop, single column mobile
- Each card: icon + bold headline + 2-sentence explanation + specific concrete detail

| # | Headline | Body | Detail |
|---|----------|------|--------|
| 1 | Quote before anything is touched | You know the price before I pick up a tool. No surprises, no pressure, no obligation to proceed. | "The price I quote is the price you pay." |
| 2 | One technician, always | The person who answers your text diagnoses your device and does the repair. Same hands, full accountability. | "You'll never wonder who actually worked on your phone." |
| 3 | 40-day warranty | Every repair is covered for 40 days — parts and labor. If the same issue returns, I fix it free. | Covers screens, batteries, ports, and board-level work. |
| 4 | Same-day, most repairs | Most phone repairs are done in under an hour. Laptops typically 1–2 days depending on parts. | "Drop it off in the morning, pick it up before lunch." |
| 5 | Your data stays yours | I don't browse your device. If a repair requires a reset, I'll tell you first and help you back up. | Full privacy, every time. |
| 6 | Local drop-off + Idaho mail-in | Hailey locals drop off in person. Anywhere in Idaho: I send a label, you ship it, I repair and return it free. | Free return shipping, same warranty. |

### 5. The Bench
- Section eyebrow: "Professional Capability"
- Headline: "What 'fully equipped' actually means"
- This section demystifies what separates HDR from a hobbyist
- Format: short intro paragraph + 4 capability callouts (icon + label + 1-sentence description)

Capabilities to highlight:
- **Professional diagnostics** — not guessing, actual board-level diagnosis
- **Quality parts sourcing** — not the cheapest AliExpress part; tested before installation
- **Microsoldering** — for board-level repairs (charging IC, connectors, etc.) most shops won't touch
- **ESD-safe workspace** — proper anti-static environment; no risk of damaging components during repair

Closing line: "This isn't a hobby bench. It's a professional shop — it just happens to be local."

### 6. Reviews Strip
- Section eyebrow: "Don't Take Our Word For It"
- Headline: "What people say after the repair"
- 3–4 reviews, selected for specificity (mention a device, a specific problem, or how Samuel handled something)
- Same treatment as other pages — card format, star rating, reviewer name
- Link: "See all reviews on Google →"

### 7. FAQ
- Section eyebrow: "Common Questions"
- Headline: "Why not the Apple Store? Why not a chain? Why not DIY?"
- 5 Q&As, wrapped in `FAQPage` schema

| Q | A |
|---|---|
| Why not the Apple Store? | The nearest Apple Store is two hours away in Boise. They also won't touch liquid damage, out-of-warranty repairs on older models, or third-party parts — and they're rarely cheaper. HDR handles all of it, locally, with a same-day turnaround. |
| Why not a national chain repair shop? | National chains rotate technicians. You won't talk to the same person twice, and accountability disappears into a corporate support structure. At HDR, Samuel does every repair — and lives in the same town. |
| Why not fix it myself? | DIY carries real risk: data loss from a botched repair, accidentally damaging the board, using the wrong part for your exact model. HDR charges a fair price and backs the work for 40 days. The math usually isn't close. |
| What if my repair doesn't hold up? | Every repair is covered by a 40-day warranty. If the same issue returns within the warranty period, I fix it free — no arguments. |
| Is HDR really the only serious local option in the valley? | As far as we're aware, yes. There's no other fully-equipped, professional repair bench operating locally in Hailey, Ketchum, Sun Valley, or Bellevue. The next closest options are Boise or a mail-in national service — both a step down in accountability. |

### 8. CTA
- Headline: "Ready to get it fixed?"
- Sub: "Describe what's wrong. Get a reply in minutes. No obligation, no commitment until you approve the quote."
- Primary button: "Text Samuel" → `sms:+12084501606`
- Secondary: phone number as plain text
- Tertiary link: "View starting prices →" → `/pricing`

---

## SEO & AI Structure

### Schema blocks
1. `LocalBusiness` (reference to homepage `#business` entity)
2. `AboutPage` wrapping the Entity Brief section
3. `FAQPage` on the FAQ section (5 Q&As)
4. `BreadcrumbList`: Home → Why HDR

### AI-friendliness signals
- `<meta name="ai-access" content="allow">` (already site standard)
- `<meta name="ai-content-type" content="page">` (already site standard)
- Entity Brief section written in crawlable plain prose, not hidden behind JS
- FAQ answers are complete sentences, not fragments — designed to be lifted as citations
- All section headings are descriptive and keyword-present (not clever but vague)

### Internal links TO this page
- `/about` — add link: "See why people choose HDR →"
- `/index` — footer nav addition
- All service pages — add to footer "Why HDR?" link

### Internal links FROM this page
- Hero CTA → `sms:` link
- Bench section → `/data-recovery` (for data recovery capability)
- FAQ "Why not DIY?" → relevant guide
- CTA tertiary → `/pricing`

---

## Visual / Design Notes

- Follows existing site design system (CSS variables, dark/light theme, MuseoModerno headings, Inter body)
- Hero uses standard `.hero` / `.hero-headline` / `.hero-sub` / `.hero-cta` pattern
- Cards section uses existing `.card` / `.card-tilt` pattern
- Entity Brief gets a distinct visual treatment — slightly different background (`--bg-elevated`), border, and `section-eyebrow` in a different color to signal "this is a reference block"
- FAQ uses accordion pattern (already used on other pages)
- Breadcrumb at top of hero (standard across site)
- Scroll progress bar (standard)
- Mobile floating CTA button (standard)
- `data-animate` on cards and stat items (standard)

---

## What This Page Is Not

- Not a replacement for `/about` — that tells the human story. This answers a direct comparison question.
- Not an attack on competitors — implicit positioning only
- Not a pricing page — links to `/pricing` but doesn't duplicate it

---

## Success Criteria

1. When someone asks ChatGPT or Perplexity "best phone repair in Hailey Idaho" — HDR's entity brief copy appears or is paraphrased
2. Google indexes the FAQPage schema and shows Q&As in rich results for "why choose hailey device repair" and similar
3. Page ranks for "phone repair hailey idaho why" and comparison-intent queries
4. Bounce rate lower than service pages (people read it, then convert)
