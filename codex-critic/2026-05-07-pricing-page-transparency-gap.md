# 2026-05-07 — Pricing page critique: “transparent” without price proof

Target: `pricing.html` — HDR production repo (`git@github.com:Mangomangoman1/NEWHDR.git`)

## Brand / conversion capture
- Page job: reassure price-sensitive repair customers and get them to text enough device details for a firm quote.
- Audience: Wood River Valley phone/laptop owners who are afraid of surprise costs or being upsold.
- Current motif: calm quote-first service page; no strong proof artifact.
- Current CTA: strong — `Text me your issue — 208-450-1606` is direct, human, and low-friction.

## Finding
The page says **“Transparent Pricing”** but shows **no actual pricing examples, diagnostic-fee policy, labor/parts split, or common repair ranges** above the fold or in the body. That creates a trust gap: the tone is honest, but the content asks the visitor to trust the promise instead of proving it.

This is the kind of mismatch a cheap model misses because the page is clean, aligned, and technically decent. A real customer clicked “Pricing” expecting some numbers. If they get only “text me,” some will read it as evasive even if Samuel’s quote-first process is genuinely fair.

## What works
- The phone/text CTA is visible and specific.
- “Firm quote before work begins” is the right risk-reversal.
- The OEM / premium aftermarket / cost-effective options explanation is a good differentiator.
- 40-day warranty signal belongs near pricing and should stay.

## What feels weak / generic
1. **No price proof artifact.** There is no table, repair ticket, quote card, or sample estimate to make the promise tangible.
2. **Hero overpromises by label.** “Transparent Pricing” implies visible pricing; the page currently explains quote policy instead.
3. **Only 2 body internal links.** For an important decision page, it is underlinked and acts like a conversion dead end after the CTA.
4. **Cookie banner competes with the first pricing message.** It appears over the content and weakens the first 5 seconds.
5. **Google Fonts are still referenced on this page.** That violates the newer self-hosted font standard, but this is probably sitewide and should not be patched page-by-page.

## Recommended taste pass
Do not invent exact prices unless Samuel approves them. Instead add a **quote ledger / sample estimate artifact** that proves the quoting logic without promising fixed numbers:

```text
Sample quote ledger
Device / Problem             What changes the price                 Quote promise
Phone screen                 model + OLED/LCD part choice           firm quote before ordering
Laptop won’t turn on         diagnosis + board/charger/battery      no repair starts without approval
Game console HDMI            port condition + board damage          warranty included on completed work
```

Add a small policy row directly under it:
- `Text photos + model → I check parts vendors → you choose OEM / premium / cost-effective → I quote before work starts.`

Then add 3 contextual links after the ledger:
- `iPhone repair pricing factors` → `/iphone-repair`
- `Laptop diagnosis options` → `/laptop-repair`
- `Mail-in repair quote process` → `/mail-in-repair`

## Specific copy direction
Better H1 options:
- `Clear repair quotes before work starts`
- `Know the repair cost before I touch the device`
- `Pricing without surprise parts markups`

Keep “Transparent Pricing” in title/meta if desired, but make the visible hero more literal about the quote-before-work promise.

## QA notes from this run
- Repo verified: `origin git@github.com:Mangomangoman1/NEWHDR.git`, branch `main`.
- Browser previewed locally at `http://127.0.0.1:4177/pricing.html`.
- One H1: pass.
- Canonical present: `https://www.haileyrepair.com/pricing`.
- JSON-LD blocks parse: pass (3/3).
- Body internal links excluding nav/footer: `2` — weak for an SEO/conversion page.
- Google Fonts references in `pricing.html`: `6` — sitewide performance/standards debt.

## Priority
High-value, safe next edit: add the sample quote ledger + contextual links. This will make the page feel more honest without committing Samuel to fixed prices.
