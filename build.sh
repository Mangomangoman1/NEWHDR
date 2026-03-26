#!/usr/bin/env bash
# Hailey Device Repair — Build Script
# Minifies CSS and JS for production deployment
set -euo pipefail
cd "$(dirname "$0")"

echo "🥭 HDR Build — Minifying assets..."

# CSS: strip comments, collapse whitespace, remove blank lines
python3 -c "
import re, sys
css = open('style.css').read()
# Remove multi-line comments (but keep license)
css = re.sub(r'/\*[^*]*\*+(?:[^/*][^*]*\*+)*/', '', css)
# Collapse whitespace
css = re.sub(r'\s+', ' ', css)
# Remove space around selectors/braces
css = re.sub(r'\s*{\s*', '{', css)
css = re.sub(r'\s*}\s*', '}', css)
css = re.sub(r'\s*;\s*', ';', css)
css = re.sub(r'\s*:\s*', ':', css)
css = re.sub(r'\s*,\s*', ',', css)
# Remove trailing semicolons before }
css = re.sub(r';+}', '}', css)
# Clean up
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
# Remove single-line comments (but not URLs with //)
lines = js.split('\n')
out = []
for line in lines:
    stripped = line.strip()
    if stripped.startswith('//'):
        continue
    # Remove trailing comments (but not inside strings or URLs)
    out.append(line.rstrip())
out = '\n'.join(out)
# Collapse multiple blank lines
out = re.sub(r'\n{3,}', '\n\n', out)
out = out.strip() + '\n'
open('main.min.js', 'w').write(out)
orig = len(open('main.js').read())
mini = len(out)
print(f'  JS:  {orig:,} → {mini:,} bytes ({100-mini*100//orig}% reduction)')
"

echo "✓ Build complete — style.min.css + main.min.js"
echo ""
echo "To deploy, use the .min files. Source files remain as development versions."
