#!/usr/bin/env python3
"""Compare public copy and business metadata with a chosen Git revision."""
from html.parser import HTMLParser
from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
BASE = sys.argv[1] if len(sys.argv) > 1 else json.loads(
    (ROOT / 'docs/site-improvements-2026-10-01.json').read_text()
)['baseline']
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

class Content(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.stack, self.copy, self.metadata, self.schema = [], [], [], []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        ignored = tag in {'script', 'style'} or (
            tag == 'a' and set(a.get('class', '').split()) & {'skip', 'skip-link', 'fg-skip'}
        )
        if tag == 'meta': self.metadata.append(sorted(attrs))
        if tag == 'link' and a.get('rel') == 'canonical': self.metadata.append(sorted(attrs))
        if tag not in VOID: self.stack.append((tag, bool(ignored), a))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID: self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if self.stack and self.stack[-1][0] == 'script' and self.stack[-1][2].get('type') == 'application/ld+json':
            self.schema.append(json.loads(data))
        if not any(frame[1] for frame in self.stack):
            self.copy.extend(data.split())

pages = [p for p in ROOT.rglob('*.html') if not any(
    part.startswith('.') or part == 'archived' for part in p.relative_to(ROOT).parts
)]
errors = []
for page in pages:
    path = page.relative_to(ROOT).as_posix()
    old = Content(subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT, text=True))
    new = Content(page.read_text())
    for field in ['copy', 'metadata', 'schema']:
        if getattr(old, field) != getattr(new, field): errors.append(f'{path}: changed {field}')
print(f'Content preservation: {len(pages)} public pages; {len(errors)} differences in copy, metadata, or JSON-LD.')
for error in errors: print(error)
raise SystemExit(bool(errors))
