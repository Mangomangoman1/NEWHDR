# 2026-05-07 18:57 MDT — Warranty page mobile CTA critique

Target: `warranty.html` hero at 375px.

## Finding
The warranty page looked polished, but the first phone screen failed the local-service conversion rule: no text/call path was visible above the fold. The only visible buttons on first load were cookie-consent controls, so the most tappable thing on the screen was not a repair action.

This is a trust page, but trust without an immediate next step leaks ready customers. A customer checking whether a previous repair is covered needs a low-friction path: text Samuel, describe the repair, get confirmation. The old hero said “Your device is in good hands,” which is reassuring but passive.

## Shipped fix
Added a scoped hero action block directly under the warranty hero copy:

- Primary: `Text Samuel about my repair` → `sms:+12084501606`
- Secondary: `Call 208-450-1606` → `tel:+12084501606`
- Risk-reversal/helper line: `No forms. Just send the device, repair date, and what changed.`

Added scoped CSS in `style.css` so the CTAs are full-width and thumb-sized on narrow mobile without repainting the page.

## Why this matters
The page now answers the 4-second phone test better:

1. What is this? Warranty/repair guarantee.
2. Why trust it? 40-day warranty + honest diagnostic promise.
3. What do I do now? Text Samuel about my repair.
4. Is it low-friction? No forms; just send the repair details.

## Remaining recommendation
The cookie banner still dominates the bottom of the first screen on a fresh visit. If this page gets another pass, make the cookie banner lighter/shorter on mobile or delay it until after the visitor has seen the repair CTA. Right now it can still compete visually with conversion.
