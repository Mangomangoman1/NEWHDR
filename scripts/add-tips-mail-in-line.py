#!/usr/bin/env python3
"""Add a quiet "Not near Hailey? Mail it in" line inside the text box at the
top of tips pages (the .bench-cta box in the page hero), linking to the
mail-in page. Taps are counted as mail_in_tips by assets/quote-tracking.js.
Safe to run repeatedly: pages that already have the line are left alone."""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
LINE = ('<p class="bench-mail-in"><a href="/mail-in-repair" data-quote-kind="mail_in_tips">'
        'Not near Hailey? Mail it in from any state'
        '<span aria-hidden="true"> &rarr;</span></a></p>')
# Software-only topics: nothing to mail in, so no line.
SKIP = {'fake-support-scam-popups', 'wifi-keeps-dropping'}
BOX = re.compile(r'(<div class="bench-cta[^"]*"><div><strong>.*?</strong><p>.*?</p>)(</div><a class="bench-btn" href="sms:)', re.S)

changed = present = 0
for path in sorted((ROOT / 'tips').glob('*.html')):
    if path.stem in SKIP:
        continue
    html = path.read_text()
    start = html.find('<section class="bench-hero')
    if start < 0:
        continue
    end = html.find('</section>', start)
    hero = html[start:end]
    if 'class="bench-mail-in"' in hero:
        present += 1
        continue
    new_hero, n = BOX.subn(lambda m: m.group(1) + LINE + m.group(2), hero, count=1)
    if n:
        path.write_text(html[:start] + new_hero + html[end:])
        changed += 1
print(f'Tips mail-in line: added on {changed} pages, already on {present}.')
