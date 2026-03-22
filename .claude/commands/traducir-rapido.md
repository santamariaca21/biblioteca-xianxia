Estamos traduciendo capítulos de la novela "I Can Copy Talents" al español en un proyecto Angular.

## PASO 0: CONTEXTO
Lee estos archivos:
1. CLAUDE.md
2. REGLAS_TRADUCCION.md

Detecta el estado actual:
```bash
# Último capítulo traducido (con contenido real, no templates)
python3 -c "
import json, os
for i in range(300, 0, -1):
    p = f'public/novels/i-can-copy-talents/chapters/cap{i}.json'
    if os.path.exists(p):
        d = json.load(open(p))
        if len(d.get('content','')) > 500:
            print(f'Último capítulo traducido: cap{i}')
            break
"
# Sources disponibles
ls /tmp/source_cap*.txt 2>/dev/null | wc -l
```

## PASO 1: DESCARGA (si faltan sources)
Descarga los siguientes 30 capítulos que no tengan source:
```bash
for ch in $(seq INICIO FIN); do
  [ -f /tmp/source_cap${ch}.txt ] && continue
  curl -s "https://www.fanmtl.com/novel/i-can-copy-talents_${ch}.html" | python3 -c "
import sys, re
html = sys.stdin.read()
match = re.search(r'<div class=\"chapter-content\">(.*?)</div>\s*<div class=\"chapternav', html, re.DOTALL)
if match:
    content = match.group(1)
    clean = re.sub(r'<[^>]+>', '\n', content)
    lines = [l.strip() for l in clean.split('\n') if l.strip() and 'Feilu' not in l and 'VIP' not in l and 'rush immediately' not in l and 'brand upgrade' not in l and 'Event Period' not in l]
    for l in lines: print(l)
" > /tmp/source_cap${ch}.txt
done
```

## PASO 2: FASE 1 — TRADUCCIÓN PURA (5 agentes × 3 caps = 15 caps)
Lanza 5 agentes en paralelo. Cada agente traduce 3 capítulos. Los agentes SOLO se encargan de:
- Leer el source de /tmp/source_cap{N}.txt
- Traducir párrafo por párrafo al español (fiel al source, NO condensar)
- Escribir el JSON con content, title, y un characters array básico
- NO se preocupan por talentos/stats detallados (eso lo hace el script post)

Prompt para cada agente:
```
Traduce capítulos {A}, {B} y {C} de "I Can Copy Talents" al español. Escribe 3 JSONs.
Para CADA uno: Lee source /tmp/source_cap{N}.txt. Escribe en public/novels/i-can-copy-talents/chapters/cap{N}.json

REGLAS: Párrafo por párrafo 1:1. No condensar. «» con span class="dialogue". span class="emphasis" para términos. class="gold-text" para dorado. class="centered-italic" para transiciones. div class="system-box" para paneles de talento.

NIVELES: Weak=Débil, Inferior=Inferior, Elementary=Elemental, Medium=Medio, High/Advanced=Alto, Top=Supremo, Extraordinary=Extraordinario, Morning Star=Estrella Matutina, Bright Moon=Luna Brillante, Dawn/Sun-Rising=Sol Naciente

GLOSARIO: Yuan Qi, Yuan Li, Artista Marcial, Artista Marcial Élite, Gran Artista Marcial, Gran Maestro, nivel rey, nivel santo, nivel emperador, bestia salvaje, poder de elefante, poder de dragón, catties

JSON mínimo: {"id":"cap{N}","number":{N},"title":"...","content":"...HTML traducido...","talents":[],"stats":{"label":"Stats — Cap. {N}","reino":"...","reinoClass":"gold","talento":"...","talentoClass":"gold","fuerza":"...","ubicacion":"...","abilities":[],"copiedTalents":"...","edad":"~17 años","golpeMax":"..."},"characters":["ye-tian",...]}

Lista TODOS los personajes que aparecen en characters[]. Actualiza título, reino, fuerza, ubicacion, golpeMax según lo que pase en el capítulo.
```

