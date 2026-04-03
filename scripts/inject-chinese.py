#!/usr/bin/env python3
"""
Inyecta el texto chino original en los capítulos existentes.
Lee de scripts/wtr-comparisons/wtr_capN.json → escribe content.zh y title.zh en capN.json

Uso: python3 scripts/inject-chinese.py [start] [end]
  Ej: python3 scripts/inject-chinese.py 1 530
"""
import json, os, sys, re

BASE = os.path.dirname(os.path.abspath(__file__))
# wtr-comparisons está en el repo raíz (fuera del subdirectorio Angular)
WTR_DIR = os.path.join(BASE, '..', '..', 'scripts', 'wtr-comparisons')
CHAPTERS_DIR = os.path.join(BASE, '..', 'public', 'novels', 'i-can-copy-talents', 'chapters')

start = int(sys.argv[1]) if len(sys.argv) > 1 else 1
end = int(sys.argv[2]) if len(sys.argv) > 2 else 3613

updated = 0
skipped = 0
missing_wtr = 0
missing_cap = 0

for n in range(start, end + 1):
    wtr_path = os.path.join(WTR_DIR, f'wtr_cap{n}.json')
    cap_path = os.path.join(CHAPTERS_DIR, f'cap{n}.json')

    if not os.path.exists(wtr_path):
        missing_wtr += 1
        continue
    if not os.path.exists(cap_path):
        missing_cap += 1
        continue

    wtr = json.load(open(wtr_path, encoding='utf-8'))
    cap = json.load(open(cap_path, encoding='utf-8'))

    # Extract clean Chinese paragraphs
    raw_content = wtr.get('content', '')
    lines = raw_content.split('\n')

    # Filter: only Chinese lines (contain CJK chars), skip site notices
    zh_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Skip site notices
        if '温馨提示' in line or '网站即将改版' in line or '阅读进度' in line:
            continue
        # Skip if it looks like a chapter title from ANOTHER chapter (e.g. 第2章 ...)
        # Only skip if we already have content (= it's bleeding from next chapter)
        if zh_lines and re.match(r'^第\d+章', line):
            break
        # Skip lines without Chinese characters (Spanish titles, site artifacts)
        if not re.search(r'[\u4e00-\u9fff]', line):
            continue
        zh_lines.append(line)

    if not zh_lines:
        skipped += 1
        continue

    # Talent panel keywords
    TALENT_KEYS = ['人类', '种族', '修炼天赋', '天赋', '物种', '凶兽']

    def is_talent_line(l):
        """Check if line is a talent/status panel entry like 人类：叶雨"""
        if not re.match(r'^[\u4e00-\u9fff\w]+[：:]', l):
            return False
        if len(l) > 40:
            return False
        key = re.split(r'[：:]', l, 1)[0]
        return any(k in key for k in TALENT_KEYS) or key in ['人类', '种族', '物种', '凶兽']

    # Build HTML content for zh, grouping talent lines into system-box
    zh_html_parts = []
    i_line = 0
    while i_line < len(zh_lines):
        line = zh_lines[i_line]

        # Chapter title line (第N章 ...)
        if re.match(r'^第\d+章', line):
            zh_html_parts.append(f'<p class="centered-italic">{line}</p>')
            i_line += 1
        # Talent panel: group consecutive talent lines
        elif is_talent_line(line):
            rows = []
            while i_line < len(zh_lines) and is_talent_line(zh_lines[i_line]):
                parts = re.split(r'[：:]', zh_lines[i_line], 1)
                label = parts[0].strip()
                value = parts[1].strip() if len(parts) > 1 else ''
                rows.append((label, value))
                i_line += 1
            # Build system-box
            box = ['<div class="system-box">']
            for label, value in rows:
                box.append(f'<div class="sys-row"><span class="sys-label">{label}:</span> <span class="sys-value">{value}</span></div>')
            box.append('</div>')
            zh_html_parts.append('\n'.join(box))
            continue  # don't increment, already advanced
        # Dialogue
        elif line.startswith('\u201c') or line.startswith('"') or line.startswith('\u300c'):
            zh_html_parts.append(f'<p><span class="dialogue">{line}</span></p>')
            i_line += 1
        else:
            zh_html_parts.append(f'<p>{line}</p>')
            i_line += 1

    zh_html = '\n'.join(zh_html_parts)

    # Extract title
    zh_title = wtr.get('title', '')
    # Also try first line if it's a chapter heading
    for line in zh_lines[:2]:
        if re.match(r'^第\d+章', line):
            zh_title = line
            break

    # Update cap JSON
    content = cap.get('content', {})
    title = cap.get('title', {})

    if isinstance(content, str):
        content = {'es': content}
    if isinstance(title, str):
        title = {'es': title}

    content['zh'] = zh_html
    if zh_title:
        title['zh'] = zh_title

    cap['content'] = content
    cap['title'] = title

    json.dump(cap, open(cap_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    updated += 1

print(f'✅ Inyectados: {updated}')
print(f'⏭️  Saltados (sin contenido): {skipped}')
print(f'📭 Sin source chino: {missing_wtr}')
print(f'📭 Sin capítulo JSON: {missing_cap}')
