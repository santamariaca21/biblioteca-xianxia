# Reglas de Traducción — Biblioteca Xianxia

## Convenciones Generales

1. **Idioma destino**: Español neutro (latinoamericano). Evitar regionalismos fuertes.
2. **Nombres propios**: Los nombres de personajes se mantienen en su romanización pinyin original (Ye Tian, Ye Yu, Chen Dong, Zhang Bao). NO traducirlos.
3. **Títulos y honoríficos**: Traducir al español cuando sea posible.
   - 哥 → "Hermano" (mayor)
   - 妹 → "Hermana" (menor)
   - 师父 → "Maestro"
   - 前辈 → "Senior"
   - 老师 → "Profesor" / "Instructor"
4. **Términos de cultivo**: Usar la traducción consistente definida abajo. Una vez elegida, NO cambiarla.

## Glosario de Términos Fijos

| Chino        | Inglés (fuente)        | Español (fijo)              |
|-------------|------------------------|----------------------------|
| 元气         | Yuan Qi                | Yuan Qi (sin traducir)      |
| 天赋         | Talent                 | Talento                     |
| 修炼天赋     | Cultivation Talent     | Talento de Cultivo           |
| 武者学徒     | Martial Apprentice     | Aprendiz Marcial             |
| 武者         | Martial Artist         | Artista Marcial              |
| 武者精英     | Elite Martial Artist   | Artista Marcial Élite        |
| 大武者       | Great Martial Artist   | Gran Artista Marcial         |
| 弱          | Weak                   | Débil                        |
| 下等         | Inferior               | Inferior                     |
| 初等         | Primary/Elementary     | Primario                     |
| 中等         | Medium/Intermediate    | Medio                        |
| 高等         | High/Advanced          | Alto                         |
| 冰天赋       | Ice Talent             | Talento de Hielo             |
| 火天赋       | Fire Talent            | Talento de Fuego             |
| 剑天赋       | Sword Talent           | Talento de Espada            |
| 复制天赋     | Copy Talent            | Talento de Copia             |
| 锻体         | Body Forging           | Forja Corporal               |
| 基地         | Base                   | Base                         |
| 学院         | Academy                | Academia                     |
| 凶兽         | Fierce Beast           | Bestia Salvaje               |
| 空间裂缝     | Spatial Crack          | Grieta Espacial              |
| 力量(斤)     | Catties (force)        | Catties (sin traducir)       |

## Reglas de Formato en el HTML/JSON

1. **Diálogos**: Siempre entre comillas francesas `«»` y envueltos en `<span class="dialogue">`.
2. **Términos importantes**: Envolver en `<span class="emphasis">` (Yuan Qi, nombres de talentos, nombres de reinos).
3. **Ventanas del sistema**: Usar `<div class="system-box">` con las clases `sys-title`, `sys-name`, `sys-talent`.
4. **Texto centrado destacado**: Usar `class="centered-highlight"`.
5. **Advertencias**: Usar `class="centered-warning"`.
6. **Texto cursiva centrado**: Usar `class="centered-italic"`.
7. **Texto dorado fuerte**: Usar `class="gold-text"`.

## Reglas de Contenido por Capítulo

Cada archivo `capX.json` debe contener:

1. **content**: El HTML del capítulo traducido.
2. **talents**: Lista de talentos descubiertos/mencionados en ESE capítulo.
3. **stats**: Estado del protagonista (Ye Tian) al FINAL del capítulo.
4. **characters**: Lista de IDs de personajes que aparecen en ese capítulo (se vinculan al JSON de personajes).

## Reglas de Personajes

Cada personaje en `characters.json` tiene una ficha tipo wiki con la siguiente estructura:

