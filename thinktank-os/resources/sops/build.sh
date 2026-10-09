#!/usr/bin/env bash
# Regenerate SOP HTML from the markdown sources in this directory.
# Source of truth: the .md files. Generated: the .html files.
set -euo pipefail
cd "$(dirname "$0")"
for f in *.md; do
  out="${f%.md}.html"
  python3 -c "
import markdown, sys
md = open('$f').read()
html = markdown.markdown(md, extensions=['tables', 'fenced_code'])
open('$out', 'w').write(html)
print('built $out')
"
done
