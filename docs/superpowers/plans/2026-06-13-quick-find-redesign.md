# Quick Find Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Quick Find overlay's two-column card grid with a hybrid "symptom cards + category-rail browse" layout in a distinctive Dark Bench / Workshop Notebook skin, fixing scannability and the generic look.

**Architecture:** The overlay is rendered entirely by a JS IIFE in `main.js` from a single `QF_DATA` object, and skinned by a `.qf-hdr`-scoped block in `style.css` that loads after (and overrides) the per-page inline critical CSS. So the whole redesign lives in `main.js` (render + behavior) and `style.css` (skin) — no per-page HTML edits. Minified consumers (`index.html` loads `style.min.css`) require a `build.sh` run.

**Tech Stack:** Vanilla ES5-style JS (no framework, no transpile), hand-written CSS, Python-based `build.sh` minifier, Material Symbols + Inter/MuseoModerno webfonts (Fraunces added via `@import`).

---

## Background the engineer needs

- **Single source of content:** `QF_DATA` in `main.js` (currently starts at line 2468) is the only place pages are listed. It has `featured`, `categories[].links[]`. Each link is `{ name, desc, href, icon, kw }` where `kw` is a space-separated keyword string and `icon` is a Material Symbols name.
- **Render pattern:** `render()` writes `overlay.innerHTML`. The overlay element is `#qfOverlay` (exists in every page's HTML, JS-injected content). `render()` adds the class `qf-hdr` to the overlay so the `style.css` skin wins over inline CSS.
- **Reused helpers (keep):** `esc(s)` HTML-escapes; `icon(name)` returns `<span ... class="material-symbols-outlined" data-icon="NAME"></span>`.
- **Triggers (keep wiring):** `#qfTrigger` (desktop), `#qfTriggerMobile` (mobile sheet). Open via click or Cmd/Ctrl+K.
- **CSS delivery:** every page has the base `.qf-*` rules inlined in a `<style>` block, but the live panel internals are styled by the `.qf-hdr` scope in `style.css` (2 classes beats 1). New class names used by this redesign only need to be defined once in `style.css`.
- **Fonts:** only Inter, MuseoModerno, Darker Grotesque, Material Symbols are loaded site-wide. Fraunces is NOT — this plan adds it via a single `@import` at the top of `style.css`.
- **Minification:** `./build.sh` regenerates `style.min.css` and `main.min.js` from the source files. `index.html` consumes `style.min.css`, so the build is required after CSS edits.
- **No test framework exists.** Verification is: `node --check` for JS syntax, a Python brace-balance check for CSS, `./build.sh` running clean, and manual/Playwright behavioral checks against a local `python3 -m http.server`.

## File structure (what changes)

- **Modify** `main.js` — replace the QF IIFE body (data + render + behavior), lines 2468–2774. One responsibility: build and drive the overlay.
- **Modify** `style.css` — (a) add Fraunces `@import` at the very top; (b) replace the `.qf-hdr` skin block, lines 10310–10530.
- **Generated** `style.min.css`, `main.min.js` — via `./build.sh`. Not hand-edited.

No other files change.

---

## Task 1: Add symptom data + flatten/keyword helpers to QF_DATA

**Files:**
- Modify: `main.js:2468-2526` (the `QF_DATA` object) and just after it.

- [ ] **Step 1: Add the `symptoms` array to `QF_DATA`**

In `main.js`, find the line `  var QF_DATA = {` (≈2468) and the line immediately after it `    featured: [`. Insert the `symptoms` array as the first property, immediately after `var QF_DATA = {`:

```js
  var QF_DATA = {
    symptoms: [
      { name: 'Cracked screen', sub: 'Phone or tablet', emoji: '📱', href: '/iphone-repair',
        kw: 'cracked screen broken glass shattered display crack phone tablet ipad' },
      { name: "Won't turn on", sub: 'No power at all', emoji: '🔌', href: '/laptop-wont-turn-on',
        kw: "won't turn on dead no power black screen boot loop wont start unresponsive" },
      { name: 'Water damage', sub: 'Spill or got wet', emoji: '💧', href: '/phone-water-damage-hailey',
        kw: 'water damage wet liquid spill submerged moisture dropped in toilet rain' },
      { name: 'Not sure?', sub: 'Run Device Check', emoji: '❓', href: '/device-check',
        kw: 'not sure unknown diagnose help estimate device check what is wrong something else' }
    ],
    featured: [
```

Leave the existing `featured` and `categories` content exactly as-is. (`featured` is no longer rendered but is left in place to avoid churn; it can be removed later.)

- [ ] **Step 2: Replace `countLinks()` with flattened item + symptom-keyword index**

Find this block (≈2559–2563):

```js
  function countLinks() {
    var n = 0;
    QF_DATA.categories.forEach(function(c) { n += c.links.length; });
    return n;
  }
```

Replace it entirely with:

```js
  // Flattened page list (used for search) + symptom-keyword fold-in.
  // Symptom words like "cracked"/"wet" aren't in the page kw strings, so we
  // attach each symptom's kw to its target page's search haystack by href.
  var SYM_KW_BY_HREF = {};
  QF_DATA.symptoms.forEach(function(s) {
    SYM_KW_BY_HREF[s.href] = (SYM_KW_BY_HREF[s.href] || '') + ' ' + s.kw + ' ' + s.name;
  });
  var ALL_ITEMS = [];
  QF_DATA.categories.forEach(function(c) {
    c.links.forEach(function(l) {
      ALL_ITEMS.push({
        name: l.name, desc: l.desc, href: l.href, icon: l.icon,
        hay: (l.name + ' ' + l.desc + ' ' + l.kw + ' ' + (SYM_KW_BY_HREF[l.href] || '')).toLowerCase()
      });
    });
  });
```

- [ ] **Step 3: Verify JS still parses**

Run: `node --check main.js`
Expected: no output, exit 0. (If it errors, a brace/quote is misplaced in the inserted blocks.)

- [ ] **Step 4: Commit**

```bash
git add main.js
git commit -m "feat(quickfind): add symptom data + flattened search index"
```

---

## Task 2: Rewrite render() for the hybrid rail layout

**Files:**
- Modify: `main.js` — the render helpers (`linkHTML`, `categoryHTML`, `tileHTML`) ≈2539–2557 and `render()` ≈2565–2598.

- [ ] **Step 1: Replace the three render helpers**

Find the block from `  function linkHTML(l) {` through the end of `  function tileHTML(t) { ... }` (≈2539–2557). Replace all three functions with:

```js
  // A page renders as a horizontal row: icon + (name / desc).
  function linkHTML(l) {
    return '<a class="qf-link" data-qf="' + esc(l.kw) + '" data-name="' + esc(l.name) + '" href="' + esc(l.href) + '">' +
      '<span class="qf-link-icon">' + icon(l.icon) + '</span>' +
      '<span class="qf-link-text">' +
        '<span class="qf-link-name">' + esc(l.name) + '</span>' +
        '<span class="qf-link-desc">' + esc(l.desc) + '</span>' +
      '</span></a>';
  }

  function symptomHTML(s) {
    return '<a class="qf-sym" href="' + esc(s.href) + '">' +
      '<span class="qf-sym-emoji" aria-hidden="true">' + s.emoji + '</span>' +
      '<span class="qf-sym-name">' + esc(s.name) + '</span>' +
      '<span class="qf-sym-sub">' + esc(s.sub) + '</span></a>';
  }

  function drawerBtnHTML(c, i) {
    var on = i === 0;
    return '<button type="button" class="qf-drawer' + (on ? ' qf-on' : '') + '" role="tab"' +
      ' aria-selected="' + (on ? 'true' : 'false') + '" data-drawer="' + i + '">' +
      '<span class="qf-drawer-ic">' + icon(c.icon) + '</span>' +
      '<span class="qf-drawer-title">' + esc(c.title) + '</span>' +
      '<span class="qf-drawer-count">' + c.links.length + '</span></button>';
  }

  function drawerPanelHTML(c, i) {
    var on = i === 0;
    return '<div class="qf-drawerpanel' + (on ? ' qf-on' : '') + '" role="tabpanel"' +
      ' data-drawer="' + i + '"' + (on ? '' : ' hidden') + '>' +
      c.links.map(linkHTML).join('') + '</div>';
  }
```

- [ ] **Step 2: Replace `render()`**

Find `  function render() {` through its closing `  }` and the `render();` call after it is unaffected. Replace the whole `render()` function (≈2565–2598) with:

```js
  function render() {
    overlay.classList.add('qf-hdr');
    var syms = QF_DATA.symptoms.map(symptomHTML).join('');
    var drawerBtns = QF_DATA.categories.map(drawerBtnHTML).join('');
    var drawerPanels = QF_DATA.categories.map(drawerPanelHTML).join('');
    overlay.innerHTML =
      '<div class="qf-backdrop" id="qfBackdrop"></div>' +
      '<div class="qf-panel" role="document">' +
        '<div class="qf-header">' +
          icon('search') +
          '<input autocomplete="off" class="qf-search" id="qfSearch" placeholder="Search or describe a problem…" type="text" aria-label="Search pages"/>' +
          '<button aria-label="Close Quick Find" class="qf-close" id="qfClose">ESC</button>' +
        '</div>' +
        '<div class="qf-body" id="qfBody">' +
          '<div class="qf-browse" id="qfBrowse">' +
            '<div class="qf-section-label">what&rsquo;s wrong?</div>' +
            '<div class="qf-symptoms" id="qfSymptoms">' + syms + '</div>' +
            '<div class="qf-section-label qf-browse-label">browse all pages</div>' +
            '<div class="qf-rail" id="qfRail">' +
              '<div class="qf-railnav" id="qfRailNav" role="tablist" aria-label="Page categories">' + drawerBtns + '</div>' +
              '<div class="qf-railpanels" id="qfRailPanels">' + drawerPanels + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="qf-results" id="qfResults" role="listbox" aria-label="Search results" hidden></div>' +
          '<div class="qf-empty" id="qfEmpty">' + icon('search_off') +
            '<span class="qf-empty-title">No pages match that.</span>' +
            '<span class="qf-empty-actions">' +
              '<a href="/contact">Text us</a>' +
              '<a href="/device-check">Run Device Check</a>' +
              '<a href="/#services">See all services</a>' +
            '</span>' +
          '</div>' +
        '</div>' +
        '<div class="qf-footer">' +
          '<span>' + ALL_ITEMS.length + ' pages</span>' +
          '<div class="qf-footer-keys">' +
            '<span><kbd>↑↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span><span><kbd>esc</kbd> Close</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }
```

- [ ] **Step 3: Verify JS parses**

Run: `node --check main.js`
Expected: no output, exit 0.

- [ ] **Step 4: Commit**

```bash
git add main.js
git commit -m "feat(quickfind): render symptom row + category rail layout"
```

---

## Task 3: Rewrite the behavior (state, drawers, search, keyboard)

**Files:**
- Modify: `main.js` — everything from the `// ---- Behavior` comment / `var searchInput = ...` (≈2603) through the closing `})();` (≈2774).

- [ ] **Step 1: Replace the entire behavior section**

Find the line `  // ---- Behavior -------------------------------------------------` (≈2602) and select everything from there down to and including the final `})();`. Replace it all with:

```js
  // ---- Behavior -------------------------------------------------
  var searchInput = document.getElementById('qfSearch');
  var closeBtn    = document.getElementById('qfClose');
  var backdrop    = document.getElementById('qfBackdrop');
  var emptyState  = document.getElementById('qfEmpty');
  var browseZone  = document.getElementById('qfBrowse');
  var resultsZone = document.getElementById('qfResults');
  var railNav     = document.getElementById('qfRailNav');
  var drawerEls   = Array.prototype.slice.call(overlay.querySelectorAll('.qf-drawer'));
  var panelEls    = Array.prototype.slice.call(overlay.querySelectorAll('.qf-drawerpanel'));

  var currentDrawer = 0;
  var searching     = false;
  var activeIndex   = -1;
  var activeItems   = [];
  var lastTrigger   = null;

  function activeListNodes() {
    if (searching) return Array.prototype.slice.call(resultsZone.querySelectorAll('.qf-link'));
    var p = panelEls[currentDrawer];
    return p ? Array.prototype.slice.call(p.querySelectorAll('.qf-link')) : [];
  }

  function clearActive() {
    activeItems.forEach(function(el) { el.classList.remove('qf-active'); });
  }

  function setActive(index) {
    clearActive();
    if (index < 0 || index >= activeItems.length) return;
    var el = activeItems[index];
    el.classList.add('qf-active');
    el.scrollIntoView({ block: 'nearest' });
  }

  function refreshActive() {
    activeItems = activeListNodes();
    activeIndex = -1;
    clearActive();
  }

  function setDrawer(i) {
    if (i < 0 || i >= drawerEls.length) return;
    currentDrawer = i;
    drawerEls.forEach(function(b, bi) {
      var on = bi === i;
      b.classList.toggle('qf-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panelEls.forEach(function(p, pi) {
      var on = pi === i;
      p.classList.toggle('qf-on', on);
      if (on) { p.removeAttribute('hidden'); } else { p.setAttribute('hidden', ''); }
    });
    refreshActive();
  }

  function showBrowse() {
    searching = false;
    resultsZone.setAttribute('hidden', '');
    resultsZone.innerHTML = '';
    browseZone.removeAttribute('hidden');
    emptyState.classList.remove('visible');
    refreshActive();
  }

  function highlightName(name, q) {
    var i = name.toLowerCase().indexOf(q);
    if (i === -1) return esc(name);
    return esc(name.slice(0, i)) +
      '<mark class="qf-hl">' + esc(name.slice(i, i + q.length)) + '</mark>' +
      esc(name.slice(i + q.length));
  }

  function resultHTML(it, q) {
    return '<a class="qf-link" role="option" data-name="' + esc(it.name) + '" href="' + esc(it.href) + '">' +
      '<span class="qf-link-icon">' + icon(it.icon) + '</span>' +
      '<span class="qf-link-text">' +
        '<span class="qf-link-name">' + highlightName(it.name, q) + '</span>' +
        '<span class="qf-link-desc">' + esc(it.desc) + '</span>' +
      '</span></a>';
  }

  function runSearch(q) {
    searching = true;
    browseZone.setAttribute('hidden', '');
    var matches = ALL_ITEMS.filter(function(it) { return it.hay.indexOf(q) !== -1; });
    if (!matches.length) {
      resultsZone.setAttribute('hidden', '');
      resultsZone.innerHTML = '';
      emptyState.classList.add('visible');
      refreshActive();
      return;
    }
    emptyState.classList.remove('visible');
    resultsZone.innerHTML = matches.map(function(it) { return resultHTML(it, q); }).join('');
    resultsZone.removeAttribute('hidden');
    refreshActive();
  }

  function onInput(val) {
    var q = (val || '').toLowerCase().trim();
    if (!q) { showBrowse(); return; }
    runSearch(q);
  }

  function open(opener) {
    lastTrigger = opener || null;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (searchInput) { searchInput.value = ''; }
    showBrowse();
    setDrawer(0);
    if (searchInput) searchInput.focus();
  }

  function close() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeIndex = -1;
    clearActive();
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
  }

  // Triggers
  var trigger = document.getElementById('qfTrigger');
  var triggerMobile = document.getElementById('qfTriggerMobile');
  if (trigger) trigger.addEventListener('click', function() { open(trigger); });
  if (triggerMobile) triggerMobile.addEventListener('click', function() {
    var mobileNav = document.getElementById('navMobile');
    if (mobileNav) mobileNav.setAttribute('aria-hidden', 'true');
    open(triggerMobile);
  });

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);
  if (searchInput) searchInput.addEventListener('input', function() { onInput(this.value); });

  if (railNav) railNav.addEventListener('click', function(e) {
    var btn = e.target.closest('.qf-drawer');
    if (!btn) return;
    setDrawer(parseInt(btn.getAttribute('data-drawer'), 10) || 0);
    if (searchInput) searchInput.focus();
  });

  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (overlay.classList.contains('open')) { close(); } else { open(trigger); }
      return;
    }
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeItems = activeListNodes();
      activeIndex = Math.min(activeIndex + 1, activeItems.length - 1);
      setActive(activeIndex);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeItems = activeListNodes();
      activeIndex = Math.max(activeIndex - 1, 0);
      setActive(activeIndex);
      return;
    }
    if (!searching && e.key === 'ArrowRight') {
      e.preventDefault();
      setDrawer(Math.min(currentDrawer + 1, drawerEls.length - 1));
      return;
    }
    if (!searching && e.key === 'ArrowLeft') {
      e.preventDefault();
      setDrawer(Math.max(currentDrawer - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < activeItems.length) {
        e.preventDefault();
        activeItems[activeIndex].click();
      }
      return;
    }
  });

  // Close after navigating to a page (symptom card or list row).
  overlay.addEventListener('click', function(e) {
    if (e.target.closest('.qf-link') || e.target.closest('.qf-sym')) close();
  });
})();
```

- [ ] **Step 2: Verify JS parses**

Run: `node --check main.js`
Expected: no output, exit 0.

- [ ] **Step 3: Sanity-check no stale identifiers remain**

Run: `grep -nE "qf-cursor|qf-tile|qf-featured|qf-cardgrid|qf-columns|countLinks|allLabel" main.js`
Expected: no matches (all old machinery removed).

- [ ] **Step 4: Commit**

```bash
git add main.js
git commit -m "feat(quickfind): browse/search states, drawer switching, keyboard nav"
```

---

## Task 4: Replace the `.qf-hdr` skin (Dark Bench) in style.css

**Files:**
- Modify: `style.css:10310-10530` (the entire `QUICK FIND — "The HDR Bench" skin` block, from the comment header through the closing of the reduced-motion `@media`).

- [ ] **Step 1: Add the Fraunces @import at the very top of style.css**

Make the first line of `style.css` (before any existing content) this `@import` (CSS requires `@import` before all other rules):

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap');
```

- [ ] **Step 2: Replace the skin block**

Select from line `/* ═══════════════════════════════════════════════════` that begins the `QUICK FIND — "The HDR Bench" skin` comment (≈10310) through the closing `}` of the `@media (prefers-reduced-motion: reduce)` block at ≈10530 (the line just before `/* Responsive */` at ≈10532). Replace the whole selection with:

```css
/* ═══════════════════════════════════════════════════
   QUICK FIND — "Dark Bench" skin (hybrid rail layout)
   Scoped under .qf-hdr so it beats the inline base CSS.
   Dark default; flips to Workshop Notebook under light theme.
   ═══════════════════════════════════════════════════ */
.qf-overlay.qf-hdr {
  --qf-acc: #d98a3d;            /* rust */
  --qf-acc-bright: #e8a256;
  --qf-wash: rgba(217,138,61,.13);
  --qf-bg: #12161d;
  --qf-card: #1a2030;
  --qf-card2: #161b24;
  --qf-txt: #e9e2d6;
  --qf-soft: #9aa3b0;
  --qf-faint: #7c8493;
  --qf-line: rgba(255,255,255,.08);
  --qf-line2: rgba(255,255,255,.14);
  --qf-serif: 'Fraunces', Georgia, 'Times New Roman', serif;
}

/* Backdrop */
.qf-overlay.qf-hdr .qf-backdrop {
  background: rgba(6,9,13,.62);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Panel */
.qf-overlay.qf-hdr .qf-panel {
  background: var(--qf-bg);
  border: 1px solid var(--qf-line2);
  border-radius: 16px;
  box-shadow: 0 24px 70px rgba(0,0,0,.55);
  max-width: 760px;
  transform: scale(.97) translateY(-8px);
  transition: transform .24s cubic-bezier(.2,.9,.3,1);
}
.qf-overlay.qf-hdr.open .qf-panel { transform: scale(1) translateY(0); }

/* Header + search */
.qf-overlay.qf-hdr .qf-header {
  border-bottom: 1px solid var(--qf-line);
  padding: .95rem 1.15rem;
}
.qf-overlay.qf-hdr .qf-header > .material-symbols-outlined { color: var(--qf-acc); }
.qf-overlay.qf-hdr .qf-search { color: var(--qf-txt); caret-color: var(--qf-acc); }
.qf-overlay.qf-hdr .qf-search::placeholder { color: var(--qf-faint); }
.qf-overlay.qf-hdr .qf-close {
  background: var(--qf-card2); border: 1px solid var(--qf-line2); color: var(--qf-faint);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; border-radius: 7px;
}
.qf-overlay.qf-hdr .qf-close:hover { background: var(--qf-wash); color: var(--qf-acc); border-color: var(--qf-acc); }

/* Body */
.qf-overlay.qf-hdr .qf-body { padding: .9rem 1.15rem 1.1rem; }

/* Section labels — serif identity */
.qf-overlay.qf-hdr .qf-section-label {
  font-family: var(--qf-serif);
  font-size: .9rem; font-weight: 600; letter-spacing: .01em; text-transform: none;
  color: var(--qf-txt); margin: 0 0 .55rem;
}
.qf-overlay.qf-hdr .qf-browse-label { margin-top: 1.1rem; }

/* Symptom row */
.qf-overlay.qf-hdr .qf-symptoms {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: .55rem;
}
.qf-overlay.qf-hdr .qf-sym {
  display: flex; flex-direction: column; gap: .3rem;
  padding: .7rem .6rem; border-radius: 12px;
  background: var(--qf-card); border: 1px solid var(--qf-line);
  color: var(--qf-txt); text-decoration: none;
  transition: transform .16s, border-color .16s, background .16s, box-shadow .16s;
}
.qf-overlay.qf-hdr .qf-sym:hover,
.qf-overlay.qf-hdr .qf-sym:focus-visible {
  transform: translateY(-2px); border-color: var(--qf-acc); outline: none;
  box-shadow: 0 0 16px var(--qf-wash);
}
.qf-overlay.qf-hdr .qf-sym-emoji { font-size: 1.35rem; line-height: 1; }
.qf-overlay.qf-hdr .qf-sym-name { font-size: .82rem; font-weight: 600; }
.qf-overlay.qf-hdr .qf-sym-sub { font-size: .68rem; color: var(--qf-faint); }
/* 4th "Not sure?" card reads as the safety net */
.qf-overlay.qf-hdr .qf-sym:last-child { background: var(--qf-wash); border-color: var(--qf-acc); }

/* Rail: drawers (left) + panels (right) */
.qf-overlay.qf-hdr .qf-rail {
  display: grid; grid-template-columns: 210px 1fr;
  border: 1px solid var(--qf-line); border-radius: 12px; overflow: hidden;
}
.qf-overlay.qf-hdr .qf-railnav {
  border-right: 1px solid var(--qf-line); background: var(--qf-card2);
  padding: .5rem; display: flex; flex-direction: column; gap: .15rem;
}
.qf-overlay.qf-hdr .qf-drawer {
  display: flex; align-items: center; gap: .5rem;
  padding: .55rem .6rem; border-radius: 9px;
  background: none; border: none; cursor: pointer; text-align: left;
  color: var(--qf-soft); font: inherit; font-size: .81rem; font-weight: 600;
  transition: background .14s, color .14s;
}
.qf-overlay.qf-hdr .qf-drawer .qf-drawer-ic .material-symbols-outlined { font-size: 1.1rem; }
.qf-overlay.qf-hdr .qf-drawer-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qf-overlay.qf-hdr .qf-drawer-count {
  font-size: .66rem; color: var(--qf-faint);
  background: rgba(255,255,255,.06); border-radius: 20px; padding: .05rem .45rem;
}
.qf-overlay.qf-hdr .qf-drawer:hover { background: rgba(255,255,255,.04); color: var(--qf-txt); }
.qf-overlay.qf-hdr .qf-drawer.qf-on {
  background: var(--qf-card); color: var(--qf-txt); box-shadow: inset 3px 0 0 var(--qf-acc);
}
.qf-overlay.qf-hdr .qf-drawer.qf-on .qf-drawer-ic .material-symbols-outlined { color: var(--qf-acc); }
.qf-overlay.qf-hdr .qf-drawer.qf-on .qf-drawer-count { background: var(--qf-wash); color: var(--qf-acc); }

.qf-overlay.qf-hdr .qf-railpanels { padding: .4rem 0; min-height: 260px; }
.qf-overlay.qf-hdr .qf-drawerpanel[hidden] { display: none; }

/* Page row (used in both rail panels and search results) */
.qf-overlay.qf-hdr .qf-link {
  display: flex; align-items: center; gap: .65rem;
  padding: .5rem 1rem; border-radius: 9px; margin: 0 .35rem;
  text-decoration: none; color: var(--qf-txt);
  transition: background .14s, transform .1s;
}
.qf-overlay.qf-hdr .qf-link-icon {
  width: 32px; height: 32px; flex-shrink: 0; border-radius: 9px;
  background: var(--qf-card2); border: 1px solid var(--qf-line);
  display: flex; align-items: center; justify-content: center;
}
.qf-overlay.qf-hdr .qf-link-icon .material-symbols-outlined { font-size: 1.05rem; color: var(--qf-acc); }
.qf-overlay.qf-hdr .qf-link-text { display: flex; flex-direction: column; min-width: 0; }
.qf-overlay.qf-hdr .qf-link-name {
  font-size: .85rem; font-weight: 600; line-height: 1.25;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.qf-overlay.qf-hdr .qf-link-desc {
  font-size: .71rem; color: var(--qf-faint); line-height: 1.25;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.qf-overlay.qf-hdr .qf-link:hover,
.qf-overlay.qf-hdr .qf-link.qf-active {
  background: var(--qf-wash); transform: translateX(2px); outline: none;
}
.qf-overlay.qf-hdr .qf-link.qf-active { box-shadow: inset 2px 0 0 var(--qf-acc); }
.qf-overlay.qf-hdr .qf-hl { background: transparent; color: var(--qf-acc-bright); font-weight: 700; }

/* Search results list */
.qf-overlay.qf-hdr .qf-results[hidden] { display: none; }
.qf-overlay.qf-hdr .qf-results { display: flex; flex-direction: column; gap: .1rem; }
.qf-overlay.qf-hdr .qf-results .qf-link { margin: 0; }

/* Empty state */
.qf-overlay.qf-hdr .qf-empty {
  text-align: center; padding: 2rem 1rem; color: var(--qf-faint);
}
.qf-overlay.qf-hdr .qf-empty.visible { display: flex; flex-direction: column; align-items: center; gap: .5rem; }
.qf-overlay.qf-hdr .qf-empty .material-symbols-outlined { font-size: 2rem; opacity: .5; }
.qf-overlay.qf-hdr .qf-empty-title { font-family: var(--qf-serif); font-size: 1rem; color: var(--qf-txt); }
.qf-overlay.qf-hdr .qf-empty-actions { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; }
.qf-overlay.qf-hdr .qf-empty-actions a {
  font-size: .78rem; font-weight: 600; color: var(--qf-acc);
  padding: .35rem .7rem; border-radius: 20px; border: 1px solid var(--qf-acc); text-decoration: none;
}
.qf-overlay.qf-hdr .qf-empty-actions a:hover { background: var(--qf-wash); }

/* Footer */
.qf-overlay.qf-hdr .qf-footer { border-top: 1px solid var(--qf-line); color: var(--qf-faint); }
.qf-overlay.qf-hdr .qf-footer kbd { background: var(--qf-card2); border: 1px solid var(--qf-line2); color: var(--qf-soft); }

/* Trigger pill — keep refined rust ring */
.nav .qf-trigger {
  background: linear-gradient(180deg, rgba(217,138,61,.16), rgba(217,138,61,.08)) !important;
  border: 1px solid rgba(217,138,61,.35) !important;
  color: var(--qf-acc, #d98a3d) !important;
  transition: box-shadow .2s, border-color .2s, transform .2s, background .2s !important;
}
.nav .qf-trigger:hover {
  border-color: #d98a3d !important;
  box-shadow: 0 0 16px rgba(217,138,61,.35) !important;
  transform: translateY(-1px) !important;
}
.nav .qf-trigger kbd { background: rgba(217,138,61,.14) !important; border-color: rgba(217,138,61,.3) !important; color: #d98a3d !important; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .qf-overlay.qf-hdr .qf-panel,
  .qf-overlay.qf-hdr .qf-sym,
  .qf-overlay.qf-hdr .qf-link,
  .qf-overlay.qf-hdr .qf-drawer,
  .nav .qf-trigger { transition: none !important; }
}
```

- [ ] **Step 3: Verify CSS braces balance**

Run:
```bash
python3 -c "s=open('style.css').read(); o=s.count('{'); c=s.count('}'); print('open',o,'close',c,'OK' if o==c else 'MISMATCH')"
```
Expected: `open N close N OK` (equal counts).

- [ ] **Step 4: Commit**

```bash
git add style.css
git commit -m "style(quickfind): Dark Bench skin for rail + symptom layout"
```

---

## Task 5: Light (Workshop Notebook) skin + mobile + final media

**Files:**
- Modify: `style.css` — append a light-theme + mobile block immediately after the reduced-motion `@media` you wrote in Task 4 (i.e. right before the existing `/* Responsive */` comment at ≈10532+).

- [ ] **Step 1: Append the light + mobile block**

Insert the following directly after the Task 4 reduced-motion `@media` block:

```css
/* ── Light theme → Workshop Notebook palette (matches tips pages) ── */
html[data-theme="light"] .qf-overlay.qf-hdr {
  --qf-acc: #a8480c;
  --qf-acc-bright: #c2611a;
  --qf-wash: rgba(168,72,12,.09);
  --qf-bg: #f4eee2;
  --qf-card: #fbf7ef;
  --qf-card2: #efe7d7;
  --qf-txt: #2b2520;
  --qf-soft: #6e6456;
  --qf-faint: #9b9080;
  --qf-line: #e2d9c8;
  --qf-line2: #d3c7af;
}
html[data-theme="light"] .qf-overlay.qf-hdr .qf-backdrop { background: rgba(43,37,32,.28); }
html[data-theme="light"] .qf-overlay.qf-hdr .qf-drawer-count { background: var(--qf-bg); }
html[data-theme="light"] .qf-overlay.qf-hdr .qf-drawer:hover { background: rgba(43,37,32,.05); }

/* ── Mobile: rail nav becomes a horizontal chip row; symptoms 2×2 ── */
@media (max-width: 640px) {
  .qf-overlay.qf-hdr .qf-symptoms { grid-template-columns: repeat(2, 1fr); }
  .qf-overlay.qf-hdr .qf-rail { display: block; }
  .qf-overlay.qf-hdr .qf-railnav {
    flex-direction: row; border-right: none; border-bottom: 1px solid var(--qf-line);
    overflow-x: auto; gap: .4rem; padding: .5rem;
    -webkit-overflow-scrolling: touch;
  }
  .qf-overlay.qf-hdr .qf-drawer {
    flex: 0 0 auto; border-radius: 20px; padding: .4rem .7rem;
  }
  .qf-overlay.qf-hdr .qf-drawer.qf-on { box-shadow: none; background: var(--qf-wash); color: var(--qf-acc); }
  .qf-overlay.qf-hdr .qf-drawer-title { max-width: 40vw; }
  .qf-overlay.qf-hdr .qf-railpanels { min-height: 0; }
  /* Bottom-sheet entrance (mirror base behavior under the skin) */
  .qf-overlay.qf-hdr .qf-panel { border-radius: 16px 16px 0 0; transform: translateY(100%); }
  .qf-overlay.qf-hdr.open .qf-panel { transform: translateY(0); }
}
```

- [ ] **Step 2: Verify CSS braces balance**

Run:
```bash
python3 -c "s=open('style.css').read(); o=s.count('{'); c=s.count('}'); print('open',o,'close',c,'OK' if o==c else 'MISMATCH')"
```
Expected: `open N close N OK`.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "style(quickfind): light Notebook skin + mobile chip-row rail"
```

---

## Task 6: Build minified assets

**Files:**
- Generated: `style.min.css`, `main.min.js`.

- [ ] **Step 1: Run the build**

Run: `./build.sh`
Expected: prints `🥭 HDR Build`, two reduction lines for CSS and JS, and `✓ Build complete`. No Python traceback.

- [ ] **Step 2: Confirm the minified files contain the new code**

Run:
```bash
grep -c "qf-railnav" style.min.css; grep -c "qf-drawerpanel" main.min.js
```
Expected: each prints `1` or more (non-zero).

- [ ] **Step 3: Commit**

```bash
git add style.min.css main.min.js
git commit -m "build: regenerate minified assets for Quick Find redesign"
```

---

## Task 7: Behavioral verification

**Files:** none (verification only).

- [ ] **Step 1: Serve the site locally**

Run: `python3 -m http.server 8765` (leave running; open a second shell for checks, or run in background).

- [ ] **Step 2: Verify in a browser (use Playwright MCP browser tools if available, else manual)**

Navigate to `http://localhost:8765/` and confirm each:

1. Press **Cmd/Ctrl+K** (or click the Quick Find pill) → overlay opens; search field is focused.
2. **Symptom row** shows 4 cards: "Cracked screen", "Won't turn on", "Water damage", "Not sure?". Clicking "Cracked screen" navigates to `/iphone-repair` and the overlay closes.
3. Reopen. **Rail** shows 6 drawers with counts (Device Repair 12, Computer Help 3, Emergency 2, Main 9, Resources 6, About 3). Device Repair is active by default and its pages show on the right.
4. Click the **"Emergency"** drawer → right panel swaps to Repair SOS + Data Recovery only. With overlay open and not typing, **→ / ←** arrows move the active drawer.
5. Type **"cracked"** in the search box → rail + symptoms hide; a flat results list shows iPhone Repair with "cracked"… highlighted (this proves the symptom-keyword fold-in works, since "cracked" is not in the iPhone page's own keywords).
6. Type **"zzzzz"** → empty state shows "No pages match that." with "Text us / Run Device Check / See all services" actions.
7. Clear the search → browse view (symptoms + rail) returns.
8. **↑/↓** move the highlight through the visible list; **Enter** opens the highlighted page; **Esc** closes and returns focus to the trigger.
9. Toggle the site to **light mode** (theme toggle) and reopen → panel uses the warm paper/ink/rust Notebook palette.
10. Resize to **≤640px** → overlay is a bottom sheet; symptom cards are 2×2; the drawer rail is a horizontal scrolling chip row above the page list.

- [ ] **Step 3: Stop the server**

Stop the `python3 -m http.server` process.

- [ ] **Step 4: Final commit (if any verification fixes were made)**

If fixes were needed, re-run `./build.sh`, then:
```bash
git add -A
git commit -m "fix(quickfind): verification adjustments"
```

---

## Self-review notes (already reconciled against the spec)

- **Scannability (spec §Problem):** Task 4 rail = drawers + per-category panel; only the active category's pages render visibly → no scrolling-past. ✓
- **Distinctive look (spec §Visual identity):** Fraunces serif labels + rust accent (Task 4), Notebook palette under light mode (Task 5); aurora/cursor removed (Task 3 strips `qf-cursor`, Task 4 omits aurora). ✓
- **Hybrid + symptom targets (spec §Symptom set):** Task 1 data + Task 2 render; targets `/iphone-repair`, `/laptop-wont-turn-on`, `/phone-water-damage-hailey`, `/device-check`. ✓
- **Search = substring over name+desc+kw + symptom fold-in (spec §States):** Task 1 builds `hay` incl. `SYM_KW_BY_HREF`; Task 3 `runSearch` filters on it; highlight via `qf-hl`. ✓
- **Empty state (spec §Components):** Task 2 markup + Task 4 styling with the three CTAs. ✓
- **Mobile chip row + 2×2 symptoms (spec §Mobile):** Task 5. ✓
- **Keyboard + a11y (spec §Keyboard):** Task 3 ↑↓/←→/Enter/Esc, `role=tab`/`tabpanel`/`listbox`, focus restore; Task 4/5 reduced-motion. ✓
- **Build for minified consumers (spec §Architecture):** Task 6. ✓
- **No per-page HTML edits (spec §Architecture):** confirmed — only `main.js` + `style.css`. ✓
- **Type/name consistency:** `qf-drawer`/`qf-drawerpanel`/`qf-on`/`qf-railnav`/`qf-railpanels`/`qf-sym`/`qf-results`/`qf-empty-actions`/`ALL_ITEMS`/`SYM_KW_BY_HREF` used identically across Tasks 1–5. ✓
