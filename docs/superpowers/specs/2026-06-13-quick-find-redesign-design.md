# Quick Find Redesign — Design Doc

**Date:** 2026-06-13
**Status:** Approved (pending implementation plan)

## Problem

The current Quick Find is a Cmd+K-style overlay rendered from `QF_DATA` in `main.js`
(featured tile row + two-column category card grid, "HDR Bench" skin with aurora
gradient and custom cursor). Two problems with it:

1. **Not scannable.** The two-column card grid of ~35 pages across 6 categories makes
   the eye zigzag. Users scroll through the whole list multiple times before finding
   the right section. The two huge categories (Device Repair = 12 pages, Main = 9)
   make this worse.
2. **Looks generic.** The aesthetic reads like a default command palette, not like HDR.
   The aurora/custom-cursor effects add busyness without identity.

Additional reframe: a command palette is a power-user pattern, but the audience is
stressed customers with broken devices. The redesign reorients the menu around
"what's wrong?" while keeping fast browse-by-page for everyone else.

## Decisions (locked during brainstorming)

- **Direction:** Hybrid — symptom cards (customer intent) on top + browse-all-pages below.
- **Browse layout:** Category Rail ("Toolbox Drawers") — left column of categories, right
  column of pages in the active category. Chosen over a sticky-section single column and
  filter chips because it's the only layout where the eye lands on the right group with no
  scrolling-past.
- **Symptom card targets:** each symptom links to the single best-matching existing page.
- **Visual identity:** Refined Dark Bench (warm-dark + rust accent + Fraunces serif),
  flipping to the Workshop Notebook palette under `data-theme="light"`.

## Architecture

Evolve the existing implementation; do not rewrite.

- **Single source of content:** keep the `QF_DATA` object in `main.js` as the only place
  pages are edited. Add a `symptoms` array. Category counts are derived at render time
  (`links.length`), not hardcoded.
- **JS render + filter** (`main.js`): rewrite the render functions to produce the two-zone
  browse layout (symptom row + rail) and the search-results list. Rewrite the filter to
  drive the two states below.
- **Styles:** replace the `.qf-*` block in `style.css` and the inline critical CSS copy in
  `index.html`. Retire `.qf-hdr` aurora/cursor styles.
- **Build:** regenerate minified assets (`style.min.css`, `main.min.js`) via `build.sh`.
- **No per-page HTML changes:** the overlay is JS-injected, so the 20+ pages that include
  `main.js` get the redesign automatically.

## Components / zones

The overlay panel contains, top to bottom:

1. **Search bar** — unified search input (kept from current; same `#qfSearch`).
2. **Symptom row** — section labelled "what's wrong?"; 4 cards. Each card = emoji + name +
   subtitle, links to a page. Hidden in search state.
3. **Category Rail** — two-pane:
   - **Drawers (left):** 6 category buttons, each with icon, title, and a derived count
     badge. One is active at a time.
   - **Panel (right):** the active category's pages as a single scannable column
     (icon + name + description rows). Reuses `.qf-link` semantics so existing keyboard
     and highlight logic can be adapted.
   - Hidden in search state.
4. **Results list** — flat, ranked, highlighted list shown only in search state (replaces
   symptom row + rail).
5. **Empty state** — shown when search has no matches: offers "Text us", "Run Device Check",
   "See all services" instead of a dead end.
6. **Footer** — keyboard hints (kept).

## States

- **Browse state** (search input empty): symptom row + rail visible. Default active drawer =
  **Device Repair**.
- **Search state** (search input non-empty): symptom row + rail hidden; results list shown.
  Matching is case-insensitive substring matching over each page's name + description +
  existing `kw` keyword string (the current filter approach, kept — no fuzzy/typo library).
  Symptom keywords are folded into the matchable text so "cracked", "wet", "dead" etc.
  surface the right page. The matched substring in the visible name is highlighted.
  No matches → empty state.

## Symptom set

Four cards (one clean row; 4th is the catch-all safety net):

| Card           | Emoji | Target page                  |
|----------------|-------|------------------------------|
| Cracked screen | 📱    | `/iphone-repair`             |
| Won't turn on  | 🔌    | `/laptop-wont-turn-on`       |
| Water damage   | 💧    | `/phone-water-damage-hailey` |
| Not sure?      | ❓    | `/device-check`              |

## Mobile (≤640px, existing bottom-sheet breakpoint)

- Overlay remains a bottom sheet (existing drag/ESC behavior kept).
- Symptom cards reflow to 2×2.
- Rail's left drawer column becomes a **horizontal scrolling chip row** of the 6 categories
  at the top of the browse area; tapping a chip swaps the page list below.

## Visual identity

- **Dark (default):** warm-dark surfaces, rust accent `#d98a3d`, Fraunces serif for category
  labels / section headings / the "what's wrong?" label, Inter for body text. Active drawer:
  rust left-border + subtle tint.
- **Light (`data-theme="light"`):** flip the whole panel to the Workshop Notebook palette,
  reusing the exact tokens from the tips pages: paper `#f4eee2`, card `#fbf7ef` / `#efe7d7`,
  ink `#2b2520` / soft `#6e6456` / faint `#9b9080`, rules `#e2d9c8` / `#d3c7af`,
  accent `#a8480c` / bright `#c2611a`.
- Retire the aurora background and custom cursor.

## Keyboard & accessibility

- `↑` / `↓`: move highlight through the visible list (panel items in browse state, results in
  search state).
- `←` / `→` (and Tab): switch active drawer in browse state.
- `Enter`: navigate to highlighted item. `Esc`: close overlay.
- Drawers are real `<button>`s with `aria-selected`; the results region is a `listbox` with
  `option` rows. Focus is trapped in the open overlay and restored to the trigger on close.
- Honor `prefers-reduced-motion` (no transitions/animations when set).

## Out of scope (YAGNI)

- No nested/recursive palettes (Raycast-style).
- No recents / history persistence.
- No server-side or async search — all content is local and static.
- No changes to the symptom→page targets beyond the four listed (easy to edit later in
  `QF_DATA`).
