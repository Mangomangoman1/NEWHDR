# HDR Content Architecture Guide

## Tips Hub + Repair Guides — Build Specification for Hermes

Saved: 2026-05-20
Repo: `/Users/Samuel/.hermes/webagent/NEWHDR`

---

## Overview

This document specifies two parallel content systems to build for haileyrepair.com:

1. **Tips Hub** — preventive, educational, emergency content. Top-of-funnel audience. People who have devices and want to protect them, or are in the middle of a crisis.
2. **Repair Guides Hub** — diagnostic, procedural content. Mid-funnel audience. People with a specific broken device trying to understand their options before committing to a repair.

These are separate systems with separate hubs, separate spoke pages, and distinct intents. Do not conflate them. Each system links down to the service pages at the natural conversion moment — service pages are not modified as part of this project unless explicitly chosen later for supporting links.

---

## Governing Principles

### One job per page
Every page has a single intent. Tips spokes are educational. Guide spokes are procedural. Service pages are conversion-focused. The moment a page tries to do two jobs it does neither well.

### Direct answer first
Every article page — tips or guide — must open with a clear, quotable answer in the first 2–3 sentences before any explanation begins. This is how AI systems cite content.

Wrong:
> I get at least one water-damaged phone per week. Toilet drops, puddle splashes, rain...

Right:
> If your phone gets wet, power it off immediately, remove the SIM tray, and let it dry for 24–48 hours with airflow. Do not put it in rice — it doesn't absorb fast enough and can clog your ports.

Then the explanation follows.

### No cannibalization
Tips and guide spokes target informational queries. Service pages target commercial queries. Never optimize two pages for the same keyword. If unsure whether a page conflicts with a service page, check query intent: is the user trying to learn or trying to book?

### Quality over pace
Build 3–5 pages per week maximum. Google can interpret sudden high-volume publishing as a content spam pattern and temporarily suppress new pages. Measured pace allows natural indexing.

### Every spoke needs schema
Every tips spoke gets `Article` or `HowTo` schema with `datePublished`, `author`, and `about` fields. Every guide spoke gets `HowTo` schema with step-by-step structure where applicable. Both reference the stable `#business` entity.

---

## System 1: Tips Hub

### Purpose
Educational and preventive content for anyone with a device. This audience may not have a broken device right now. They're learning, preparing, or in the middle of an emergency.

### Hub Page

URL: `/tips`

Job: Pure index. No article content lives on this page. Its only function is to orient visitors and link to spoke pages, organized by category.

Structure:
- Page headline: `Device Care Tips & Repair Guides from the Bench`
- One-paragraph intro: who this is for and what they'll find
- Category sections, each containing 4–8 spoke links with one-sentence descriptions
- Soft CTA at the bottom: `Dealing with something right now? Text me.`

The hub page does not carry article content. If the content is useful enough to write, it earns its own spoke page.

Schema: `CollectionPage` referencing the business `#business` entity.

### Spoke URL Pattern

`/tips/[topic-slug]`

Examples:
- `/tips/water-damaged-phone`
- `/tips/lcd-vs-oled`
- `/tips/laptop-battery-dying`
- `/tips/repair-or-replace`
- `/tips/speed-up-slow-laptop`

### Spoke Page Structure

Every tips spoke follows this:

1. Direct answer — 2–3 sentences, quotable, citable
2. Context — why this matters, who it affects
3. Main content — steps, lists, explanations
4. Warning callouts where relevant
5. Pro tip from bench experience — something only a repair tech would know
6. Soft CTA — `Dealing with this right now? Text me.` → contact or relevant service page

Word count target: 400–800 words. Long enough to be thorough, short enough to be readable. Do not pad.

Tone: First person, direct, from a working repair tech. No fluff, no affiliate language, no generic “it depends” non-answers.

### Tips Spoke Inventory

#### Emergency
- `/tips/water-damaged-phone` — migrate from existing
- `/tips/phone-screen-black-but-on` — new
- `/tips/laptop-wont-turn-on-emergency` — new
- `/tips/dropped-phone-wont-respond` — new

#### Battery & Power
- `/tips/laptop-battery-dying` — migrate from existing
- `/tips/iphone-battery-health` — new
- `/tips/android-battery-health` — new
- `/tips/phone-charges-slowly` — new

