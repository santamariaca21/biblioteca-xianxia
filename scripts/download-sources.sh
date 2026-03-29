#!/bin/bash
# Download source chapters from fanmtl.com
# Usage: ./scripts/download-sources.sh START END
START=${1:-609}
END=${2:-3613}
SOURCE_DIR="/tmp"

echo "Downloading chapters $START to $END..."
ok=0
fail=0
for ch in $(seq $START $END); do
  if [ -f "$SOURCE_DIR/source_cap${ch}.txt" ] && [ $(wc -l < "$SOURCE_DIR/source_cap${ch}.txt" 2>/dev/null) -gt 5 ]; then
    ok=$((ok+1))
    continue
  fi

  curl -s "https://www.fanmtl.com/novel/i-can-copy-talents_${ch}.html" | python3 -c "
import sys, re
html = sys.stdin.read()
match = re.search(r'<div class=\"chapter-content\">(.*?)</div>\s*<div class=\"chapternav', html, re.DOTALL)
if match:
    content = match.group(1)
    clean = re.sub(r'<[^>]+>', '\n', content)
    lines = [l.strip() for l in clean.split('\n') if l.strip() and 'Feilu' not in l and 'VIP' not in l and 'rush immediately' not in l and 'brand upgrade' not in l and 'Event Period' not in l]
    for l in lines: print(l)
" > "$SOURCE_DIR/source_cap${ch}.txt" 2>/dev/null

  lines=$(wc -l < "$SOURCE_DIR/source_cap${ch}.txt" 2>/dev/null)
  if [ "$lines" -gt 5 ]; then
    ok=$((ok+1))
  else
    fail=$((fail+1))
  fi

  # Progress every 100
  total=$((ch - START + 1))
  if [ $((total % 100)) -eq 0 ]; then
    echo "  Progress: $total/$((END - START + 1)) ($ok ok, $fail fail)"
  fi
done
echo "Done: $ok ok, $fail fail"
