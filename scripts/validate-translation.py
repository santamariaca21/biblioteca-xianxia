#!/usr/bin/env python3
"""
Validación post-traducción: verifica calidad de capítulos traducidos.
Detecta: párrafos faltantes, chino residual, términos nuevos, inconsistencias.

Uso: python3 scripts/validate-translation.py [START] [END]
     python3 scripts/validate-translation.py --extract-new-terms [START] [END]
"""
import json, os, sys, re
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
CHAPTERS_DIR = os.path.join(PROJECT_DIR, "public/novels/i-can-copy-talents/chapters")
WTR_DIR = os.path.join(SCRIPT_DIR, '..', '..', 'scripts', 'wtr-comparisons')
GLOSARIO_PATH = os.path.join(SCRIPT_DIR, "glosario-maestro.json")

# --- Validation functions ---

def count_zh_paragraphs(wtr_path):
    """Count meaningful paragraphs in Chinese source."""
    if not os.path.exists(wtr_path):
        return -1
    with open(wtr_path) as f:
        wtr = json.load(f)
    content = wtr.get('content', '')
    lines = [l.strip() for l in content.split('\n') if l.strip()]
    # Filter site notices
    skip = ['温馨提示', '网站即将改版', '阅读进度', '求鲜花', '求收藏', '求打赏']
    lines = [l for l in lines if not any(s in l for s in skip)]
    # Filter lines without CJK
    lines = [l for l in lines if re.search(r'[\u4e00-\u9fff]', l)]
    return len(lines)


def count_es_paragraphs(es_content):
    """Count <p> tags in ES HTML content."""
    return len(re.findall(r'<p[^>]*>', es_content))


def detect_chinese_in_es(es_content):
    """Find Chinese characters in Spanish content (outside of zh sections)."""
    # Remove HTML comments (which may contain NEW_TERM markers)
    text = re.sub(r'<!--.*?-->', '', es_content)
    return re.findall(r'[\u4e00-\u9fff]+', text)


def extract_new_terms(es_content):
    """Extract <!-- NEW_TERM: 原文 → translation --> markers from content."""
    return re.findall(r'<!--\s*NEW_TERM:\s*(.+?)\s*→\s*(.+?)\s*-->', es_content)


def check_glossary_compliance(es_content, glosario):
    """Check if known bad variants appear in the text."""
    issues = []
    bad_variants = {
        'Talento de Sable': ['talento de cuchilla', 'Talento de Cuchilla', 'talento de cuchillo'],
        'bestia salvaje': ['bestia feroz', 'bestia fiera'],
        'artista marcial': ['guerrero marcial', 'practicante marcial'],
        'Tianjiao': ['prodigio celestial', 'Prodigio Celestial', 'genio celestial'],
        'nivel pico': ['nivel cumbre', 'nivel cúspide'],
        'Yuan Qi': ['energía vital', 'qi yuan', 'energía yuan'],
        'Yuan Li': ['fuerza yuan', 'poder yuan'],
        'Consumación': ['maestría'],
        'catties': [],  # checked by regex in fix-consistency
        'grieta espacial': ['grieta dimensional', 'fisura espacial'],
    }
    import re as _re
    es_lower = es_content.lower()
    for correct, variants in bad_variants.items():
        for bad in variants:
            # Use word boundary to avoid false positives (e.g. "Primigenio Celestial" matching "genio celestial")
            pattern = r'(?<!\w)' + _re.escape(bad.lower()) + r'(?!\w)'
            matches = _re.findall(pattern, es_lower)
            if matches:
                issues.append(f"'{bad}' debería ser '{correct}' ({len(matches)}x)")
    return issues


def check_cross_chapter_consistency(chapters_data):
    """Check that NEW_TERMs are consistent across chapters in the same batch."""
    term_map = {}  # zh_term → {es_translation: [cap_numbers]}
    inconsistencies = []

    for cap_num, es_content in chapters_data:
        new_terms = extract_new_terms(es_content)
        for zh, es in new_terms:
            zh = zh.strip()
            es = es.strip()
            if zh not in term_map:
                term_map[zh] = defaultdict(list)
            term_map[zh][es].append(cap_num)

    for zh, translations in term_map.items():
        if len(translations) > 1:
            detail = ", ".join(f"'{es}' (caps {caps})" for es, caps in translations.items())
            inconsistencies.append(f"'{zh}' tiene traducciones diferentes: {detail}")

    return inconsistencies, term_map


