#!/usr/bin/env python3
"""
Detecta personajes, técnicas, lugares y términos nuevos en un bloque de capítulos
recién traducidos y verifica consistencia de nombres entre capítulos del mismo bloque
Y contra el glosario maestro.

Problema que resuelve: cuando 5 agentes traducen en paralelo caps 551-555,
el mismo personaje/técnica/lugar nuevo puede aparecer con nombres distintos
en cada cap (ej: "Dominio del Lobo Plateado" vs "Dominio del Lobo de Plata").

Uso: python3 scripts/detect-new-characters.py START END
     python3 scripts/detect-new-characters.py 551 555
     python3 scripts/detect-new-characters.py 551 555 --fix  (auto-corrige mayoría clara)

Salida: reporte de términos nuevos + inconsistencias a homologar.
"""
import json, os, sys, re
from collections import defaultdict
from difflib import SequenceMatcher

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
CHAPTERS_DIR = os.path.join(PROJECT_DIR, "public/novels/i-can-copy-talents/chapters")
GLOSARIO_PATH = os.path.join(SCRIPT_DIR, "glosario-maestro.json")

# ── Patterns for named entities by category ─────────────────────────────────

# Characters: titles + capitalized name
CHAR_PREFIXES = (
    r'(?:Gran\s+)?(?:Señor\s+)?(?:Diosa?)\s+',
    r'(?:Gran\s+)?Señor(?:a)?\s+Divin[oa]\s+',
    r'(?:Gran\s+)?Emperatriz?\s+',
    r'Ancestro\s+',
    r'(?:Gran\s+)?Maestr[oa]\s+(?!(?:de|del|en)\b)',
    r'Rey\s+(?!(?:de|del|los|las|un|una)\b)',
    r'(?:Gran\s+)?Dios\s+Verdadero\s+',
    r'Venerable\s+',
    r'Patriarca\s+',
    r'Anciana?\s+',
)

# Techniques: emphasis spans or known technique words
TECH_KEYWORDS = [
    'Técnica', 'Arte', 'Palma', 'Puño', 'Sello', 'Paso', 'Danza',
    'Cuerpo', 'Forma', 'Garra', 'Tajo', 'Golpe', 'Ley', 'Dao',
    'Movimiento', 'Método', 'Secreto', 'Canon', 'Ritual',
]

# Places: domain/location words
PLACE_KEYWORDS = [
    'Dominio', 'Montaña', 'Valle', 'Palacio', 'Templo', 'Lago',
    'Base', 'Ciudad', 'Reino', 'Mundo', 'Isla', 'Torre', 'Altar',
    'Gruta', 'Cueva', 'Bosque', 'Llanura', 'Mar', 'Océano',
]

# Build regex for techniques and places (2-5 words after keyword)
TECH_PATTERN = re.compile(
    r'(?:' + '|'.join(re.escape(k) for k in TECH_KEYWORDS) + r')'
    r'(?:\s+(?:de\s+(?:la\s+|los\s+|las\s+|el\s+)?)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,4}',
    re.UNICODE
)

PLACE_PATTERN = re.compile(
    r'(?:' + '|'.join(re.escape(k) for k in PLACE_KEYWORDS) + r')'
    r'(?:\s+(?:de\s+(?:la\s+|los\s+|las\s+|el\s+)?)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,4}',
    re.UNICODE
)

CHAR_PATTERN = re.compile(
    r'(?:' + '|'.join(CHAR_PREFIXES) + r')'
    r'(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+(?:de\s+(?:la\s+|los\s+|las\s+)?)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})',
    re.UNICODE
)

# Emphasis spans — agent marks important terms here
EMPHASIS_PATTERN = re.compile(r'<span class="emphasis">([^<]+)</span>')

# NEW_TERM comments left by agents
NEW_TERM_PATTERN = re.compile(r'<!--\s*NEW_TERM:\s*([^→\-]+)[→\-]+\s*([^-\->]+)\s*-->')

