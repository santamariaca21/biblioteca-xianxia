#!/usr/bin/env python3
"""
Extrae el contenido ZH limpio de un capítulo específico desde los archivos wtr.
Resuelve el problema de offset: busca 第N章 en todos los wtr files cercanos
y extrae SOLO el contenido de ese capítulo.

Uso: python3 scripts/extract-chapter.py 451
     python3 scripts/extract-chapter.py 451 > /tmp/cap451_zh.txt
     python3 scripts/extract-chapter.py 451 --json  (output como JSON)
"""
import json, os, sys, re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WTR_DIR = os.path.join(SCRIPT_DIR, '..', '..', 'scripts', 'wtr-comparisons')

# Junk patterns to strip
JUNK_PATTERNS = [
    r'【[^】]*(?:求全订|求月票|求鲜花|第\d+更)[^】]*】',
    r'·[\s·]*求鲜花[\s·]*',
    r'0[\s\.·]*求鲜花[\s\.·0]*',
    r'[\s\.·]{5,}0[\s\.·]*',
    r'石头提醒您.*',
    r'看无下划线版.*',
    r'ps[：:].*求.*',
]


def find_chapter_source(cap_num):
    """Find which wtr file contains 第N章 and return (wtr_num, content, start_pos, end_pos)."""
    # Search in wtr files near the chapter number
    for wtr_n in range(cap_num - 2, cap_num + 3):
        f = os.path.join(WTR_DIR, f'wtr_cap{wtr_n}.json')
        if not os.path.exists(f):
            continue
        try:
            data = json.load(open(f, encoding='utf-8'))
        except:
            continue

        content = data.get('content', '')
        if not content:
            continue

        # Find all chapter markers
        markers = [(m.start(), int(m.group(1))) for m in re.finditer(r'第(\d+)章', content)]

        for i, (pos, ch_num) in enumerate(markers):
            if ch_num == cap_num:
                # Found! Extract from this marker to the next DIFFERENT chapter marker (or end)
                start = pos
                end = len(content)
                for j in range(i + 1, len(markers)):
                    if markers[j][1] != cap_num:
                        end = markers[j][0]
                        break

                chapter_text = content[start:end].strip()
                return wtr_n, chapter_text

    return None, None


def clean_chapter(text):
    """Remove junk from extracted chapter text."""
    # Remove the chapter header line (第N章...)
    text = re.sub(r'^第\d+章[：: ]*[^\n]*\n?', '', text, count=1)

    # Remove junk patterns
    for pattern in JUNK_PATTERNS:
        text = re.sub(pattern, '', text)

    # Remove site artifacts
    text = re.sub(r'\([\w]{4,5}\)', '', text)  # (abcd) style artifacts
    text = re.sub(r'"[\d零一二三四五六七八九十百千万]{3,5}"', '', text)  # "四一三" style artifacts

    # Clean up whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()

    return text


def get_chapter_title(text, cap_num):
    """Extract the title from the chapter header."""
    match = re.search(rf'第{cap_num}章[：: ]*([^\n【！!\[\]]+)', text)
    if match:
        return match.group(1).strip()
    return f'Capítulo {cap_num}'


def main():
    if len(sys.argv) < 2:
        print("Uso: python3 extract-chapter.py NUMERO_CAPITULO [--json]")
        sys.exit(1)

    cap_num = int(sys.argv[1])
    json_mode = "--json" in sys.argv

    wtr_n, raw_text = find_chapter_source(cap_num)

    if raw_text is None:
        print(f"❌ 第{cap_num}章 no encontrado en ningún archivo wtr", file=sys.stderr)
        sys.exit(1)

    title = get_chapter_title(raw_text, cap_num)
    clean_text = clean_chapter(raw_text)

    if json_mode:
        result = {
            "chapter": cap_num,
            "wtr_source": f"wtr_cap{wtr_n}.json",
            "title_zh": title,
            "content_zh": clean_text,
            "chars": len(clean_text),
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"# 第{cap_num}章: {title} (from wtr_cap{wtr_n}.json, {len(clean_text)} chars)", file=sys.stderr)
        print(clean_text)


if __name__ == "__main__":
    main()
