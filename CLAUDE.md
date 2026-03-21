# Biblioteca Xianxia — Contexto para Claude

## Qué es este proyecto
Una aplicación Angular para leer novelas de cultivo chinas (xianxia/xuanhuan) traducidas al español. Cada novela tiene capítulos en JSON, personajes con fichas tipo wiki, y un lector con temas de color configurables.

## Antes de cualquier tarea
Lee `REGLAS_TRADUCCION.md` — contiene el glosario de términos, reglas de formato, estructura de datos, y procesos obligatorios.

## Estructura del proyecto
```
public/novels/
  index.json                        ← Índice de todas las novelas
  {novel-id}/
    novel.json                      ← Metadatos de la novela
    characters.json                 ← Personajes con fichas wiki
    chapters/capX.json              ← Capítulos (HTML + talents + stats + characters)
    characters/*.webp               ← Imágenes de personajes (placeholder.svg si no existe)

src/app/
  models/novel.model.ts             ← Interfaces TypeScript
  services/novel.service.ts         ← Carga de datos JSON
  services/settings.service.ts      ← Temas y ajustes de lectura
  components/icon/                  ← Iconos SVG inline (NO usar emojis)
  components/header/                ← Header global
  components/character-card/        ← Tarjeta wiki de personaje (compacto y completo)
  components/chapter-sidebar/       ← Índice de capítulos
  components/stats-sidebar/         ← Panel de stats del protagonista
  components/settings-panel/        ← Ajustes de lectura
  pages/library/                    ← Página principal
  pages/reader/                     ← Lector de capítulos
  pages/characters/                 ← Página de personajes
```

## Reglas de desarrollo
- Angular 21 con standalone components y signals
- NO usar emojis en la UI — usar `<app-icon name="..." />` (ver icon.ts para nombres disponibles)
- Los colores se manejan con CSS custom properties `--t-*` para soportar los 5 temas
- Los datos se cargan desde JSON estáticos en `public/novels/`
- Siempre verificar con `ng build` después de cambios

## Tareas comunes

### Traducir un nuevo capítulo
1. Leer `REGLAS_TRADUCCION.md` completo
2. Seguir el glosario de términos fijos (Yuan Qi, Artista Marcial, etc.)
3. Crear `capX.json` con content (HTML), talents, stats, characters
4. Actualizar `novel.json`, `characters.json`, `index.json`
5. Verificar build

### Agregar un personaje
1. Agregar entrada completa en `characters.json` con: info (tabla wiki), abilities, relationships, chapterAppearances
2. Agregar su ID al array `characters` en los capítulos donde aparece

### Modificar la interfaz
1. Leer el componente existente antes de modificar
2. Usar las CSS variables `--t-*` para colores (NO hardcodear)
3. Usar `<app-icon>` para iconos
4. Verificar build