#### Screens
- `/tips/lcd-vs-oled` — migrate from existing
- `/tips/cracked-screen-keep-using` — new
- `/tips/screen-protector-guide` — new

#### Performance
- `/tips/speed-up-slow-laptop` — migrate from existing
- `/tips/phone-running-hot` — new
- `/tips/laptop-overheating` — new

#### Decision Guides
- `/tips/repair-or-replace` — migrate from existing general framework
- `/tips/backup-before-repair` — new
- `/tips/what-to-text-for-a-quote` — verify existing standalone `/broken-phone-what-to-text`, link from here or create alias later

#### Data & Security
- `/tips/data-safe-during-repair` — new
- `/tips/factory-reset-before-selling` — new

### Tips Spoke Schema Template

Use `Article` for explanatory pieces:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Page headline]",
  "datePublished": "[ISO date]",
  "dateModified": "[ISO date]",
  "author": {
    "@type": "Person",
    "name": "Samuel",
    "worksFor": { "@id": "https://www.haileyrepair.com/#business" }
  },
  "publisher": { "@id": "https://www.haileyrepair.com/#business" },
  "about": { "@type": "Thing", "name": "[Topic]" },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.haileyrepair.com/tips/[slug]"
  }
}
```

Use `HowTo` for step-by-step tips:

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "[Page headline]",
  "description": "[Direct answer from first paragraph]",
  "provider": { "@id": "https://www.haileyrepair.com/#business" },
  "step": [
    { "@type": "HowToStep", "name": "[Step name]", "text": "[Step instruction]" }
  ]
}
```

---

## System 2: Repair Guides Hub

### Purpose
Procedural and diagnostic content for someone with a specific broken device. This audience is mid-funnel — they know something is wrong and are trying to understand what the repair involves, what it costs in general terms, and whether it's worth doing. They are not yet ready to book but are close.

### Hub Page

URL: `/guides` or `/repair-guides`

Job: Pure index. Organized by device category. Links to spoke pages with one-sentence descriptions of what each guide answers. No guide content lives on this page.

Structure:
- Page headline: `Device Repair Guides — What to Expect Before You Book`
- One-paragraph intro explaining the purpose: understand your repair before committing
- Device category sections: Phone, Laptop/Mac, Tablet, Console, Data Recovery
- Each section lists 3–6 guide spokes with brief descriptions
- Note at the bottom: `Ready to skip straight to a quote? Text me.`

Schema: `CollectionPage` referencing `#business`.

### Spoke URL Pattern

`/guides/[device-type]-[repair-type]`

Examples:
- `/guides/iphone-screen-repair`
- `/guides/laptop-battery-replacement`
- `/guides/macbook-wont-turn-on`
- `/guides/ps5-hdmi-repair`

### Spoke Page Structure

Every repair guide follows this:

1. Direct answer — what this repair is, roughly what it costs, how long it takes
2. What causes this problem — brief, useful context
3. What the repair actually involves — step-level overview, not a DIY tutorial
4. What to expect: timeline, process, what you need to bring/send
5. Cost signals — honest range framing, not a price list
6. DIY or professional? — honest assessment
7. Repair vs replace context specific to this repair type
8. Direct CTA — `Ready to get a quote for [repair type]?` → relevant service page

Word count target: 500–900 words. These are more detailed than tips pages because the reader has a specific problem and wants to understand it fully.

Tone: Honest, technically competent but accessible. Written for someone who is not a tech but is smart and wants to understand what's happening to their device. Never condescending. Never vague.

Critical rule: Guide pages do not replicate service page content. Service pages say what you offer and how to book. Guide pages explain what the repair is. They are complementary, not competitive.

### Repair Guides Spoke Inventory

#### iPhone Guides
- `/guides/iphone-screen-repair`
- `/guides/iphone-battery-replacement`
- `/guides/iphone-charging-port-repair`
- `/guides/iphone-water-damage`
- `/guides/iphone-camera-repair`

#### Android Guides
- `/guides/android-screen-repair`
- `/guides/android-battery-replacement`

#### Laptop/Mac Guides
- `/guides/laptop-battery-replacement`
- `/guides/laptop-screen-repair`
- `/guides/ssd-upgrade-guide`
- `/guides/macbook-wont-turn-on`
- `/guides/laptop-overheating-repair`