### Campos obligatorios
- `id`: Identificador único (kebab-case, ej: `ye-tian`)
- `name`: Nombre romanizado en pinyin
- `role`: `protagonista` | `principal` | `secundario` | `mencion`
- `bio`: Biografía completa en texto plano (se muestra en la página de personajes)
- `info`: Tabla de datos clave (tipo wiki sidebar)
- `abilities`: Array de habilidades/talentos
- `relationships`: Array de relaciones con otros personajes
- `chapterAppearances`: Array de apariciones con nota por capítulo

### Campos opcionales
- `nameChinese`: Nombre en caracteres chinos
- `image`: Nombre del archivo de imagen (ej: `ye-tian.webp`). Si no existe, se usa `placeholder.svg`

### Estructura de `info` (tabla wiki)
```json
{
  "edad": "15 años",
  "genero": "Masculino",
  "reino": "Aprendiz Marcial",
  "talentoCultivo": "Medio (copiado)",
  "afiliacion": "Quinta Academia de Linhai",
  "ubicacion": "Base Linhai",
  "estado": "Vivo",
  "primerAparicion": "Capítulo 1"
}
```

### Estructura de `abilities`
```json
{
  "name": "Talento de Copia",
  "type": "copy",           // cultivation, ice, copy, sword, fire, etc.
  "rank": "—",              // opcional: rango o nivel
  "status": "activo",       // activo | dormido | copiado | perdido
  "description": "...",     // descripción de la habilidad
  "acquiredChapter": 1      // opcional: capítulo donde se adquiere
}
```

### Estructura de `relationships`
```json
{
  "characterId": "ye-yu",
  "characterName": "Ye Yu",
  "type": "Hermana menor"
}
```

### Estructura de `chapterAppearances`
```json
{
  "chapterId": "cap1",
  "chapterNumber": 1,
  "note": "Descripción de lo que ocurre con el personaje en este capítulo",
  "statsSnapshot": {          // opcional: stats en ese momento
    "reino": "Aprendiz Marcial",
    "talento": "Débil",
    "fuerza": "Sin entrenar",
    "ubicacion": "Habitación / Linhai"
  }
}
```

### Reglas de visualización
1. **En vista de capítulo** (modo compacto): Solo mostrar la nota del capítulo actual o el más reciente hasta ese capítulo.
2. **En página de personajes** (modo wiki): Mostrar biografía completa, tabla de info, habilidades con sus estados, relaciones, y línea temporal completa.
3. Imágenes en `public/novels/{novelId}/characters/`. Si no existe la imagen, se muestra un placeholder SVG.
4. Cada personaje tiene un color de acento según su rol: dorado (protagonista), teal (principal), gris (secundario), púrpura (mención).

### Al agregar o actualizar personajes
1. Actualizar `info` con los datos más recientes conocidos.
2. Agregar nuevas `abilities` cuando se descubren. Actualizar `status` y `rank` si cambian.
3. Agregar `relationships` cuando se establecen nuevas relaciones.
4. Agregar siempre una nueva entrada en `chapterAppearances` por cada capítulo donde aparece el personaje, con `statsSnapshot` cuando haya cambios relevantes.
5. La `bio` debe reflejar TODO lo conocido hasta el último capítulo traducido.

## Reglas de Calidad

1. Mantener el tono narrativo: serio, épico, con toques de humor interno del protagonista.
2. Los pensamientos internos van en diálogo (comillas francesas) con contexto claro.
3. **CRÍTICO: Respetar TODOS los párrafos del original. NO fusionar, condensar ni omitir párrafos.** Cada línea del source debe tener su correspondiente en la traducción. La cantidad de párrafos traducidos debe coincidir con el source (~90%+ mínimo).
4. Revisar que cada nombre propio sea consistente con el glosario.
5. No agregar información que no esté en el original.
6. Los capítulos se numeran secuencialmente: cap1, cap2, cap3...
7. **Porcentaje de fidelidad**: Después de traducir, SIEMPRE calcular el % de fidelidad comparando párrafos del source vs traducción. El mínimo aceptable es **90%**. Si un capítulo queda por debajo, debe ser rehecho.
   - **OK** (>=90%): Aceptable. Diferencias menores por fragmentos HTML rotos en el source que se integran naturalmente.
   - **~** (80-89%): Revisión recomendada. Probablemente hay párrafos condensados.
   - **!!** (<80%): Debe rehacerse. Contenido faltante significativo.
