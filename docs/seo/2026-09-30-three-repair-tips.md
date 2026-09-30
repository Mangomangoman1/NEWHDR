# Three additions to the Repair Library

Implemented September 30, 2026. These are practical gaps in the existing library; no new search-volume, ranking, or customer-repair claims were used to select them.

| Page | Distinct reader decision |
| --- | --- |
| `/tips/iphone-microphone-not-working` | Compare outgoing call audio, local recordings, app permissions, and accessories before choosing microphone hardware. Different intent from the existing muffled-speaker and camera-focus tips. |
| `/tips/laptop-keyboard-keys-not-working` | Separate input settings and app behavior from built-in keyboard damage, with an external-keyboard comparison and a spill-first stopping point. |
| `/tips/nintendo-switch-wont-turn-on` | Compare direct power and a depleted battery before assuming a failed port or battery. Covers the original Switch, Lite, and OLED; explicitly excludes Switch 2. |

The pages reuse the September 11 field-guide HTML layout and shared styles: immediate answer, numbered sections, contents navigation, native FAQ details, manufacturer sources, and a soft repair CTA. They use Samuel's first-person editorial voice without invented firsthand repairs or results. Each has Article, LocalBusiness, BreadcrumbList, and matching FAQPage data, with September 30 publication/modification dates and an author/publisher reference to `#business`.

Manufacturer guidance checked September 30:

- [Apple microphone tests and app permissions](https://support.apple.com/en-us/101600), plus [exterior cleaning](https://support.apple.com/en-us/108765).
- [Apple key-response settings and comparisons](https://support.apple.com/guide/mac-help/if-your-mac-doesnt-respond-to-key-presses-mchlp1240/mac) and [Microsoft external input troubleshooting](https://support.microsoft.com/en-us/windows/hardware/input-devices/mouse-and-keyboard-problems-in-windows).
- [Nintendo's original Switch family no-power procedure](https://en-americas-support.nintendo.com/app/answers/detail/a_id/22502/~/nintendo-switch-system-has-no-power,-a-blank-screen,-or-wont-wake-up-from). The current instructions specify a 30-second adapter disconnect and 20-second POWER hold, then 15–30 minutes of charging when the battery indicator appears.

Three original 1536 × 1024 illustrations were produced with built-in ImageGen and visually inspected. Pages label them as illustrations. The optimized WebP files and 768 × 512 variants are in `assets/tips/`, using each page slug. The [prompt manifest](2026-09-30-tip-image-prompts.json) records the full prompt set and output paths. Full/mobile asset sizes are approximately 49/16 KiB for microphone, 76/23 KiB for keyboard, and 63/17 KiB for Switch.

Discovery updates:

- Repair Library: 43 visible entries, matching ordered CollectionPage items and the initial result count.
- Repair Guides: 25 visible entries, matching ordered CollectionPage items.
- Sitemap: three new routes and updated modification dates for both changed indexes.
- Quick Find: generated from the sitemap; source, minified, and shared-navigation assets rebuilt.

Validation:

- `bash build.sh` passed.
- `python3 scripts/audit-site.py`: 87 public pages, 6,058 local references, zero failures.
- `node scripts/audit-indexability.mjs`: 784 checks passed, zero failures.
- README test command: all 24 site-interaction, repair-phone, and repair-inspection tests passed.
- The actual library filter script was exercised with the new cards: phone + “microphone not working,” computer + “keyboard keys,” and console + “switch wont turn on” each find the intended page. Reset restores 43 guides.
- Visible FAQs match their JSON-LD; both index item lists match visible cards and positions; article contents links pass the site audit.
- `git diff --check` passed. Generated asset changes contain only the three additional search entries.

Browser rendering was not checked because the browser-control tool is unavailable in this execution environment. The pages retain the existing layout and CSS; no claim of desktop/mobile browser QA is made. No push, deployment, or indexing submission was performed.
