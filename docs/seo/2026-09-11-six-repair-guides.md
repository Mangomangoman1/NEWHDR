# Six useful additions to the Repair Library

Implemented September 11, 2026. Local changes; no deployment or new indexing submission performed.

## Why these topics

The foundation is the [September 7 Search Console review](2026-09-07-search-console-findings.md), covering the complete August 9–September 5 period. It recorded 223 clicks and 28,305 impressions, compared with 89 clicks and 8,443 impressions in the preceding 28 days. This work does not claim a fresh September 11 performance export.

The strongest evidence supports specific device symptoms. These six pages answer different decisions instead of making additional versions of the successful black-screen, hairline-crack, PS5 HDMI, or overheating guides.

| New page | Why it is useful | Strength of search evidence |
| --- | --- | --- |
| `/tips/screen-protector-or-cracked-screen` | Distinguishes an accessory replacement from phone glass or display damage; explains why working touch and screenshots cannot prove which glass cracked. | Direct: 36 disclosed protector queries, 98 impressions, in the cracked-screen page export. |
| `/tips/backup-iphone-broken-screen` | Gives separate paths for existing copies, working touch, computer authorization, and restoring display access before a backup. | Adjacent to the leading black-screen guide: 94 clicks and 11,319 impressions. No separate backup-query volume claimed. |
| `/tips/laptop-screen-black-but-running` | Separates a Windows display fault from failure to start, with meaningful external-monitor comparisons and data precautions. | Exploratory extension of the computer library; hinge and charging guides have early exposure. No measured demand claimed for this exact new page. |
| `/tips/spilled-liquid-on-laptop` | Provides urgent, ordered spill actions, model-specific drainage limits, and a data-first repair handoff. | Usefulness-led gap in the laptop library; not a proven query cluster. |
| `/tips/ps5-controller-not-charging` | Isolates USB cable, port, power state, pairing, and controller faults before parts purchases. | Adjacent to demonstrated PS5 exposure, with distinct intent from HDMI and overheating. |
| `/tips/ps5-disc-not-reading` | Separates a bad disc, loading fault, setup issue, and software problem without prematurely erasing saves. | Adjacent PS5 topic; no search-volume or ranking forecast claimed. |

Each article contains approximately 840–960 words of article content, plus its immediate answer and image caption. Length was a result of the decisions covered, not a word-count target.

## Content and design

The design uses a restrained dark editorial layout: the answer appears immediately, a topic-specific illustration establishes context, and numbered sections support quick scanning. Desktop readers get a sticky contents list; mobile readers get a compact contents index. Expandable FAQs use native HTML. Content remains visible without JavaScript; the small shared script supplies reading progress.

The visual approach is consistent across the six guides: deep slate, warm light device surfaces, clear type hierarchy, and minimal borders. Motion is limited to the illustration entrance and link feedback, with reduced-motion support. No custom focus ring styling was added.

Manufacturer references are linked on each article and were checked September 11. Sources include Apple, Samsung, Microsoft, Lenovo, and Sony. The text explains what a test suggests and what it cannot establish. It does not invent customer repairs, measurements, technician review, success rates, or firsthand experience.

Specific editorial protections include distinguishing ordinary screen protectors from foldable inner films, distinguishing iCloud synchronization from backup, respecting iPhone passcode/trust requirements, avoiding laptop power-on tests after a spill, and separating PS5 maintenance from destructive resets.

## Six original illustrations

Each guide has its own generated 1536 × 1024 illustration, visibly labeled as an illustration. Original PNGs remain in Codex's generated-image directory. The site uses optimized WebP copies and 768 × 512 responsive variants.

| Asset stem in `assets/tips/` | Full image | Mobile image |
| --- | ---: | ---: |
| `screen-protector-or-cracked-screen` | 56 KB | 15 KB |
| `backup-iphone-broken-screen` | 59 KB | 18 KB |
| `laptop-screen-black-but-running` | 36 KB | 12 KB |
| `spilled-liquid-on-laptop` | 55 KB | 17 KB |
| `ps5-controller-not-charging` | 66 KB | 18 KB |
| `ps5-disc-not-reading` | 58 KB | 15 KB |

Sizes are rounded KiB. Full images end in `.webp`; mobile images end in `-768.webp`. Each image has descriptive alt text, explicit dimensions, responsive source selection, and an article/social sharing reference.

The [complete image prompts and original/output paths](2026-09-11-guide-image-prompts.json) record the built-in generation workflow. All six outputs were visually inspected before integration.

## Discovery and integration

- The Repair Library now lists 40 guides. Its visible count and CollectionPage list agree.
- All six pages appear in the Repair Guides hub, sitemap, and generated Quick Find search index.
- Contextual links connect the protector guide to cracked-screen safety, backup to the successful black-screen page, laptop guides to laptop repair, and PS5 guides to PS5 repair.
- The Repair Guides hub's 22 card entries and two visible FAQs now match its structured data. Obsolete FAQ text about unpublished cards was removed from the schema.
- New articles have unique titles, descriptions, self-referencing canonical URLs, Article/BreadcrumbList/FAQPage markup, and visible matching FAQs.
- The library's broad “bench-tested” description was changed to “practical” so it does not imply these new illustrations and instructions document actual customer repairs.

## Verification

- `bash build.sh` completed, rebuilding shared navigation and search assets.
- `python3 scripts/audit-site.py`: 84 public pages, 5,845 local references, zero failures.
- `node scripts/audit-indexability.mjs`: 760 checks passed, zero failed. These are local structural checks, not confirmation of Google indexing.
- Existing site-interaction and repair-viewer test suites: all 24 tests passed.
- All six new FAQ schemas were compared with their visible answers.
- Computer Use in Chrome: reviewed all six guides in actual 390px iframe viewports; checked all six at 320px with content width equal to viewport width. Representative desktop pages were visually checked, and a FAQ was opened successfully.
- Chrome verified the library's protector search, its five-result console category including both new PS5 pages, and the DualSense guide in Quick Find.
- `git diff --check` passed. Temporary mobile-preview fixtures were removed.

After deployment, Google still decides whether and when to index each page. Evaluate page-specific queries and usefulness over time; the existing site's growth does not establish that these six pages will rank or produce local repair inquiries.
