#!/usr/bin/env python3
"""Check shared semantic navigation and control invariants on every public page."""
from html.parser import HTMLParser
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
errors = []
class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path.relative_to(ROOT).as_posix()
        self.mains, self.ids, self.skips = [], set(), []
        self.in_main, self.main_targets = False, set()
        self.feed(path.read_text())
        if len(self.mains) != 1: self.fail('expected one main landmark')
        if not self.skips: self.fail('missing skip navigation')
        for target in self.skips:
            if target not in self.ids: self.fail('skip destination is missing: ' + target)
        if self.mains and not self.main_targets.intersection(self.skips): self.fail('skip navigation does not target main content')

    def fail(self, issue): errors.append(self.path + ': ' + issue)
    def handle_starttag(self, tag, attrs):
        for key, count in Counter(k for k, v in attrs).items():
            if count > 1: self.fail('duplicate attribute: ' + key)
        a = dict(attrs)
        if tag == 'main':
            self.mains.append(a.get('id'))
            self.in_main = True
        if a.get('id'):
            self.ids.add(a['id'])
            if self.in_main: self.main_targets.add(a['id'])
        if tag == 'a' and set(a.get('class', '').split()) & {'skip', 'skip-link', 'fg-skip'}:
            self.skips.append(a.get('href', '').removeprefix('#'))
        if tag == 'nav' and a.get('id') in {'nav', 'mainNav'} and not a.get('aria-label'): self.fail('unnamed primary navigation')
        if tag == 'button' and not a.get('type'): self.fail('unspecified button type')
        if tag == 'th' and a.get('scope') not in {'col', 'row', 'colgroup', 'rowgroup'}: self.fail('table header lacks scope')
        if tag == 'input' and a.get('id') == 'qfSearch' and not a.get('aria-label'): self.fail('unlabeled Quick Find input')

    def handle_endtag(self, tag):
        if tag == 'main': self.in_main = False

pages = [p for p in ROOT.rglob('*.html') if not any(part.startswith('.') or part == 'archived' for part in p.relative_to(ROOT).parts)]
for path in pages: Page(path)
print(f'Semantic accessibility audit: {len(pages)} public pages, {len(errors)} failures.')
for error in errors: print(error)
raise SystemExit(bool(errors))
