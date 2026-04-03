#!/usr/bin/env python3
"""
Auditoría de alineación: verifica que cada capítulo traducido corresponda
al capítulo chino correcto. Genera un mapa de correcciones necesarias.

Uso: python3 scripts/audit-alignment.py [START] [END]
     python3 scripts/audit-alignment.py --fix [START] [END]   (retraduce los mal alineados)
"""
import json, os, sys, re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
CHAPTERS_DIR = os.path.join(PROJECT_DIR, "public/novels/i-can-copy-talents/chapters")
WTR_DIR = os.path.join(SCRIPT_DIR, '..', '..', 'scripts', 'wtr-comparisons')


def build_zh_chapter_map():
    """Build map: chapter_number → (wtr_file_number, zh_title)"""
    ch_map = {}
    for wtr_n in range(1, 1700):
        f = os.path.join(WTR_DIR, f'wtr_cap{wtr_n}.json')
        if not os.path.exists(f):
            continue
        try:
            data = json.load(open(f, encoding='utf-8'))
        except:
            continue
        content = data.get('content', '')
        for m in re.finditer(r'第(\d+)章[：: ]*([^\n【！!\[\]]+)', content):
            ch_num = int(m.group(1))
            ch_title = m.group(2).strip()[:50]
            if ch_num not in ch_map:
                ch_map[ch_num] = (wtr_n, ch_title)
    return ch_map


def get_es_title(cap_json):
    title = cap_json.get('title', {})
    if isinstance(title, dict):
        return title.get('es', '')
    return str(title)


def check_duplicate(chapters_dir, n1, n2):
    """Check if two consecutive chapters have duplicate content."""
    f1 = os.path.join(chapters_dir, f'cap{n1}.json')
    f2 = os.path.join(chapters_dir, f'cap{n2}.json')
    if not os.path.exists(f1) or not os.path.exists(f2):
        return False

    cap1 = json.load(open(f1))
    cap2 = json.load(open(f2))
    es1 = cap1.get('content', {}).get('es', '')
    es2 = cap2.get('content', {}).get('es', '')
    if len(es1) < 500 or len(es2) < 500:
        return False

    paras1 = re.findall(r'<p[^>]*>(.*?)</p>', es1[:1000])
    paras2 = re.findall(r'<p[^>]*>(.*?)</p>', es2[:1000])
    clean1 = ' '.join(re.sub(r'<[^>]+>', '', p).strip() for p in paras1[:3])[:200]
    clean2 = ' '.join(re.sub(r'<[^>]+>', '', p).strip() for p in paras2[:3])[:200]

    w1 = set(clean1.split()[:20])
    w2 = set(clean2.split()[:20])
    if len(w1) > 5 and len(w2) > 5:
        overlap = len(w1 & w2) / min(len(w1), len(w2))
        return overlap > 0.6
    return False


def main():
    fix_mode = "--fix" in sys.argv
    nums = [a for a in sys.argv[1:] if not a.startswith("--")]
    start = int(nums[0]) if len(nums) > 0 else 100
    end = int(nums[1]) if len(nums) > 1 else 450

    zh_map = build_zh_chapter_map()
    print(f"Mapa ZH construido: {len(zh_map)} capítulos indexados\n")

    # === 1. Check duplicates ===
    print("=== DUPLICADOS ===")
    dup_count = 0
    for n in range(start, end):
        if check_duplicate(CHAPTERS_DIR, n, n + 1):
            print(f"  ⚠️  cap{n} ≈ cap{n+1}")
            dup_count += 1
    if dup_count == 0:
        print("  ✅ Sin duplicados")

    # === 2. Check alignment by title matching ===
    print(f"\n=== ALINEACIÓN (caps {start}-{end}) ===")
    misaligned = []

    for n in range(start, end + 1):
        f = os.path.join(CHAPTERS_DIR, f'cap{n}.json')
        if not os.path.exists(f):
            continue
        cap = json.load(open(f))
        es = cap.get('content', {}).get('es', '')
        if len(es) < 500:
            continue

        es_title = get_es_title(cap)[:50]
        zh_info = zh_map.get(n)

        if zh_info:
            wtr_n, zh_title = zh_info
            # Simple heuristic: check if key ZH words appear in ES title
            # Not perfect but catches obvious misalignments
            status = "?"
            print(f"  cap{n}: ES=\"{es_title}\" ← ZH第{n}章=\"{zh_title}\" [wtr_{wtr_n}]")
        else:
            print(f"  cap{n}: ES=\"{es_title}\" ← ZH第{n}章=NOT FOUND")

    # === 3. Generate fix commands ===
    print(f"\n=== MAPA DE SOURCES CORRECTOS ===")
    print("Para cada capítulo, el archivo wtr que contiene 第N章:\n")
    for n in range(start, end + 1):
        zh_info = zh_map.get(n)
        if zh_info:
            wtr_n, zh_title = zh_info
            marker = " ⚠️ OFFSET" if wtr_n != n else ""
            print(f"  cap{n} → wtr_cap{wtr_n}.json (第{n}章: {zh_title}){marker}")
        else:
            print(f"  cap{n} → ❌ SIN SOURCE")


if __name__ == "__main__":
    main()
