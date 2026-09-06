#!/usr/bin/env python3
"""Check every public HTML page for broken local references and basic structure."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json

ROOT = Path(__file__).resolve().parent.parent

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.refs, self.errors = [], [], []
        self.headings = 0
        self.polish = 0
        self.design = 0
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'): self.ids.append(attrs['id'])
        if tag == 'h1': self.headings += 1
        if tag == 'img':
            if 'alt' not in attrs: self.errors.append('image without alt text')
            if attrs.get('src') == '': self.errors.append('image with empty src')
        if tag in ('a', 'link', 'script', 'img', 'source'):
            for key in ('href', 'src'):
                if attrs.get(key): self.refs.append(attrs[key])
        if tag == 'link' and '/assets/css/site-polish.css' in attrs.get('href', ''):
            self.polish += 1
        if tag == 'link' and '/assets/css/site-design.css' in attrs.get('href', ''):
            self.design += 1
        if attrs.get('autocomplete') == 'tel email':
            self.errors.append('invalid combined phone/email autocomplete')

pages = {path.resolve(): Page(path) for path in ROOT.rglob('*.html')
         if not any(part.startswith('.') or part == 'archived' for part in path.relative_to(ROOT).parts)}
redirects = {rule['source']: rule['destination'] for rule in json.loads((ROOT / 'vercel.json').read_text())['redirects']}
errors, references = [], 0
for path, page in pages.items():
    label = str(path.relative_to(ROOT))
    html = path.read_text()
    if 'hdr-canonical-nav-js' in html: errors.append(f'{label}: legacy navigation copy')
    if 'id="qfOverlay"' in html and 'main.min.js' not in html and 'assets/site-navigation.js' not in html:
        errors.append(f'{label}: Quick Find is missing its shared script')
    errors.extend(f'{label}: {error}' for error in page.errors)
    if page.headings != 1: errors.append(f'{label}: expected one H1, got {page.headings}')
    if page.polish != 1: errors.append(f'{label}: expected one shared polish stylesheet')
    if page.design != 1: errors.append(f'{label}: expected one shared design stylesheet')
    for identifier, count in Counter(page.ids).items():
        if count > 1: errors.append(f'{label}: duplicate ID {identifier}')
    for reference in page.refs:
        url = urlsplit(reference)
        if url.scheme or url.netloc or reference.startswith('/_vercel/'): continue
        references += 1
        route = redirects.get(url.path, url.path)
        target = ((ROOT / route.lstrip('/')) if route.startswith('/') else path.parent / route) if route else path
        if not target.suffix and target.with_suffix('.html').is_file(): target = target.with_suffix('.html')
        elif target.is_dir(): target /= 'index.html'
        target = target.resolve()
        if not target.is_file(): errors.append(f'{label}: missing {reference}')
        elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            errors.append(f'{label}: missing anchor {reference}')
print(f'Site audit: {len(pages)} public pages, {references} local references, {len(errors)} failures.')
for error in errors: print(error)
raise SystemExit(bool(errors))
