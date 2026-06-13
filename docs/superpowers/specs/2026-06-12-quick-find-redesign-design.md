# Quick Find Redesign — "The HDR Bench"

**Date:** 2026-06-12
**Status:** Approved (direction); pending spec review
**Scope:** Redesign the site-wide Quick Find command palette (trigger + overlay) to be a distinctive, premium, animated experience. Navigation-only (no new action verbs).

---

## 1. Concept

**"The HDR Bench" — a precision instrument that glows.**

Merges two brand stories:

- **The Repair Bench (craft & structure):** monospace micro-labels (`// most wanted`, `// all pages`), a blinking caret in the search field, route hints (`/iphone-repair`), tool-slot tiles, and **gold** (the site's review-star color, `#f5c842`) marking the active row like a part seated in its slot.
- **HDR / High Dynamic Range (light & color):** an aurora glow halo behind the panel, a gradient border ring, a spectrum hairline under the search bar, and tiles/rows that **bloom** with luminous glow on hover/focus while matched text lights up and the rest dims.

The result is special but **premium, not neon** — restrained, instrument-panel energy.

### Palette (use the site's *real* tokens)

The live site accent is overridden site-wide (not the `#4f8ef7` in `style.css`):

| Token | Value | Use |
|---|---|---|
| `--accent` | `#5B8BCF` (steel-blue) | primary glow, borders, focus |
| `--color-cyan` | `#8BB8D6` | gradient mid-tone |
| gold | `#f5c842` | active-row bar, matched-text highlight, "seated" accent |
| `--bg-surface` | `#161b22` | panel surface |
| `--bg-primary` | `#0d1117` | backdrop base |

Gradient ring / hairline: `steel-blue → cyan → gold`.

The design must read correctly in both dark (default) and light themes (`[data-theme="light"]`).

---

## 2. Structure (hybrid layout, navigation-only)

### Trigger (nav, every page)
- Refined pill: subtle gradient border, soft glow on hover/focus, search glyph + label + `⌘K` hint badge.
- **Markup unchanged** (it lives in nav on all pages); restyled via injected CSS. Mobile/compact variants preserved (icon-only under 1099px, hidden under 768px with a full-width variant in the mobile menu — matching current behavior).

### Panel (on open)
1. **Header** — search glyph (glowing), input with a blinking caret, spectrum gradient hairline beneath, `ESC` button.
2. **Featured row** — label `// most wanted`; a grid of large tiles for the highest-intent destinations. Default set (configurable in the data structure):
   - iPhone Repair, Laptop & PC Repair, Android Repair, Data Recovery, Pricing, Book a Repair (Contact).
3. **Full list** — label `// all pages`; the existing categorized link list (Device Repair, Computer Help, Locations, Guides, etc.), beautified with hover/active states and route hints.

### Behavior while typing
- Featured row hides; results become a single flat list of matches.
- Matched substring is highlighted (gold); non-matching items hidden.
- Empty-state message when nothing matches.

---

## 3. Motion

All motion is gated behind `@media (prefers-reduced-motion: reduce)` (instant, no transitions).

| Trigger | Animation |
|---|---|
| Panel open | backdrop blur fades in; panel spring-scales in; aurora halo fades up |
| Items appear | featured tiles + list rows **cascade** in with a short stagger (~15–25ms) |
| Hover / keyboard focus | tile/row **bloom**: accent glow + slight lift |
| Arrow up/down | active indicator (gold left-bar + soft glow) **slides** between rows |
| Typing | non-matches fade/collapse; matched text highlights |
| Close | reverse fade + scale-down |

Keyboard: preserve and extend current support — `⌘/Ctrl+K` toggle, `Esc` close, `↑/↓` navigate (across featured + list), `Enter` to follow active link. Mobile: bottom-sheet presentation (current behavior) preserved.

---

## 4. Architecture

**Goal:** single source of truth; do not edit 38 near-identical HTML files.

### Current reality
- The `.qf-overlay` markup is **byte-identical across all 38 pages** and hardcoded (not JS-injected today).
- A duplicated inline `<style id="hdr-canonical-nav-css">` block in each page's `<head>` carries `.qf-*` base rules. It appears *after* `style.min.css` in document order, so it currently wins the cascade for matching selectors. `critical.css` contains no qf rules.
- `main.js` only *queries* the existing DOM (`#qfOverlay`, `.qf-link`, …) and wires behavior.

### Approach: self-contained Quick Find module in `main.js`
1. **Data:** a `QF_DATA` structure — `featured: [...]` and `categories: [{ title, icon, links: [{ name, desc, href, icon, keywords }] }]`. This is the only place content is edited.
2. **Render:** a `renderQuickFind()` builds the panel markup from `QF_DATA` and sets `#qfOverlay.innerHTML` on load. The existing hardcoded markup acts as a no-JS fallback that JS replaces. `#qfOverlay` already exists on every page → **zero per-page HTML edits**.
3. **CSS:** all redesign styles live in **`style.css`** (the maintained, minified, themeable stylesheet) — *not* in a JS string. To win the cascade over the inline `hdr-canonical-nav-css` block (which loads after `style.min.css` in document order), the injected panel root carries a **marker class** (`qf-hdr`) and all new rules are scoped under it, e.g. `.qf-overlay.qf-hdr .qf-panel { … }`. Two classes out-specify the inline block's single-class rules, so `style.css` wins regardless of source order. The marker class is the documented mechanism that makes this work. Trigger rules that currently use `!important` are matched with `!important` where needed.
4. **Behavior:** refactor the existing IIFE to (a) render first, then (b) bind the same open/close/filter/keyboard handlers against the freshly rendered nodes, extended for the featured row, cascade, sliding indicator, and match highlighting.
5. **Build:** edit `main.js` (markup/data/behavior) and `style.css` (styles). Run `./build.sh` to regenerate both `main.min.js` and `style.min.css`. The deployed site uses the `.min` files.

### Why hybrid (CSS in style.css + JS-rendered markup)
This keeps styling where styling belongs — in `style.css`, where it is minified by the build pipeline, themeable, and easy to tweak — while centralizing the duplicated markup into a single JS source. It is more maintainable than CSS-in-JS (no styling buried in a JS string) and avoids editing or rebuilding 38 HTML files. The one piece of "magic" — the `qf-hdr` marker class doing cascade work — is documented here and in a comment in `style.css`. Centralizing the markup also **removes 38 duplicate copies** of the Quick Find markup, a down payment on de-duplicating the site. Tradeoff: the feature spans two files (`main.js` + `style.css`) rather than one, which is normal separation of concerns. The panel is JS-rendered, so it won't appear with JS disabled — but Quick Find already requires JS to open/search/navigate, and the nav links work without it, so there is no functional regression.

### Units / boundaries
- `QF_DATA` — content only (featured + categories); no logic. The single place content is edited.
- `renderQuickFind(data)` → builds and sets `#qfOverlay` markup (with the `qf-hdr` marker class on the root); no event wiring.
- `initQuickFind()` → renders, then binds behavior. Replaces the current IIFE.
- Styles: a clearly-delimited `Quick Find — HDR Bench` section in `style.css`, all scoped under `.qf-hdr`.

Each unit is independently understandable and testable; content edits never touch logic, and style edits never touch markup.

---

## 5. Out of scope (YAGNI)

- No new action commands (call, book, directions) — navigation-only per decision.
- No fuzzy-matching engine — keep the current substring match (highlighting added). Can revisit later.
- No changes to the nav structure beyond the trigger's styling.
- No rewrite of the per-page HTML or the build pipeline.

---

## 6. Success criteria

- Opening Quick Find feels distinctive and premium, with smooth open/cascade/bloom motion.
- Featured row shows on open; typing filters to a highlighted result list (matched text highlighted in gold, non-matches hidden).
- Works on all 38 pages with no per-page edits; identical behavior everywhere.
- Full keyboard support preserved (`⌘K`, `Esc`, arrows, `Enter`); mobile bottom-sheet preserved.
- Respects `prefers-reduced-motion` and both color themes.
- Accessible: `role="dialog"`, focus management, `aria` labels, focus-visible states retained.
