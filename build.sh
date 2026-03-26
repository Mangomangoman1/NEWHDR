#!/usr/bin/env bash
# Hailey Device Repair — Build Script
# Minifies CSS/JS and inlines critical CSS for production
set -euo pipefail
cd "$(dirname "$0")"

echo "🥭 HDR Build — Minifying assets..."

# CSS: strip comments, collapse whitespace, remove blank lines
python3 -c "
import re
css = open('style.css').read()
css = re.sub(r'/\*[^*]*\*+(?:[^/*][^*]*\*+)*/', '', css)
css = re.sub(r'\s+', ' ', css)
css = re.sub(r'\s*{\s*', '{', css)
css = re.sub(r'\s*}\s*', '}', css)
css = re.sub(r'\s*;\s*', ';', css)
css = re.sub(r'\s*:\s*', ':', css)
css = re.sub(r'\s*,\s*', ',', css)
css = re.sub(r';+}', '}', css)
css = css.strip()
open('style.min.css', 'w').write(css)
orig = len(open('style.css').read())
mini = len(css)
print(f'  CSS: {orig:,} → {mini:,} bytes ({100-mini*100//orig}% reduction)')
"

# JS: strip single-line comments, collapse whitespace (safe minification)
python3 -c "
import re
js = open('main.js').read()
lines = js.split('\n')
out = []
for line in lines:
    stripped = line.strip()
    if stripped.startswith('//'):
        continue
    out.append(line.rstrip())
out = '\n'.join(out)
out = re.sub(r'\n{3,}', '\n\n', out)
out = out.strip() + '\n'
open('main.min.js', 'w').write(out)
orig = len(open('main.js').read())
mini = len(out)
print(f'  JS:  {orig:,} → {mini:,} bytes ({100-mini*100//orig}% reduction)')
"

# Critical CSS: generate from critical.min.css if present
if [ -f critical.min.css ]; then
  CRITICAL_SIZE=$(wc -c < critical.min.css | tr -d ' ')
  echo "  Critical CSS: ${CRITICAL_SIZE} bytes (will be inlined)"
fi

echo "✓ Build complete — style.min.css + main.min.js + critical.min.css"
echo ""
echo "To deploy, use the .min files. Source files remain as development versions."
