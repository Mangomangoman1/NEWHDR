#!/usr/bin/env python3
"""Place the "Ask the bench" question box on the Repair Library hub and every tips page.

The markup lives in scripts/ask-bench.tmpl. Each page gets it between
<!-- ask-bench:start --> and <!-- ask-bench:end -->, just before </main>, plus the
stylesheet and script. Re-running refreshes the block, so new tips pages pick it
up the next time build.sh runs.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
VERSION = '20261103'
CSS = f'<link rel="stylesheet" href="/assets/css/ask-bench.css?v={VERSION}">'
JS = f'<script src="/assets/ask-bench.js?v={VERSION}" defer></script>'
START, END = '<!-- ask-bench:start -->', '<!-- ask-bench:end -->'
BLOCK = START + '\n' + (ROOT / 'scripts/ask-bench.tmpl').read_text().strip() + '\n' + END
BLOCK_RE = re.compile(re.escape(START) + r'.*?' + re.escape(END), re.S)
CSS_RE = re.compile(r'<link rel="stylesheet" href="/assets/css/ask-bench\.css\?v=[^"]*">')
JS_RE = re.compile(r'<script src="/assets/ask-bench\.js\?v=[^"]*" defer></script>')
# The hub's old closing call to action is replaced by the box.
HUB_CTA_RE = re.compile(r'<section class="rh-cta">.*?</section>', re.S)


def place(html: str, hub: bool = False) -> str:
    if START in html:
        html = BLOCK_RE.sub(lambda _: BLOCK, html)
    elif hub and HUB_CTA_RE.search(html):
        html = HUB_CTA_RE.sub(lambda _: BLOCK, html, count=1)
    else:
        idx = html.rindex('</main>')
        html = html[:idx] + BLOCK + '\n' + html[idx:]
    html = CSS_RE.sub(CSS, html) if CSS_RE.search(html) else html.replace('</head>', CSS + '</head>', 1)
    html = JS_RE.sub(JS, html) if JS_RE.search(html) else html[:html.rindex('</body>')] + JS + html[html.rindex('</body>'):]
    return html


changed = 0
pages = [(ROOT / 'tips.html', True)] + [(p, False) for p in sorted((ROOT / 'tips').glob('*.html'))]
for path, hub in pages:
    html = path.read_text()
    updated = place(html, hub)
    if updated != html:
        path.write_text(updated)
        changed += 1
print(f'Ask the bench: {len(pages)} pages checked, {changed} updated.')
