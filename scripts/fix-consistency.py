#!/usr/bin/env python3
"""
Post-traducción: aplica glosario forzado para garantizar consistencia.
Uso: python3 scripts/fix-consistency.py [START] [END]
  Sin args: aplica a TODOS los capítulos con español
  Con args: aplica solo al rango especificado
"""
import json, os, sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
CHAPTERS_DIR = os.path.join(PROJECT_DIR, "public/novels/i-can-copy-talents/chapters")
GLOSARIO_PATH = os.path.join(SCRIPT_DIR, "glosario-forzado.json")

def _num_to_spanish(n):
    """Convert integer 1-100 to Spanish text."""
    special = {
        1:'uno',2:'dos',3:'tres',4:'cuatro',5:'cinco',6:'seis',7:'siete',
        8:'ocho',9:'nueve',10:'diez',11:'once',12:'doce',13:'trece',
        14:'catorce',15:'quince',16:'dieciséis',17:'diecisiete',18:'dieciocho',
        19:'diecinueve',20:'veinte',21:'veintiuno',22:'veintidós',23:'veintitrés',
        24:'veinticuatro',25:'veinticinco',26:'veintiséis',27:'veintisiete',
        28:'veintiocho',29:'veintinueve',100:'cien'
    }
    if n in special: return special[n]
    tens = {30:'treinta',40:'cuarenta',50:'cincuenta',60:'sesenta',70:'setenta',80:'ochenta',90:'noventa'}
    t, o = (n // 10) * 10, n % 10
    if o == 0: return tens.get(t, str(n))
    ones = {1:'uno',2:'dos',3:'tres',4:'cuatro',5:'cinco',6:'seis',7:'siete',8:'ocho',9:'nueve'}
    return f"{tens.get(t, str(t))} y {ones.get(o, str(o))}"

def convert_pct_to_text(text):
    """Convert standalone numeric percentages to Spanish text."""
    import re
    def _replace(m):
        n = int(m.group(1))
        if 1 <= n <= 100:
            return _num_to_spanish(n) + ' por ciento'
        return m.group(0)
    return re.sub(r'(?<!["\w])(\d{1,3})%', _replace, text)

def load_glosario():
    """Load and flatten the glossary into ordered replacement pairs."""
    with open(GLOSARIO_PATH) as f:
        raw = json.load(f)

    # Collect all replacements, longer strings first to avoid partial matches
    replacements = []
    for category, pairs in raw.items():
        if category.startswith("_"):
            continue
        for wrong, right in pairs.items():
            replacements.append((wrong, right))

    # Sort by length descending (apply longer replacements first)
    replacements.sort(key=lambda x: -len(x[0]))
    return replacements

def fix_chapter(filepath, replacements):
    """Apply replacements to a chapter's Spanish content. Returns True if modified."""
    with open(filepath) as f:
        d = json.load(f)

    c = d.get("content", "")
    if isinstance(c, dict):
        es = c.get("es", "")
        if not es or len(es) < 500:
            return False
    else:
        es = c
        if len(es) < 500:
            return False

    original = es
    for wrong, right in replacements:
        es = es.replace(wrong, right)

    # Convert numeric percentages to text (e.g., "70%" → "setenta por ciento")
    es = convert_pct_to_text(es)

    if es != original:
        if isinstance(c, dict):
            d["content"]["es"] = es
        else:
            d["content"] = es
        with open(filepath, "w") as f:
            json.dump(d, f, indent=2, ensure_ascii=False)
        return True
    return False

def audit_chapter(filepath, replacements):
    """Check if a chapter has any terms that need fixing (dry run)."""
    with open(filepath) as f:
        d = json.load(f)

    c = d.get("content", "")
    es = c.get("es", "") if isinstance(c, dict) else c
    if len(es) < 500:
        return []

    issues = []
    for wrong, right in replacements:
        if wrong in es:
            count = es.count(wrong)
            issues.append(f"'{wrong}' → '{right}' ({count}x)")
    return issues

def main():
    replacements = load_glosario()
    print(f"Loaded {len(replacements)} replacement rules")

    start = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    end = int(sys.argv[2]) if len(sys.argv) > 2 else 9999

    # Determine mode
    audit_only = "--audit" in sys.argv

    fixed = 0
    total_issues = 0
    for i in range(start, end + 1):
        filepath = os.path.join(CHAPTERS_DIR, f"cap{i}.json")
        if not os.path.exists(filepath):
            continue

        if audit_only:
            issues = audit_chapter(filepath, replacements)
            if issues:
                print(f"  cap{i}: {', '.join(issues)}")
                total_issues += len(issues)
        else:
            if fix_chapter(filepath, replacements):
                fixed += 1

    if audit_only:
        print(f"\nAudit: {total_issues} issues found")
    else:
        print(f"\nFixed: {fixed} chapters")

if __name__ == "__main__":
    main()