8. **CRÍTICO: Progresión de niveles de talento**. Al traducir, verificar SIEMPRE que los niveles de talento sean correctos según la progresión de la historia. NO inventar ni confundir niveles. Referencia de la progresión de Ye Tian:
   - **Talento de Cultivo**: Débil (cap1-3) → Medio (cap4-18) → Alto (cap19-48, copiado de Yue Ling) → Supremo (cap49+, copiado de Sun Feng)
   - **Velocidad**: Elemental (cap5-42) → Supremo (cap43+, copiado de lobo leopardo dorado)
   - **Sable**: Medio (cap8+, copiado de Li Yunxing)
   - **Sombra**: Elemental (cap15+, copiado de Li Cun)
   - **Curación**: Supremo (cap25+, copiado de medusa faro)
   - **Fuerza**: Alto (cap34+, copiado de hormiga de poder divino)
   - **Defensa**: Medio (cap57+, copiado de pitón de escamas negras)
   - **Copia**: Contacto (cap1-45) → A distancia (cap46+, tras fruto dorado)

   Traducción de niveles (inglés → español): Weak=Débil, Inferior=Inferior, Primary/Elementary=Primario/Elemental, Medium=Medio, High/Advanced=**Alto** (NO "Superior"), Top=**Supremo** (NO "Superior")

   En el array `talentos` de stats: `estado` se deja vacío `""` para talentos activos. Solo usar `"por fusionar"`, `"copiado"` o `"dormido"` cuando aplique.

9. **No contar como párrafos**: etiquetas HTML decorativas (system-box, centered-italic, centered-highlight, etc.) NO cuentan en el conteo de fidelidad. Solo contar `<p>` tags.
9. **Fragmentos rotos del source**: Algunas líneas del source son artefactos de extracción HTML (ej: "The" + siguiente línea). Estos NO son párrafos reales y se integran naturalmente. Si el % supera 100%, es por esto.
10. **Script de verificación de fidelidad** (ejecutar después de cada bloque de traducción):
```bash
python3 << 'PYEOF'
import json, re
def count_src(fp):
    with open(fp) as f:
        lines = [l.strip() for l in f.readlines() if l.strip()]
    return len([l for l in lines if len(l) > 10 or l.startswith('"')])
def count_trad(content):
    return len(re.findall(r'<p[^>]*>', content))
for i in range(1, N+1):  # N = último capítulo
    d = json.load(open(f"public/novels/i-can-copy-talents/chapters/cap{i}.json"))
    src = count_src(f"/tmp/source_cap{i}.txt")
    our = count_trad(d["content"])
    pct = round(our / src * 100)
    st = "OK" if pct >= 90 else "~" if pct >= 80 else "!!"
    print(f"cap{i}: src={src} trad={our} fidelidad={pct}% {st}")
PYEOF
```

## Obtención del Texto Fuente

### Método preferido: curl directo
Usar `curl` para extraer el texto del chapter-content div:
```bash
curl -s "https://www.fanmtl.com/novel/{novel-slug}_{chapter}.html" | python3 -c "
import sys, re
html = sys.stdin.read()
match = re.search(r'<div class=\"chapter-content\">(.*?)</div>\s*<div class=\"chapternav', html, re.DOTALL)
if match:
    content = match.group(1)
    clean = re.sub(r'<[^>]+>', '\n', content)
    lines = [l.strip() for l in clean.split('\n') if l.strip()]
    for l in lines:
        print(l)
"
```

