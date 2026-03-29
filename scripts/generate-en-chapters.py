#!/usr/bin/env python3
"""Generate chapter JSON files with English content from downloaded sources."""
import json, os, re, sys

def format_english_source(source_path):
    """Convert raw English text to formatted HTML."""
    if not os.path.exists(source_path):
        return None
    with open(source_path) as f:
        lines = [l.strip() for l in f.readlines() if l.strip()]

    skip_terms = ['Feilu', 'VIP', 'rush immediately', 'brand upgrade', 'Event Period']
    emphasis_terms = ['Yuan Qi', 'Yuan Li', 'Tianjiao', 'Child of the Universe', 'Son of the Universe',
                      'fierce beast', 'spatial crack', 'beast tide']
    gold_levels = ['top', 'extraordinary', 'morning star', 'bright moon', 'dawn', 'sun',
                   'peerless', 'no superior', 'desolate', 'god', 'divine', 'arcane', 'mystery',
                   'pseudo-myster', 'pseudo-arcan', 'wasteland', 'universe', 'celestial']

    result = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if any(s in line for s in skip_terms) or line.startswith('ps:') or line.startswith('PS:'):
            i += 1
            continue

        # Talent panel
        panel_match = re.match(r'^(Human|Species|Beast|H):\s*(.+)', line)
        if panel_match:
            etype, ename = panel_match.group(1), panel_match.group(2)
            talents = []
            j = i + 1
            while j < len(lines):
                tmatch = re.match(r'^(.+?[Tt]alent|[Bb]loodline[^:]*|[Vv]ajra[^:]*|[Ii]ron [Aa]rmor[^:]*):\s*(.+)', lines[j])
                if tmatch:
                    tname, tvalue = tmatch.group(1).strip(), tmatch.group(2).strip()
                    if any(gl in tvalue.lower() for gl in gold_levels):
                        tvalue = f'<span class="gold-text">{tvalue}</span>'
                    talents.append(f'<span class="sys-talent">{tname}:</span> {tvalue}')
                    j += 1
                else:
                    break
            if talents:
                box = f'<div class="system-box"><span class="sys-title">Talent Identification</span><br>'
                box += f'<span class="sys-name">{etype}:</span> {ename}<br>'
                box += '<br>'.join(talents) + '</div>'
                result.append(box)
                i = j
                continue

        # Bracketed talent
        bracket = re.match(r'^\[(.+?)\]$', line)
        if bracket:
            inner = bracket.group(1)
            if any(gl in inner.lower() for gl in gold_levels):
                inner = f'<span class="gold-text">{inner}</span>'
            result.append(f'<p class="centered-highlight">{inner}</p>')
            i += 1
            continue

        # Dialogue
        if line.startswith('"') or line.startswith('\u201c') or line.startswith("'"):
            escaped = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            for term in emphasis_terms:
                escaped = escaped.replace(term, f'<span class="emphasis">{term}</span>')
            result.append(f'<p><span class="dialogue">{escaped}</span></p>')
            i += 1
            continue

        # Transitions
        if line in ['......', '...', '···', '------'] or (len(line) < 12 and not line[0].isalpha()):
            result.append(f'<p class="centered-italic">{line}</p>')
            i += 1
            continue

        # Sound effects
        if len(line) < 20 and (line.isupper() or line.endswith('!!!') or line.endswith('!!')):
            result.append(f'<p class="centered-italic">{line}</p>')
            i += 1
            continue

        # Regular paragraph
        escaped = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        for term in emphasis_terms:
            escaped = escaped.replace(term, f'<span class="emphasis">{term}</span>')
        result.append(f'<p>{escaped}</p>')
        i += 1

    return '\n'.join(result)


def generate_chapter(ch_num, source_dir="/tmp", output_dir="public/novels/i-can-copy-talents/chapters"):
    """Generate a chapter JSON with English content."""
    source_path = f"{source_dir}/source_cap{ch_num}.txt"
    output_path = f"{output_dir}/cap{ch_num}.json"

    en_html = format_english_source(source_path)
    if not en_html:
        return False

    # Check if file exists and already has Spanish
    if os.path.exists(output_path):
        d = json.load(open(output_path))
        if isinstance(d.get("content"), dict):
            d["content"]["en"] = en_html
            if "en" not in d.get("title", {}):
                if isinstance(d["title"], dict):
                    d["title"]["en"] = f"Chapter {ch_num}"
        else:
            es_content = d.get("content", "")
            d["content"] = {"en": en_html}
            if es_content and len(es_content) > 500:
                d["content"]["es"] = es_content
            es_title = d.get("title", f"Chapter {ch_num}")
            d["title"] = {"en": f"Chapter {ch_num}"}
            if isinstance(es_title, str) and es_title != f"Capítulo {ch_num}":
                d["title"]["es"] = es_title
    else:
        d = {
            "id": f"cap{ch_num}",
            "number": ch_num,
            "title": {"en": f"Chapter {ch_num}"},
            "content": {"en": en_html},
            "stats": {
                "label": f"Stats - Ch. {ch_num}",
                "reino": "",
                "reinoClass": "gold",
                "talento": "",
                "talentoClass": "gold",
                "fuerza": "",
                "ubicacion": "",
                "abilities": [],
                "copiedTalents": "",
                "talentos": [],
                "edad": "",
                "golpeMax": "",
                "dominioCerebral": ""
            }
        }

    json.dump(d, open(output_path, "w"), indent=2, ensure_ascii=False)
    return True


if __name__ == "__main__":
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 609
    end = int(sys.argv[2]) if len(sys.argv) > 2 else 3613

    created = 0
    for ch in range(start, end + 1):
        if generate_chapter(ch):
            created += 1

    print(f"Generated {created} chapters (cap{start}-cap{end})")
