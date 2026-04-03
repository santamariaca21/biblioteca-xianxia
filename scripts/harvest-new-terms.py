#!/usr/bin/env python3
"""
Extrae NEW_TERMs de capítulos traducidos y los agrega al glosario-maestro.json.
Ejecutar después de cada bloque de traducción.

Uso: python3 scripts/harvest-new-terms.py [START] [END]
  Ej: python3 scripts/harvest-new-terms.py 110 114
"""
import json, os, sys, re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
CHAPTERS_DIR = os.path.join(PROJECT_DIR, "public/novels/i-can-copy-talents/chapters")
GLOSARIO_PATH = os.path.join(SCRIPT_DIR, "glosario-maestro.json")

# Classification rules for auto-categorizing new terms
NAME_SURNAMES = set('赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜'
                    '戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐')
TECH_ENDS = ['术', '法', '诀', '功', '阵', '拳', '掌', '技']
PLACE_ENDS = ['城', '国', '域', '界', '星', '塔', '殿', '宫', '谷', '山', '海', '堡', '基地']
TALENT_MARKER = '天赋'
BEAST_CHARS = set('兽龙蛇狼虎豹鹰猿蟒蜥蚁')


def classify_term(zh, es):
    """Guess which glossary category a term belongs to."""
    if len(zh) <= 3 and zh[0] in NAME_SURNAMES:
        return "nombres"
    if TALENT_MARKER in zh:
        return "terminos_cultivo"
    if any(zh.endswith(s) for s in TECH_ENDS):
        return "tecnicas"
    if any(zh.endswith(s) for s in PLACE_ENDS):
        return "zonas"
    if any(c in zh for c in BEAST_CHARS):
        return "terminos_cultivo"
    if '家' in zh or '族' in zh or '会' in zh or '殿' in zh:
        return "organizaciones"
    # Default
    return "terminos_cultivo"


def main():
    nums = [a for a in sys.argv[1:] if not a.startswith("--")]
    start = int(nums[0]) if len(nums) > 0 else 1
    end = int(nums[1]) if len(nums) > 1 else 9999

    # Load current glossary
    glosario = json.load(open(GLOSARIO_PATH, encoding='utf-8'))

    # Collect all known ZH terms
    known_zh = set()
    for cat, entries in glosario.items():
        if cat.startswith('_') or not isinstance(entries, dict):
            continue
        for zh in entries:
            if not zh.startswith('_'):
                known_zh.add(zh)

    # Filter: skip entries that are clearly not glossary terms
    def is_valid_term(zh, es):
        # Skip onomatopoeia, exclamations, full sentences
        if '！' in zh or '？' in zh or '!' in zh:
            return False
        if len(zh) > 8:  # Too long = probably a phrase, not a term
            return False
        if len(zh) < 2:
            return False
        if 'onomatopeya' in es.lower() or 'pensamiento' in es.lower():
            return False
        return True

    # Scan chapters for NEW_TERMs
    new_terms = {}  # zh → (es, category, [caps])
    for n in range(start, end + 1):
        f = os.path.join(CHAPTERS_DIR, f"cap{n}.json")
        if not os.path.exists(f):
            continue
        try:
            cap = json.load(open(f, encoding='utf-8'))
        except:
            continue

        content = cap.get("content", {})
        es = content.get("es", "") if isinstance(content, dict) else ""
        if not es:
            continue

        terms = re.findall(r'<!--\s*NEW_TERM:\s*(.+?)\s*→\s*(.+?)\s*-->', es)
        for zh, es_term in terms:
            zh = zh.strip()
            es_term = es_term.strip()
            if zh in known_zh:
                continue
            if not is_valid_term(zh, es_term):
                continue
            if zh not in new_terms:
                cat = classify_term(zh, es_term)
                new_terms[zh] = (es_term, cat, [])
            new_terms[zh][2].append(n)

    if not new_terms:
        print("No hay términos nuevos para agregar.")
        return

    # Add to glossary
    added = 0
    for zh, (es_term, cat, caps) in sorted(new_terms.items()):
        if cat not in glosario:
            glosario[cat] = {}
        if zh not in glosario[cat]:
            glosario[cat][zh] = es_term
            added += 1
            print(f"  + [{cat}] {zh} → {es_term} (caps {caps})")

    if added > 0:
        json.dump(glosario, open(GLOSARIO_PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        print(f"\n✅ {added} términos agregados al glosario ({GLOSARIO_PATH})")

        # Also remove the NEW_TERM comments from chapters (they're now in the glossary)
        cleaned = 0
        for n in range(start, end + 1):
            f = os.path.join(CHAPTERS_DIR, f"cap{n}.json")
            if not os.path.exists(f):
                continue
            try:
                cap = json.load(open(f, encoding='utf-8'))
            except:
                continue
            content = cap.get("content", {})
            es = content.get("es", "") if isinstance(content, dict) else ""
            new_es = re.sub(r'<!--\s*NEW_TERM:.*?-->\s*', '', es)
            if new_es != es:
                content["es"] = new_es
                cap["content"] = content
                json.dump(cap, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
                cleaned += 1
        if cleaned:
            print(f"🧹 Limpiados comentarios NEW_TERM de {cleaned} capítulos")
    else:
        print("Todos los términos ya estaban en el glosario.")


if __name__ == "__main__":
    main()
