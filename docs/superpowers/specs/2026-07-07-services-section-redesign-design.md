# Homepage Services Section Redesign — "The Quiet Grid"

**Goal:** Replace the gimmicky services band (rainbow accents, icon chips,
cut-out images, spotlight hover, badge sandwiches) with an Apple-grade
typography-led design. Approved by Samuel 2026-07-07 (Option A).

## Band structure
- One piece instead of three. Delete the 3-chip trust row above and the
  4-badge row below.
- Header: h2 "What I fix." (display font) + subline
  "Phones, computers, tablets, and consoles — repaired in Hailey, or by
  mail from anywhere in Idaho."
- Single muted trust line under header:
  "40-day warranty · Most repairs same-day · Free return shipping on mail-in"

## Cards (6, same URLs, chooser preserved on Computers)
- Hairline border var(--border-subtle), 18px radius, transparent bg,
  ~2rem padding. No icons, no images, no per-card accent colors.
- Anatomy: title / one-line copy / quiet link (accent color).
- Hover: bg -> var(--bg-surface), border -> var(--border-strong),
  arrow translates 2px. No transforms/glows. Spotlight JS deleted.
- Titles: Inter 600 ~1.4rem tight tracking (scoped override of the
  sitewide MuseoModerno h3 rule). Section h2 keeps display font.

## Copy
Phones — Screens, batteries, charging, water damage.
Computers — MacBook, Windows laptop, gaming PC, or a tune-up. (Choose your repair)
Consoles — HDMI ports, overheating, drift, disc drives.
Tablets — Screens, batteries, charging, kid drops.
Diagnostics — Not sure what's wrong? I'll find it and price it.
Mail-In Repairs — Ship it from anywhere in Idaho.

## Technical
- index.html only. Keep #services anchor, #computersCard id, data-animate
  reveals (threshold 0.01 + safety timer already in main.js).
- All colors via CSS vars -> light theme works automatically.
- Grid: 3 cols >=1080px, 2 cols 640–1080, 1 col <640.
- card-*.webp images become unreferenced (cleanup allowed).
