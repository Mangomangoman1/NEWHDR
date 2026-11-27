#!/usr/bin/env python3
"""Make sure every public page loads /assets/quote-tracking.js (quote tap counts)."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
TAG = '<script defer src="/assets/quote-tracking.js?v=20261127"></script>'
pages = [p for p in ROOT.glob('*.html')] + [p for d in ('tips', 'guides', 'mail-in', 'repair') for p in (ROOT / d).glob('*.html')]
added = 0
for page in pages:
    html = page.read_text()
    if 'assets/quote-tracking.js' in html:
        html2 = re.sub(r'<script defer src="/assets/quote-tracking\.js[^"]*"></script>', TAG, html)
    elif '</head>' in html:
        html2 = html.replace('</head>', TAG + '\n</head>', 1)
        added += 1
    else:
        continue
    if html2 != html:
        page.write_text(html2)
print(f'Quote tracking tag present on {len(pages)} pages ({added} added).')