## PASO 3: FASE 2 — POST-PROCESAMIENTO AUTOMÁTICO (script)
Después de que los 15 capítulos estén traducidos, ejecuta este script para:
1. Copiar los talentos del último capítulo completo al array de los nuevos
2. Detectar cambios de talento en el contenido traducido (buscar "copiar", "fusionar", "talento", "nivel")
3. Verificar fidelidad
4. Actualizar metadata (novel.json, index.json)
5. Crear/actualizar appearances en characters.json

```python
import json, re, os

LAST_COMPLETE = X  # último cap con talentos correctos
NEW_START = X + 1
NEW_END = X + 15

# 1. Copiar talentos base del último cap completo
base = json.load(open(f"public/novels/i-can-copy-talents/chapters/cap{LAST_COMPLETE}.json"))
base_talentos = base["stats"]["talentos"]

for i in range(NEW_START, NEW_END + 1):
    path = f"public/novels/i-can-copy-talents/chapters/cap{i}.json"
    d = json.load(open(path))
    if not d["stats"].get("talentos") or len(d["stats"]["talentos"]) < 10:
        d["stats"]["talentos"] = [t.copy() for t in base_talentos]
    json.dump(d, open(path, "w"), indent=2, ensure_ascii=False)

# 2. Verificar fidelidad
def count_src(fp):
    with open(fp) as f:
        return len([l.strip() for l in f.readlines() if l.strip() and (len(l.strip()) > 10 or l.strip().startswith('"'))])
def count_trad(content):
    return len(re.findall(r'<p[^>]*>', content))

for i in range(NEW_START, NEW_END + 1):
    d = json.load(open(f"public/novels/i-can-copy-talents/chapters/cap{i}.json"))
    src = count_src(f"/tmp/source_cap{i}.txt")
    our = count_trad(d["content"])
    pct = round(our / src * 100)
    print(f"cap{i}: {pct}% {'OK' if pct >= 90 else '!!'}")

# 3. Actualizar metadata
n = json.load(open("public/novels/i-can-copy-talents/novel.json"))
n["chapters"] = [f"cap{i}" for i in range(1, NEW_END + 1)]
json.dump(n, open("public/novels/i-can-copy-talents/novel.json", "w"), indent=2, ensure_ascii=False)
idx = json.load(open("public/novels/index.json"))
idx[0]["totalChapters"] = NEW_END
json.dump(idx, open("public/novels/index.json", "w"), indent=2, ensure_ascii=False)

# 4. Validar personajes
data = json.load(open("public/novels/i-can-copy-talents/characters.json"))
for i in range(NEW_START, NEW_END + 1):
    ch = json.load(open(f"public/novels/i-can-copy-talents/chapters/cap{i}.json"))
    for cid in ch.get("characters", []):
        found = any(c["id"] == cid and any(a["chapterNumber"] == i for a in c["chapterAppearances"]) for c in data["characters"])
        if not found:
            exists = any(c["id"] == cid for c in data["characters"])
            print(f"  !! cap{i}: {cid} {'NO EXISTE' if not exists else 'sin appearance'}")
```

## PASO 4: CORRECCIÓN MANUAL
Revisa la salida del script. Para cada problema:
- Personaje NO EXISTE → créalo en characters.json con bio mínima
- Sin appearance → agrégala
- Talento nuevo detectado en contenido → actualiza el array de talentos desde ese cap en adelante
- Fidelidad < 90% → rehaz el capítulo

## PASO 5: BUILD + COMMIT
```bash
npx ng build
git add public/novels/
git commit -m "feat: traducción capítulos {NEW_START}-{NEW_END}"
git push
```

## PASO 6: SIGUIENTE BLOQUE
Mientras haces el paso 4-5, puedes lanzar el siguiente bloque de 15 caps (PIPELINE).
Repite desde el paso 2 con los siguientes capítulos.

---
IMPORTANTE: No sacrifiques calidad por velocidad. Si un capítulo tiene problemas, rehazlo antes de seguir.