# Terms to skip (not real entities)
SKIP_RE = re.compile(
    r'^(?:Nivel|Etapa|Reino\s+de|Mundo\s+de|Yuan\s+(?:Qi|Li)|'
    r'Gran\s+Perfección|Pequeña\s+Perfección|Consumación|'
    r'Talento\s+de|Técnica\s+Secreta\s+de|Arte\s+de|'
    r'Nivel\s+(?:Rey|Santo|Emperador|Divino|Eterno)|'
    r'Artista\s+Marcial|Aprendiz\s+Marcial|Forja\s+Corporal)\b',
    re.IGNORECASE
)


def load_glosario_names():
    """Load all known ES names from master glossary."""
    glosario = json.load(open(GLOSARIO_PATH, encoding='utf-8'))
    known = set()
    for cat, entries in glosario.items():
        if cat.startswith('_') or not isinstance(entries, dict):
            continue
        for zh, es in entries.items():
            if zh.startswith('_'):
                continue
            name = re.sub(r'\s*\(.*', '', str(es)).strip()
            if name:
                known.add(name.lower())
    return known


def extract_terms_from_cap(cap_num):
    """Extract named entities, techniques, places, emphasis terms and NEW_TERMs from a cap."""
    f = os.path.join(CHAPTERS_DIR, f"cap{cap_num}.json")
    if not os.path.exists(f):
        return {}, []

    cap = json.load(open(f, encoding='utf-8'))
    es = cap.get('content', {}).get('es', '') or ''

    results = defaultdict(set)  # category → set of names

    # 1. NEW_TERM comments (highest confidence — agent flagged these explicitly)
    for m in NEW_TERM_PATTERN.finditer(es):
        zh = m.group(1).strip()
        term = m.group(2).strip()
        if term and not SKIP_RE.match(term):
            results['new_terms'].add(term)

    # 2. Emphasis spans (agent used emphasis on these — likely important terms)
    text_for_emphasis = es
    for m in EMPHASIS_PATTERN.finditer(text_for_emphasis):
        term = m.group(1).strip()
        if len(term) > 3 and not SKIP_RE.match(term):
            results['emphasis'].add(term)

    # Strip HTML for pattern matching
    text = re.sub(r'<[^>]+>', ' ', es)
    text = re.sub(r'\s+', ' ', text)

    # 3. Character names
    for m in CHAR_PATTERN.finditer(text):
        name = re.sub(r'\s+', ' ', m.group().strip())
        if not SKIP_RE.match(name):
            results['chars'].add(name)

    # 4. Techniques
    for m in TECH_PATTERN.finditer(text):
        name = re.sub(r'\s+', ' ', m.group().strip())
        if len(name) > 6 and not SKIP_RE.match(name):
            results['tecnicas'].add(name)

    # 5. Places
    for m in PLACE_PATTERN.finditer(text):
        name = re.sub(r'\s+', ' ', m.group().strip())
        if len(name) > 8 and not SKIP_RE.match(name):
            results['lugares'].add(name)

    return results, []


