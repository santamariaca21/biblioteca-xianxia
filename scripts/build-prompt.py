#!/usr/bin/env python3
"""
Genera el system prompt para agentes de traducción Sonnet.
Lee glosario-maestro.json y produce un prompt optimizado.

Uso: python3 scripts/build-prompt.py > /tmp/translation-prompt.txt
     python3 scripts/build-prompt.py --json  (output as JSON string)
"""
import json, os, sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
GLOSARIO_PATH = os.path.join(SCRIPT_DIR, "glosario-maestro.json")

# High-risk terms: terms that LLMs commonly mistranslate
# Format: correct_es → [bad_variants]
HIGH_RISK = {
    "Talento de Sable": ["Talento de Cuchilla", "Talento de Cuchillo", "Talento del Sable"],
    "bestia salvaje": ["bestia feroz", "bestia fiera", "bestia violenta"],
    "artista marcial": ["guerrero marcial", "practicante marcial", "cultivador marcial"],
    "Tianjiao": ["Prodigio Celestial", "Genio Celestial", "prodigio celestial"],
    "nivel pico": ["nivel cumbre", "nivel cúspide", "nivel máximo"],
    "Consumación": ["maestría", "dominio completo", "perfección completa"],
    "Yuan Qi": ["energía vital", "qi yuan", "energía yuan", "chi"],
    "Yuan Li": ["fuerza yuan", "poder yuan", "energía Yuan"],
    "catties": ["jin", "libras"],
    "grieta espacial": ["grieta dimensional", "fisura espacial", "brecha espacial"],
    "intención del sable": ["intención de espada", "voluntad del sable"],
}


def build_glossary_section(glosario):
    """Build the glossary section of the prompt."""
    lines = []

    # Category display names
    cat_names = {
        "nombres": "NOMBRES PROPIOS (pinyin, NO traducir)",
        "reinos_cultivo": "REINOS DE CULTIVO",
        "niveles_talento": "NIVELES DE TALENTO",
        "subniveles": "SUBNIVELES/ETAPAS",
        "terminos_cultivo": "TÉRMINOS DE CULTIVO",
        "tecnicas": "TÉCNICAS",
        "zonas": "LUGARES/ZONAS",
        "razas": "RAZAS",
        "titulos": "TÍTULOS/HONORÍFICOS",
        "organizaciones": "ORGANIZACIONES",
        "sistema_porcentajes": "SISTEMA DE PORCENTAJES (成=10%)",
        "medidas": "MEDIDAS",
    }

    for cat, entries in glosario.items():
        if cat.startswith("_"):
            continue
        display = cat_names.get(cat, cat.upper())
        lines.append(f"\n### {display}")
        for zh, es in entries.items():
            if zh.startswith("_"):
                continue
            # Check if this is a high-risk term
            warning = ""
            if es in HIGH_RISK:
                bads = ", ".join(f'"{b}"' for b in HIGH_RISK[es])
                warning = f"  ⚠️ NUNCA: {bads}"
            lines.append(f"- {zh} → {es}{warning}")

    return "\n".join(lines)


def build_prompt(glosario):
    glossary = build_glossary_section(glosario)

    prompt = f"""Eres un traductor profesional de novelas xianxia (chino mandarín → español). Tu trabajo es producir traducciones de calidad editorial, naturales y fieles al original.

## GLOSARIO OBLIGATORIO
Usa EXACTAMENTE estos términos. No uses sinónimos ni variantes.
{glossary}

## REGLAS DE TRADUCCIÓN

### Fidelidad
1. CADA párrafo/línea del original DEBE tener su correspondiente en la traducción. NUNCA omitas contenido.
2. NUNCA inventes contenido que no esté en el original.
3. Mantén la misma cantidad de párrafos (~90% mínimo).
4. Los pensamientos internos del personaje también van entre «».

### Formato HTML
- Párrafos: `<p>texto</p>`
- Diálogos: `<p><span class="dialogue">«texto»</span></p>` (comillas francesas «»)
- Términos importantes (talentos, reinos, técnicas, Yuan Qi, Yuan Li): `<span class="emphasis">término</span>`
- **NO incluyas título del capítulo en el contenido.** El título se maneja por separado. El contenido empieza directamente con el primer párrafo narrativo.
- Paneles de talento/status — REGLAS CRÍTICAS:
  1. Todo el contenido DEBE estar DENTRO del `<div class="system-box">...</div>`
  2. Cada fila usa `sys-row` con `sys-label` y `sys-value` con sus tags de cierre
  3. El `</div>` final del system-box va DESPUÉS de todas las filas
  4. Para textos descriptivos sin formato label:value, usa `<p>` dentro del system-box
  5. NO pongas `<span class="emphasis">` dentro de sys-label ni sys-value — el panel ya tiene su propio estilo
```html
<div class="system-box">
<div class="sys-title">Panel de Talento</div>
<div class="sys-row"><span class="sys-label">Especie:</span> <span class="sys-value">Humano</span></div>
<div class="sys-row"><span class="sys-label">Talento de Cultivo:</span> <span class="sys-value">Estrella Matutina</span></div>
<div class="sys-row"><span class="sys-label">Talento de Fuerza:</span> <span class="sys-value">Arcano</span></div>
</div>
```
- Transiciones/efectos de sonido: `<p class="centered-italic">¡¡¡BOOM!!!</p>`

### Estilo
- Español neutro latinoamericano
- Tono narrativo épico pero natural (como novela publicada profesionalmente)
- Los nombres propios se mantienen en pinyin (Ye Tian, no "Hoja Cielo")
- Porcentajes con 成: SIEMPRE en texto → 七成 = "setenta por ciento", 七成七 = "setenta y siete por ciento"
- Unidades de fuerza: 斤 = catties (NUNCA "jin")

### Contenido a OMITIR (basura editorial del source)
NUNCA incluyas en la traducción:
- Marcadores de actualización: 【第N更，求全订】, [Primera/Segunda actualización...], etc.
- Peticiones de votos: 求鲜花, 求月票, "agradezco los votos", "se agradecen las suscripciones"
- Notas del autor al pie: "ps: 求...", "石头提醒您..."
- Líneas de puntos/ceros decorativas: "0 ···求鲜花··· ···", "。。.... 0"
- Cualquier texto que NO sea contenido narrativo de la novela

### Términos nuevos
Si encuentras un término chino que NO está en el glosario:
- Nombres propios: translitéralos a pinyin (ej: 秦战天 → Qin Zhantian)
- Técnicas/lugares: traduce literalmente y marca con un comentario HTML:
  `<!-- NEW_TERM: 原文 → traducción -->`
- Esto es CRÍTICO para mantener consistencia en capítulos futuros.

### OUTPUT
Devuelve SOLO el HTML traducido. Sin explicaciones, sin markdown, sin bloques de código."""

    return prompt


def main():
    glosario = json.load(open(GLOSARIO_PATH))

    if "--json" in sys.argv:
        prompt = build_prompt(glosario)
        print(json.dumps(prompt, ensure_ascii=False))
    else:
        print(build_prompt(glosario))


if __name__ == "__main__":
    main()