#### Console Guides
- `/guides/ps5-hdmi-repair`
- `/guides/nintendo-switch-joy-con-drift`
- `/guides/xbox-repair-guide`

#### Data Recovery
- `/guides/data-recovery-what-to-expect`
- `/guides/recovering-photos-from-broken-phone`

#### Tablets
- `/guides/ipad-screen-repair`

### Repair Guide Spoke Schema Template

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "[Guide headline]",
  "description": "[Direct answer from first paragraph]",
  "provider": { "@id": "https://www.haileyrepair.com/#business" },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.haileyrepair.com/guides/[slug]"
  },
  "step": [
    { "@type": "HowToStep", "name": "Diagnosis", "text": "[What happens first]" },
    { "@type": "HowToStep", "name": "Quote", "text": "[How pricing works]" },
    { "@type": "HowToStep", "name": "Repair", "text": "[What the repair involves]" }
  ]
}
```

---

## Internal Linking Rules

- Tips spokes → service pages at the natural transition moment.
- Guide spokes → service pages more directly.
- Service pages → guide spokes only optionally as supporting resources.
- Hub pages → spoke pages. This is their entire job.
- No spoke-to-spoke linking between tips and guides. Keep systems clean.

---

## Build Order

### Phase 1 — Foundation / Week 1
- Build `/tips` hub page.
- Migrate the 5 existing tips articles to spoke URLs:
  - `/tips/water-damaged-phone`
  - `/tips/lcd-vs-oled`
  - `/tips/laptop-battery-dying`
  - `/tips/repair-or-replace`
  - `/tips/speed-up-slow-laptop`
- Add proper schema to each migrated page.
- Update `/tips` hub page links to point to new spoke URLs.
- Set up 301 redirects from old anchor links if technically possible; note that URL fragments (`#water-damage`) are not sent to the server, so true server-side 301s from old anchors are not possible.

### Phase 2 — Tips Expansion / Weeks 2–3
- Build new tips spokes from the inventory.
- Prioritize: battery health guides, backup before repair, phone charges slowly.
- 3–5 pages per week maximum.

### Phase 3 — Guides Foundation / Week 3
- Build `/guides` hub page.
- Build the 5 highest-traffic guide spokes first:
  - `/guides/iphone-screen-repair`
  - `/guides/laptop-battery-replacement`
  - `/guides/iphone-battery-replacement`
  - `/guides/data-recovery-what-to-expect`
  - `/guides/ssd-upgrade-guide`

### Phase 4 — Guides Expansion / Weeks 4–6
- Build remaining guide spokes from inventory.
- 3–5 pages per week.

---

## Quality Checklist

Run on every page before publishing:

- [ ] Direct answer in first 2–3 sentences
- [ ] Page has one clear job and does not drift into another intent
- [ ] No keyword overlap with existing service pages
- [ ] CTA at the end links to the correct downstream page
- [ ] Schema block present and references `#business` entity
- [ ] `datePublished` set accurately
- [ ] No Material Symbols icon text in DOM
- [ ] Meta description is a direct answer to the page's primary query, under 155 characters
- [ ] Word count is 400–900 words — not padded, not too thin
- [ ] Voice is consistent: first person, direct, from a working repair tech

---

## What This Builds Over Time

When complete, haileyrepair.com will have three distinct content tiers:

1. **Tips** — top of funnel; ~20 spoke pages covering preventive, emergency, and decision content.
2. **Guides** — mid funnel; ~20 spoke pages covering specific repair types.
3. **Service pages** — bottom of funnel; existing pages remain conversion-focused.

Each tier addresses a different query intent. Each tier links to the next at the natural transition moment. The result is a site that can be cited by AI systems for dozens of distinct queries, each of which represents a real person with a device problem in Idaho.

---

## Progress Log

### 2026-05-20
- Saved architecture as repo document.
- Started Phase 1 foundation.
### 2026-05-20 — Repair Guides Foundation started
- Built `/guides` hub page.
- Built first four repair guide spokes:
  - `/guides/iphone-screen-repair`
  - `/guides/iphone-battery-replacement`
  - `/guides/laptop-battery-replacement`
  - `/guides/data-recovery-what-to-expect`
- Wired `_redirects`, `sitemap.xml`, and `llms.txt`.
