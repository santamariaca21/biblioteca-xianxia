Estamos traduciendo capítulos de la novela "I Can Copy Talents" al español en un proyecto Angular.

## PASO 0: CONTEXTO
Lee estos archivos:
1. CLAUDE.md
2. REGLAS_TRADUCCION.md
3. scripts/glosario-forzado.json (términos que NUNCA deben aparecer en español)

Detecta el estado actual:
```bash
python3 -c "
import json, os
last_es = 0
for i in range(5000, 0, -1):
    p = f'public/novels/i-can-copy-talents/chapters/cap{i}.json'
    if os.path.exists(p):
        d = json.load(open(p))
        c = d.get('content','')
        if isinstance(c, dict) and 'es' in c and len(c['es']) > 500:
            last_es = i; break
        elif isinstance(c, str) and len(c) > 500:
            last_es = i; break
print(f'Último cap con español: cap{last_es}')
print(f'Siguiente a traducir: cap{last_es + 1}')
"
```

## PASO 1: DESCARGA (si faltan sources)
```bash
bash scripts/download-sources.sh START END
```

## PASO 2: TRADUCCIÓN (5 agentes × 3 caps = 15 caps por bloque)

Cada agente recibe este prompt:

```
Traduce capítulos {A}, {B} y {C} de "I Can Copy Talents" al español. 
Los JSON ya tienen content.en. Agrega content.es y title.es.

REGLAS INAMOVIBLES:
- Párrafo por párrafo 1:1. NO condensar.
- «» con span class="dialogue" para diálogos
- span class="emphasis" para términos clave
- class="gold-text" para niveles dorados
- class="centered-italic" para transiciones
- div class="system-box" para paneles de talento

GLOSARIO FORZADO (usar EXACTAMENTE estos términos):
- Yuan Qi, Yuan Li (sin traducir)
- Artista Marcial, Gran Artista Marcial, Gran Maestro
- Nivel Rey, Nivel Santo, Nivel Emperador, Nivel Divino
- bestia salvaje (NO "bestia feroz")
- Tianjiao (NO "Prodigio Celestial")
- Hijo del Universo
- Emperatriz Luna (NO "Emperador Luna", NO "Emperatriz Yue")
- Emperador Hacha de Guerra (NO "Tomahawk", NO "Emperador del Hacha")
- Sol Naciente (NO "Amanecer", NO "Xiri")
- Luna Brillante (NO "Huiyue")
- Gran Perfección (NO "Dacheng")
- Pequeña Perfección (NO "Xiaocheng")
- Diez Mil Leyes (NO "Wanfa" solo)
- Tianjiao de las Diez Mil Leyes (NO "Wanfa Tianjiao")

NIVELES DE TALENTO (en orden ascendente):
Débil → Inferior → Elemental → Medio → Alto → Supremo → Extraordinario
→ Estrella Matutina → Luna Brillante → Sol Naciente → Sin Superior → Páramo → Universo
Pseudo-Arcano (SIEMPRE con %) → Arcano → Divino

NOMBRES (NUNCA cambiar ortografía):
Ye Tian, Ye Yu, Yue Ling, Xiao Xue, Xiao Jin, Xiao Zi, Mo Shaobei, Chen Dong
```

## PASO 3: CORRECCIÓN AUTOMÁTICA POST-TRADUCCIÓN
```bash
python3 scripts/fix-consistency.py START END
```
Este script aplica el glosario forzado y corrige automáticamente cualquier término que se haya escapado.

## PASO 4: VERIFICACIÓN
```bash
# Auditoría sin cambios (solo reporta)
python3 scripts/fix-consistency.py START END --audit

# Fidelidad
python3 -c "
import json, re, os
for i in range(START, END+1):
    d = json.load(open(f'public/novels/i-can-copy-talents/chapters/cap{i}.json'))
    es = d['content'].get('es','') if isinstance(d['content'], dict) else d['content']
    src_lines = len([l for l in open(f'/tmp/source_cap{i}.txt').readlines() if l.strip() and len(l.strip()) > 10])
    our = len(re.findall(r'<p[^>]*>', es))
    pct = round(our / src_lines * 100) if src_lines > 0 else 0
    print(f'cap{i}: {pct}% {\"OK\" if pct >= 90 else \"!!\"} | {len(es)} chars')
"
```

## PASO 5: METADATA + BUILD + COMMIT
```bash
# Actualizar chapters-index.json con títulos nuevos
python3 scripts/generate-en-chapters.py START END  # Si falta inglés
python3 -c "
import json, os
# Regenerar chapters-index.json
index = []
for i in range(1, 5000):
    p = f'public/novels/i-can-copy-talents/chapters/cap{i}.json'
    if not os.path.exists(p): continue
    d = json.load(open(p))
    c = d.get('content','')
    if isinstance(c, dict):
        has = any(len(v) > 500 for v in c.values())
    else:
        has = len(c) > 500
    if not has: continue
    title = d.get('title',{})
    entry = {'id': d['id'], 'n': d['number']}
    if isinstance(title, dict):
        if title.get('es'): entry['es'] = title['es']
        if title.get('en'): entry['en'] = title['en']
    elif title: entry['es'] = title
    index.append(entry)
json.dump(index, open('public/novels/i-can-copy-talents/chapters-index.json','w'), ensure_ascii=False)
n = json.load(open('public/novels/i-can-copy-talents/novel.json'))
n['chapters'] = [e['id'] for e in index]
json.dump(n, open('public/novels/i-can-copy-talents/novel.json','w'), indent=2, ensure_ascii=False)
idx = json.load(open('public/novels/index.json'))
idx[0]['totalChapters'] = len(index)
json.dump(idx, open('public/novels/index.json','w'), indent=2, ensure_ascii=False)
print(f'Updated: {len(index)} chapters')
"

npx ng build
git add public/novels/ && git commit -m "feat: traducción capX-capY" && git push
```

## PASO 6: SIGUIENTE BLOQUE
Repetir desde paso 2. El script de corrección garantiza consistencia.
