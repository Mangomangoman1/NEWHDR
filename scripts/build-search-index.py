#!/usr/bin/env python3
"""Keep Quick Find's additional pages in sync with the published sitemap."""
from pathlib import Path
from html.parser import HTMLParser
import json
import re

ROOT = Path(__file__).resolve().parent.parent
MAIN = ROOT / 'main.js'
START = '  // BEGIN GENERATED SEARCH PAGES'
END = '  // END GENERATED SEARCH PAGES'

class Metadata(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.in_h1 = False
        self.name = ''
        self.description = ''
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'h1': self.in_h1 = True
        if tag == 'meta' and attrs.get('name') == 'description':
            self.description = attrs.get('content', '')
    def handle_endtag(self, tag):
        if tag == 'h1': self.in_h1 = False
    def handle_data(self, data):
        if self.in_h1: self.name += data

source = MAIN.read_text()
source = re.sub(re.escape(START) + r'[\s\S]*?' + re.escape(END) + r'\n*', '', source)
curated = source[source.index('  var QF_DATA ='):source.index('  // ---- Helpers')]
curated = curated[curated.index('categories:'): ]
known = set(re.findall(r"href: ['\"]([^'\"]+)['\"]", curated))
routes = re.findall(r'<loc>https://www.haileyrepair.com([^<]*)</loc>', (ROOT / 'sitemap.xml').read_text())
items = []
for route in routes:
    route = route.rstrip('/') or '/'
    if route in known: continue
    file = ROOT / ('index.html' if route == '/' else route.lstrip('/') + '.html')
    meta = Metadata(file.read_text())
    items.append({'name': ' '.join(meta.name.split()), 'desc': meta.description,
                  'href': route, 'icon': 'menu_book', 'kw': route.replace('/', ' ').replace('-', ' ')})
items.sort(key=lambda item: item['name'].lower())
block = START + '\n  QF_DATA.categories.push({ title: "Repair advice", icon: "menu_book", links: ' + json.dumps(items, ensure_ascii=False, indent=2) + ' });\n' + END + '\n'
source = source.replace('  // ---- Helpers', block + '\n  // ---- Helpers', 1)
MAIN.write_text(source)
print(f'Quick Find: {len(items)} additional published pages indexed.')
