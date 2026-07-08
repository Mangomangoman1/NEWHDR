#!/usr/bin/env python3
"""Regenerate the pricing tables inside pricing.html from assets/pricing-data.json.

Source of truth: Samuel's Numbers sheet -> HDR-Price-Table.csv (NOT committed,
NOT deployed - contains cost/margin data) -> assets/pricing-data.json (menu +
mail-in prices only, notes sanitized for publication).

Usage: python3 scripts/build-pricing.py
Replaces everything between <!-- PRICE-TABLES:START --> and <!-- PRICE-TABLES:END -->.
"""
import json, html, re, sys, os

os.chdir(os.path.join(os.path.dirname(__file__), '..'))
data = json.load(open('assets/pricing-data.json'))

CATS = [
    ('iphone',   'iPhone',                 'Screens, batteries, charge ports, and back glass for every iPhone from the 8 to the 17 Pro Max.'),
    ('ipad',     'iPad',                   'Standard iPads have separate glass and LCD; mini, Air, and Pro use one laminated assembly.'),
    ('android',  'Samsung & Google Pixel', 'Galaxy S and A series on OEM service packs; Pixel with fingerprint calibration included.'),
    ('macbook',  'MacBook',                'Displays are full lid assemblies; batteries are glued cells done carefully.'),
    ('console',  'Consoles & Controllers', 'HDMI ports, drives, screens, thermal service, and drift fixes that beat buying new.'),
    ('services', 'Flat-Rate Services',     'Labor-only work - and Idaho does not tax labor when it is itemized, so these prices are the whole invoice.'),
]

def e(t):
    return html.escape(t, quote=False)

out = ['<!-- PRICE-TABLES:START -->']
for key, label, sub in CATS:
    rows = [d for d in data if d['cat'] == key]
    if not rows:
        continue
    out.append(f'<section class="pt-cat" id="pt-{key}">')
    out.append(f'<h2>{e(label)}</h2>')
    out.append(f'<p class="pt-cat-sub">{e(sub)}</p>')
    out.append('<div class="pt-scroll"><table class="pt-table">')
    if key == 'services':
        out.append('<thead><tr><th>Service</th><th>What’s included</th><th>Price</th><th>Mail-in</th></tr></thead><tbody>')
        for d in rows:
            note = f'<span class="pt-note">{e(d["note"])}</span>' if d.get('note') else ''
            out.append(f'<tr data-f="{e(d["job"].lower())}"><td>{e(d["job"])}{note}</td>'
                       f'<td class="pt-inc">{e(d.get("included",""))}</td>'
                       f'<td class="pt-price">{e(d["price"])}</td><td class="pt-price">{e(d["mailin"])}</td></tr>')
    else:
        out.append('<thead><tr><th>Model</th><th>Repair</th><th>Price</th><th>Mail-in</th></tr></thead><tbody>')
        for d in rows:
            note = f'<span class="pt-note">{e(d["note"])}</span>' if d.get('note') else ''
            f = f'{d["device"]} {d["job"]}'.lower()
            out.append(f'<tr data-f="{e(f)}"><td>{e(d["device"])}</td>'
                       f'<td>{e(d["job"])}{note}</td>'
                       f'<td class="pt-price">{e(d["price"])}</td><td class="pt-price">{e(d["mailin"])}</td></tr>')
    out.append('</tbody></table></div></section>')
out.append('<!-- PRICE-TABLES:END -->')
block = '\n'.join(out)

s = open('pricing.html').read()
s2, n = re.subn(r'<!-- PRICE-TABLES:START -->.*?<!-- PRICE-TABLES:END -->', lambda m: block, s, flags=re.S)
if n != 1:
    sys.exit('markers not found in pricing.html - aborting')
open('pricing.html', 'w').write(s2)
print(f'pricing.html regenerated: {len(data)} rows across {sum(1 for k,_,_ in CATS if any(d["cat"]==k for d in data))} categories')
