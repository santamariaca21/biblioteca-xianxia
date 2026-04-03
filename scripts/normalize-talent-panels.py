#!/usr/bin/env python3
"""
Normaliza todos los paneles de talento (system-box) a un formato único.

Formato estándar:
<div class="system-box">
  <div class="sys-title">Título del Panel</div>
  <div class="sys-row"><span class="sys-label">Etiqueta:</span> <span class="sys-value">Valor</span></div>
  ...
</div>

Uso: python3 scripts/normalize-talent-panels.py [start] [end]
"""
import json, re, os, sys

CHAPTERS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'novels', 'i-can-copy-talents', 'chapters')

start = int(sys.argv[1]) if len(sys.argv) > 1 else 1
end = int(sys.argv[2]) if len(sys.argv) > 2 else 530

# Gold values: levels that should be highlighted
GOLD_VALUES = {
    'Medio', 'Alto', 'Supremo', 'Extraordinario',
    'Estrella Matutina', 'Luna Brillante', 'Sol Naciente',
    'Sin Superior', 'Páramo', 'Universo',
    'Arcano', 'Divino',
}
TEAL_KEYWORDS = {'copiado', 'fusionar', 'Fusionar', 'sin despertar', 'dormido'}

def classify_value(val):
    """Determine CSS class for a value."""
    val_clean = re.sub(r'<[^>]+>', '', val).strip()
    for g in GOLD_VALUES:
        if g in val_clean:
            return 'gold'
    for t in TEAL_KEYWORDS:
        if t in val_clean:
            return 'teal'
    # Pseudo-Arcano with percentage
    if 'Pseudo-Arcano' in val_clean:
        return 'gold'
    return ''

def normalize_box(box_html):
    """Convert any system-box format to the standard one."""
    inner = box_html

    # Extract title
    title = ''
    # Format: <span class="sys-title">⟦ Title ⟧</span>
    m = re.search(r'<(?:span|div|p) class="sys-title"[^>]*>(.*?)</(?:span|div|p)>', inner, re.DOTALL)
    if m:
        title = re.sub(r'<[^>]+>', '', m.group(1)).strip()
        title = title.strip('⟦⟧ ')
        inner = inner[:m.start()] + inner[m.end():]

    # Parse key-value pairs from various formats
    rows = []

    # Format 1: <span class="sys-name">Label:</span> Value<br>
    for m in re.finditer(r'<span class="sys-(?:name|talent)"[^>]*>(.*?)</span>\s*(.*?)(?:<br\s*/?>|$)', inner):
        label = re.sub(r'<[^>]+>', '', m.group(1)).strip().rstrip(':')
        value = re.sub(r'<[^>]+>', '', m.group(2)).strip()
        if label and value:
            rows.append((label, value))

    # Format 2: <p class="sys-talent">Label: Value</p> or <p>Label: Value</p>
    if not rows:
        for m in re.finditer(r'<p[^>]*>(.*?)</p>', inner, re.DOTALL):
            line = m.group(1)
            # Skip if it's the title we already extracted
            if 'sys-title' in m.group(0):
                continue
            clean = re.sub(r'<[^>]+>', '', line).strip()
            if ':' in clean or '：' in clean:
                parts = re.split(r'[:：]', clean, 1)
                if len(parts) == 2 and parts[0].strip() and parts[1].strip():
                    rows.append((parts[0].strip(), parts[1].strip()))
            elif clean and not title:
                title = clean

    # Format 3: plain text with <br> separators
    if not rows:
        parts = re.split(r'<br\s*/?>', inner)
        for part in parts:
            clean = re.sub(r'<[^>]+>', '', part).strip()
            if ':' in clean or '：' in clean:
                kv = re.split(r'[:：]', clean, 1)
                if len(kv) == 2 and kv[0].strip() and kv[1].strip():
                    rows.append((kv[0].strip(), kv[1].strip()))
            elif clean and not title:
                # Could be a scan line or freeform text
                if len(clean) > 50:
                    rows.append(('', clean))

    if not rows and not title:
        return None  # Can't parse, leave as-is

    # Build normalized HTML
    if not title:
        title = 'Panel de Talento'

    parts = [f'<div class="system-box">']
    parts.append(f'<div class="sys-title">{title}</div>')

    for label, value in rows:
        cls = classify_value(value)
        val_cls = f' class="sys-value{" " + cls if cls else ""}"' if label else ''
        if label:
            parts.append(f'<div class="sys-row"><span class="sys-label">{label}:</span> <span{val_cls}>{value}</span></div>')
        else:
            # Freeform text (e.g. scan results)
            parts.append(f'<div class="sys-row"><span class="sys-value">{value}</span></div>')

    parts.append('</div>')
    return '\n'.join(parts)

updated = 0
for n in range(start, end + 1):
    path = os.path.join(CHAPTERS_DIR, f'cap{n}.json')
    if not os.path.exists(path):
        continue

    d = json.load(open(path, encoding='utf-8'))
    content = d.get('content', {})
    es = content.get('es', '') if isinstance(content, dict) else (content if isinstance(content, str) else '')

    if not es or '<div class="system-box">' not in es:
        continue

    state = {'changed': False}

    def replace_box(m):
        changed = state
        full = m.group(0)
        inner = m.group(1)
        result = normalize_box(inner)
        if result and result != full:
            state['changed'] = True
            return result
        return full

    new_es = re.sub(r'<div class="system-box">(.*?)</div>', replace_box, es, flags=re.DOTALL)

    if state['changed']:
        if isinstance(content, dict):
            content['es'] = new_es
        else:
            content = {'es': new_es}
        d['content'] = content
        json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        updated += 1

print(f'✅ Normalizados: {updated} capítulos')
