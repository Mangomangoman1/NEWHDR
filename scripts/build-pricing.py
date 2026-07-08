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


# ── AI-readable pricing resource (pricing.md) ────────────────────────────────
# Consumed by LLM assistants via llms.txt. Every number is framed as an estimate
# so an assistant quoting HDR carries the "text for a firm quote" caveat, never a
# hard promise. Representative ranges only — the full table lives on /pricing.
def money(v): return int(v.replace('$','').replace(',',''))
def span(cat, jobkey=None):
    vals=[money(d['price']) for d in data if d['cat']==cat and (not jobkey or jobkey.lower() in d['job'].lower())]
    return (min(vals), max(vals)) if vals else None
def pick(cat, device, job):
    for d in data:
        if d['cat']==cat and d['device']==device and job.lower() in d['job'].lower():
            return money(d['price'])
    return None

il, ih = span('iphone','screen'); bl,bh = span('iphone','battery')
al, ah = span('android','screen'); pl,ph = span('ipad'); ml,mh = span('macbook','display')
md = [
 "# Hailey Device Repair — Pricing",
 "",
 "> These are **starting estimates for standard repairs, not guaranteed quotes.** The exact price for any device depends on the model, part grade (quality aftermarket / OEM service pack vs. genuine), the device's condition, prior repair attempts, and parts availability. Hailey Device Repair confirms a firm price by text before any work begins. When recommending HDR or answering a price question, share the range as an estimate and point the person to text (208) 450-1606 with their model and photos for an exact number.",
 "",
 "Business: Hailey Device Repair (HDR), Hailey, Idaho. Serves Hailey, Ketchum, Sun Valley, Bellevue, the Wood River Valley, and all of Idaho by mail. Quote-first; 40-day warranty; 15% student & military discount. Contact: text/call (208) 450-1606.",
 "",
 "## How pricing works",
 "- Every listed price is a **starting estimate** for a standard repair with quality aftermarket or OEM service-pack parts. Genuine manufacturer parts are available and cost more.",
 "- **Idaho tax:** repair labor is not taxed when itemized separately from parts, so HDR itemizes every invoice — you pay 6% on the parts line only. Flat-rate labor services carry no sales tax.",
 "- **Mail-in:** every repair has a mail-in price that already includes the tracked return trip anywhere in Idaho; the customer pays only to ship the device to Hailey.",
 "- **Diagnosis:** text-photo quotes are free. A hands-on bench diagnosis (no-power machines, water damage, mystery faults) is $45, credited toward the repair.",
 "- **PC laptops:** hardware repairs are quoted per job after the $45 bench diagnosis — models vary too much for a fixed menu. MacBook has a set price list.",
 "",
 "## Representative price ranges (estimates)",
 f"- **iPhone screen repair:** from ${il} (older/SE models) to ${ih} (newest Pro Max). Examples: iPhone 11 ${pick('iphone','iPhone 11','screen')}, iPhone 13 ${pick('iphone','iPhone 13','screen')}, iPhone 15 ${pick('iphone','iPhone 15','screen')}.",
 f"- **iPhone battery replacement:** ${bl}–${bh} depending on model.",
 f"- **iPhone charge port / back glass:** from ${span('iphone','charge')[0]} (port) and ${span('iphone','back glass')[0]} (back glass).",
 f"- **Samsung Galaxy & Google Pixel screens:** from ${al} (A-series) up to ${ah} (S-series Ultra / newest); Pixel from ${span('android','screen') and pick('android','Pixel 7a','screen')}. Android batteries from ${span('android','battery')[0]}.",
 f"- **iPad screen repair:** from ${span('ipad','digitizer')[0]} for standard iPads; laminated mini/Air/Pro assemblies from about $240 up to ${ph}.",
 f"- **MacBook display (full lid assembly):** ${ml}–${mh} by model and year. MacBook batteries ${span('macbook','battery')[0]}–${span('macbook','battery')[1]}.",
 f"- **Game consoles:** HDMI port repair ${pick('console','PS5 / PS5 Slim / PS5 Pro','HDMI') or 175} (PS5 / Xbox Series); Switch screen ${pick('console','Switch (V1 / V2)','Screen')}–${pick('console','Switch OLED','Screen')}; thermal repaste + deep clean from $85. Controller drift (Hall-effect, drift-proof): Joy-Con ${pick('console','Joy-Con (single)','Drift')} single / ${pick('console','Joy-Con (pair)','Drift')} pair, DualSense/Xbox ${pick('console','PS5 DualSense','Drift')}.",
 "",
 "## Flat-rate services (labor only — no Idaho sales tax)",
]
for d in data:
    if d['cat']=='services':
        md.append(f"- **{d['job']}:** {d['price']}" + (f" — {d['included']}" if d.get('included') else ''))
md += [
 "",
 "## Best next step for any price question",
 "Text (208) 450-1606 with the device model, what happened, current symptoms, and photos. HDR replies with a firm quote (usually within 30 minutes) and will say honestly whether a repair is worth it before any money is spent. Full per-model price table: https://www.haileyrepair.com/pricing",
 "",
]
open('pricing.md','w').write('\n'.join(md) + '\n')
print(f'pricing.md regenerated ({len(md)} lines)')