def similarity(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def normalize_for_compare(name):
    """Strip common prefixes for similarity comparison."""
    return re.sub(r'^(?:Gran\s+)?(?:Señor\s+)?(?:Dios\s+|Diosa\s+)?', '', name, flags=re.IGNORECASE).strip()


def is_false_positive(a, b):
    """Return True if this pair is clearly a false positive, not an inconsistency."""
    al, bl = a.lower(), b.lower()
    # 1. Same string ignoring case
    if al == bl:
        return True
    # 2. Plural/singular variants
    for x, y in [(al, bl), (bl, al)]:
        if x + 's' == y or x + 'es' == y:
            return True
        # Irregular: Poder/Poderes, Dios/Dioses
        if x.endswith('r') and x + 'es' == y:
            return True
    # 3. One string is a substring of the other (honorific extensions, "técnica del X" vs "X")
    if al in bl or bl in al:
        return True
    # 4. Different entity types with same base: "Dominio de X" vs "Garra de X" vs "Montaña de X"
    place_types = {'dominio', 'montaña', 'palacio', 'templo', 'lago', 'valle',
                   'garra', 'técnica', 'arte', 'sello', 'puño', 'palma'}
    a_type = al.split()[0] if al.split() else ''
    b_type = bl.split()[0] if bl.split() else ''
    if a_type != b_type and a_type in place_types and b_type in place_types:
        return True
    # 5. Verb/noun conjugation variants
    if (al.endswith('ción') and bl.endswith('rse')) or (bl.endswith('ción') and al.endswith('rse')):
        return True
    if (al.endswith('ación') and bl.endswith('ar')) or (bl.endswith('ación') and al.endswith('ar')):
        return True
    # 6. Honorific prefix variations: "Gran Dios X" vs "Señor Dios X" vs "Gran Señor Dios X"
    # Strip all honorific prefixes and compare base
    honorific_prefixes = r'^(?:gran\s+)?(?:señor(?:a)?\s+)?(?:gran\s+)?(?:dios?\s+)?(?:señor(?:a)?\s+)?'
    a_base = re.sub(honorific_prefixes, '', al).strip()
    b_base = re.sub(honorific_prefixes, '', bl).strip()
    if a_base == b_base and a_base:
        return True
    # 7. Different entity type prefixes on same base (character vs technique vs place)
    entity_prefixes = {'dominio', 'montaña', 'palacio', 'garra', 'técnica', 'arte',
                       'puño', 'palma', 'sello', 'lago', 'templo', 'dios', 'diosa',
                       'señor', 'gran', 'emperador', 'emperatriz', 'maestro', 'ancestro'}
    a_words = set(al.split()) - entity_prefixes
    b_words = set(bl.split()) - entity_prefixes
    # If they share the same core words but have different type prefixes, likely different things
    if a_words and b_words and a_words == b_words and a_type != b_type:
        return True
    return False


def find_inconsistencies(all_names_by_cat, known_names_lower, threshold=0.75):
    """Find pairs of similar names that might be the same entity."""
    inconsistencies = []
    for cat, names in all_names_by_cat.items():
        name_list = sorted(names)
        for i in range(len(name_list)):
            for j in range(i + 1, len(name_list)):
                a, b = name_list[i], name_list[j]
                if a == b:
                    continue
                if is_false_positive(a, b):
                    continue
                # Compare normalized versions
                a_norm = normalize_for_compare(a)
                b_norm = normalize_for_compare(b)
                ratio = similarity(a_norm, b_norm)
                if ratio >= threshold:
                    inconsistencies.append((cat, a, b, ratio))
    return sorted(inconsistencies, key=lambda x: -x[3])


def apply_fix(cap_num, old_name, new_name):
    """Replace old_name with new_name in a chapter."""
    f = os.path.join(CHAPTERS_DIR, f"cap{cap_num}.json")
    cap = json.load(open(f, encoding='utf-8'))
    es = cap['content']['es']
    es_new = es.replace(old_name, new_name)
    if es_new != es:
        cap['content']['es'] = es_new
        json.dump(cap, open(f, 'w'), ensure_ascii=False, indent=2)
        return True
    return False


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    auto_fix = '--fix' in sys.argv

    if len(args) < 2:
        print("Uso: python3 detect-new-characters.py START END [--fix]")
        sys.exit(1)

    start, end = int(args[0]), int(args[1])
    print(f"=== Detección de términos nuevos caps {start}-{end} ===\n")

    known_names = load_glosario_names()

    # Collect terms per cap and globally
    terms_per_cap = {}          # cap_num → {category → set}
    all_names_by_cat = defaultdict(set)   # category → all names in block
    name_to_caps = defaultdict(list)      # name → [cap_nums]

    for n in range(start, end + 1):
        terms, _ = extract_terms_from_cap(n)
        terms_per_cap[n] = terms
        for cat, names in terms.items():
            for name in names:
                all_names_by_cat[cat].add(name)
                name_to_caps[name].append(n)

    # ── Report NEW_TERM comments ───────────────────────────────────────────
    new_terms = all_names_by_cat.get('new_terms', set())
    if new_terms:
        print("🆕 TÉRMINOS MARCADOS POR EL AGENTE (<!-- NEW_TERM -->):")
        print("-" * 60)
        for t in sorted(new_terms):
            caps = sorted(set(name_to_caps[t]))
            print(f"  '{t}' — caps {caps}")
        print()

    # ── Find inconsistencies across the block ─────────────────────────────
    # Combine chars + techniques + places for inconsistency check
    check_cats = {k: v for k, v in all_names_by_cat.items()
                  if k in ('chars', 'tecnicas', 'lugares', 'emphasis')}
    inconsistencies = find_inconsistencies(check_cats, known_names, threshold=0.75)

    if inconsistencies:
        print("⚠️  POSIBLES INCONSISTENCIAS EN ESTE BLOQUE:")
        print("-" * 60)
        fixed_count = 0
        seen_pairs = set()

        for cat, a, b, ratio in inconsistencies:
            pair_key = tuple(sorted([a, b]))
            if pair_key in seen_pairs:
                continue
            seen_pairs.add(pair_key)

            caps_a = sorted(set(name_to_caps[a]))
            caps_b = sorted(set(name_to_caps[b]))

            cat_label = {'chars': 'Personaje', 'tecnicas': 'Técnica',
                         'lugares': 'Lugar', 'emphasis': 'Término'}.get(cat, cat)

            print(f"\n  [{cat_label}] Similitud {ratio:.0%}:")
            print(f"    A: '{a}' — caps {caps_a}")
            print(f"    B: '{b}' — caps {caps_b}")

            # Determine winner by frequency
            if len(caps_a) != len(caps_b):
                winner = a if len(caps_a) > len(caps_b) else b
                loser  = b if winner == a else a
                caps_loser = caps_b if winner == a else caps_a

                print(f"    → Probable correcto: '{winner}' ({max(len(caps_a),len(caps_b))} caps)")

                if auto_fix and len(caps_loser) <= 3:
                    for cap_num in caps_loser:
                        if apply_fix(cap_num, loser, winner):
                            fixed_count += 1
                            print(f"      ✓ AUTO-FIX cap{cap_num}: '{loser}' → '{winner}'")
                else:
                    print(f"      ✎  Revisar '{loser}' en caps {caps_loser}")
            else:
                print(f"    → Frecuencia igual — revisión manual requerida")

        if auto_fix and fixed_count > 0:
            print(f"\n✅ {fixed_count} capítulos corregidos automáticamente")
    else:
        print("✅ No se detectaron inconsistencias en este bloque.")

    # ── Report genuinely new terms (not in glosario) ─────────────────────
    print(f"\n📋 TÉRMINOS NUEVOS (no en glosario) — considerar agregar:")
    print("-" * 60)
    categories = [('chars', 'Personajes'), ('tecnicas', 'Técnicas'),
                  ('lugares', 'Lugares'), ('emphasis', 'Términos enfatizados')]
    any_new = False
    for cat, label in categories:
        new_in_cat = sorted(
            n for n in all_names_by_cat.get(cat, set())
            if not any(similarity(n.lower(), k) > 0.88 for k in known_names)
            and len(n) > 4
        )
        if new_in_cat:
            any_new = True
            # Only show terms appearing in 2+ caps (more likely real terms, not one-off)
            freq = [(n, sorted(set(name_to_caps[n]))) for n in new_in_cat]
            freq_filtered = [(n, c) for n, c in freq if len(c) >= 2]
            if freq_filtered:
                print(f"\n  {label}:")
                for name, caps in sorted(freq_filtered, key=lambda x: -len(x[1])):
                    print(f"    '{name}' — {len(caps)} caps: {caps}")

    if not any_new:
        print("  (todos los términos detectados ya están en el glosario)")

    print()


if __name__ == "__main__":
    main()