# --- Main ---

def main():
    extract_mode = "--extract-new-terms" in sys.argv
    nums = [a for a in sys.argv[1:] if not a.startswith("--")]
    start = int(nums[0]) if len(nums) > 0 else 1
    end = int(nums[1]) if len(nums) > 1 else 9999

    glosario = json.load(open(GLOSARIO_PATH))

    ok = 0
    warn = 0
    fail = 0
    all_new_terms = {}
    chapters_data = []

    for n in range(start, end + 1):
        cap_path = os.path.join(CHAPTERS_DIR, f"cap{n}.json")
        if not os.path.exists(cap_path):
            continue

        cap = json.load(open(cap_path))
        content = cap.get("content", {})
        es = content.get("es", "") if isinstance(content, dict) else (content if isinstance(content, str) else "")
        if len(es) < 500:
            continue

        issues = []
        status = "OK"

        # 1. Paragraph count validation
        wtr_path = os.path.join(WTR_DIR, f"wtr_cap{n}.json")
        zh_paras = count_zh_paragraphs(wtr_path)
        es_paras = count_es_paragraphs(es)
        if zh_paras > 0:
            ratio = es_paras / zh_paras
            # ZH has 1 line per sentence, ES groups into paragraphs → ratio ~0.4-0.7 is normal
            if ratio < 0.25 or ratio > 2.0:
                issues.append(f"PARA_FAIL: ZH={zh_paras} ES={es_paras} ratio={ratio:.2f}")
                status = "FAIL"
            elif ratio < 0.35 or ratio > 1.5:
                issues.append(f"PARA_WARN: ZH={zh_paras} ES={es_paras} ratio={ratio:.2f}")
                if status != "FAIL":
                    status = "WARN"

        # 2. Chinese remnants
        zh_remnants = detect_chinese_in_es(es)
        if zh_remnants:
            issues.append(f"ZH_RESIDUAL: {', '.join(zh_remnants[:5])}")
            status = "FAIL"

        # 3. Glossary compliance
        glossary_issues = check_glossary_compliance(es, glosario)
        if glossary_issues:
            issues.extend(glossary_issues)
            if status != "FAIL":
                status = "WARN"

        # 4. New terms
        new_terms = extract_new_terms(es)
        if new_terms:
            for zh, es_term in new_terms:
                all_new_terms[zh.strip()] = es_term.strip()
            if not extract_mode:
                issues.append(f"NEW_TERMS: {len(new_terms)} ({', '.join(zh for zh, _ in new_terms)})")

        chapters_data.append((n, es))

        # Report
        if not extract_mode:
            if issues:
                print(f"  cap{n} [{status}]: {'; '.join(issues)}")
            if status == "OK":
                ok += 1
            elif status == "WARN":
                warn += 1
            else:
                fail += 1

    # Cross-chapter consistency
    if len(chapters_data) > 1 and not extract_mode:
        inconsistencies, _ = check_cross_chapter_consistency(chapters_data)
        if inconsistencies:
            print(f"\n⚠️  INCONSISTENCIAS ENTRE CAPÍTULOS:")
            for inc in inconsistencies:
                print(f"  {inc}")

    if extract_mode:
        # Output new terms as JSON for adding to glossary
        if all_new_terms:
            print(json.dumps(all_new_terms, ensure_ascii=False, indent=2))
            print(f"\n# {len(all_new_terms)} términos nuevos detectados", file=sys.stderr)
        else:
            print("{}")
            print("# No se detectaron términos nuevos", file=sys.stderr)
    else:
        print(f"\n{'='*50}")
        print(f"OK: {ok} | WARN: {warn} | FAIL: {fail}")
        if all_new_terms:
            print(f"Términos nuevos detectados: {len(all_new_terms)}")
            for zh, es in all_new_terms.items():
                print(f"  {zh} → {es}")


if __name__ == "__main__":
    main()