### Método alternativo: WebFetch (agente)
WebFetch a veces es bloqueado por copyright del modelo intermedio. Si solo devuelve un resumen, **NO traducir desde el resumen**. En su lugar:
1. Intentar con `curl` directo (método preferido).
2. Si `curl` también falla, **informar al usuario** para que pegue el texto manualmente.
3. **NUNCA** inventar o rellenar contenido que no proviene del source.

### Verificación post-traducción
Después de crear un capítulo, ejecutar:
```bash
# Contar párrafos del source
curl -s "URL" | python3 -c "..." | wc -l
# Contar elementos de la traducción
python3 -c "import json,re; d=json.load(open('capX.json')); print(len(re.findall(r'<p|<div class=\"system', d['content'])))"
```
Si la diferencia es >15%, el capítulo necesita revisión.

## Proceso para Agregar un Nuevo Capítulo

1. Obtener el texto en inglés de la fuente usando `curl` (ver sección anterior).
2. Traducir siguiendo las reglas del glosario y formato. **Párrafo por párrafo, sin omitir.**
3. Crear `capX.json` con:
   - `content`: HTML del capítulo traducido
   - `talents`: talentos descubiertos/mencionados
   - `stats`: estado de Ye Tian al final del capítulo
   - `characters`: array de IDs de personajes que aparecen
4. Actualizar `novel.json`:
   - Agregar el ID del capítulo al array `chapters`
   - **Si se revelan nuevos reinos/niveles**: actualizar `realms` (ej: Gran Maestro, Nivel Rey)
   - **Si se revelan nuevos rangos de talento**: actualizar `talentRanks` (ej: Extraordinario, Estrella Matutina)
   - **Si cambia la base/ubicación principal**: actualizar `baseInfo` (ej: Linhai → Mar Demonio)
   - **Si se revela info del mundo**: actualizar `worldInfo` (ej: reinos secretos, Pabellón Marcial)
5. Actualizar `characters.json`:
   - Agregar personajes nuevos con ficha wiki completa (info, abilities, relationships)
   - Agregar `chapterAppearances` a personajes existentes
   - Actualizar `info`, `abilities`, `relationships` si hay cambios
   - Actualizar `bio` para incluir lo nuevo revelado
6. Actualizar `public/novels/index.json` con el nuevo `totalChapters`.
7. Verificar con `ng build` que compila correctamente.
8. **Cada 10-20 capítulos**: revisar que `novel.json` refleje toda la info revelada hasta ese punto.

## Proceso para Agregar una Nueva Novela

1. Crear carpeta `public/novels/{novel-id}/`.
2. Crear `novel.json` con metadatos (worldInfo, realms, talentRanks, baseInfo, chapters[]).
3. Crear `characters.json` con los personajes (ficha wiki completa).
4. Crear carpeta `chapters/` con los `capX.json`.
5. Crear carpeta `characters/` para las imágenes.
6. Agregar la novela al `public/novels/index.json`.

## Tecnología y Componentes

- **Framework**: Angular 21 (standalone components, signals)
- **Iconos**: Componente `app-icon` con SVGs inline (NO usar emojis en la UI)
- **Temas**: CSS custom properties (`--t-*`) inyectadas via `ngStyle`. 5 temas: Oscuro, Noche, Sepia, Claro, Pergamino
- **Datos**: JSON estáticos en `public/novels/`, cargados via `HttpClient`
- **Despliegue**: Vercel con `vercel.json` configurado
- **Estructura de componentes**:
  - `icon/icon.ts` — iconos SVG reutilizables
  - `header/header.ts` — header global
  - `chapter-sidebar/` — índice de capítulos (sidebar izquierdo)
  - `stats-sidebar/` — stats de Ye Tian (sidebar derecho)
  - `character-card/` — tarjeta de personaje (compacto en capítulo, wiki en página de personajes)
  - `settings-panel/` — panel de ajustes (fondo, letra, visibilidad)
  - `pages/library/` — página principal con tarjetas de novelas
  - `pages/reader/` — lector de capítulos
  - `pages/characters/` — página de personajes tipo wiki
