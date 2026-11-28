#!/usr/bin/env python3
"""Put the mail-in button in the header of every public page, in the same spot.

Standard header: right before the Quick Find / Get a Quote group, so it shows on
desktop and stays beside the menu button on phones. Older repair-tip header: right
before its "Get a quote" pill. Taps are counted as "mail_in_top" by
assets/quote-tracking.js, apart from mail-in taps elsewhere on the page.
Safe to run on every build: an existing button is replaced, never doubled.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
CSS_TAG = '<link rel="stylesheet" href="/assets/css/mail-in-cta.css?v=20261128">'
HUB = '/mail-in-repair'
ICON = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
        'stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/>'
        '<path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/><path d="m7.8 5.3 8.4 4.5"/></svg>')


def button(current):
    cur = ' aria-current="page"' if current else ''
    return (f'<a class="mi-nav" href="{HUB}" data-quote-kind="mail_in_top"{cur}>{ICON}'
            '<span>Mail-in<span class="mi-nav__long"> repair</span></span></a>')


pages = [p for p in ROOT.glob('*.html')] + [p for d in ('tips', 'guides', 'mail-in', 'repair') for p in (ROOT / d).glob('*.html')]
placed, missing = 0, []
for page in pages:
    html = page.read_text()
    original = html
    html = re.sub(r'<a class="mi-nav".*?</a>\n?', '', html, flags=re.S)
    btn = button(page.relative_to(ROOT).as_posix() == 'mail-in-repair.html')
    if '<div class="nav-actions">' in html:
        html = html.replace('<div class="nav-actions">', btn + '\n<div class="nav-actions">', 1)
    elif '<a class="tip-quote"' in html:
        html = html.replace('<a class="tip-quote"', btn + '<a class="tip-quote"', 1)
    else:
        missing.append(page.relative_to(ROOT).as_posix())
        continue
    placed += 1
    if 'assets/css/mail-in-cta.css' in html:
        html = re.sub(r'<link rel="stylesheet" href="/assets/css/mail-in-cta\.css[^"]*">', CSS_TAG, html)
    else:
        html = html.replace('</head>', CSS_TAG + '</head>', 1)
    if html != original:
        page.write_text(html)
print(f'Mail-in header button on {placed} pages' + (f'; no header found on: {", ".join(missing)}' if missing else '.'))
