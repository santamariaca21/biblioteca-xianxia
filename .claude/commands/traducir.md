Estamos trabajando en un proyecto Angular de lectura de novelas xianxia traducidas al español.

ANTES DE HACER CUALQUIER COSA, lee estos archivos en orden:
1. $ARGUMENTS/CLAUDE.md
2. $ARGUMENTS/REGLAS_TRADUCCION.md
3. Revisa la estructura de public/novels/i-can-copy-talents/ (novel.json, characters.json, y los últimos 2 capítulos traducidos para entender el formato actual)
4. Verifica cuántos capítulos hay traducidos con: `ls public/novels/i-can-copy-talents/chapters/ | wc -l`
5. Verifica cuántos sources hay descargados con: `ls /tmp/source_cap*.txt 2>/dev/null | wc -l`

ESTADO A DETECTAR AUTOMÁTICAMENTE:
- Cuenta los capítulos existentes en chapters/ para saber el último traducido
- Lee el último capítulo traducido para ver los talentos actuales de Ye Tian
- Lee characters.json para ver el estado de personajes
- Si faltan sources en /tmp/, descárgalos con curl desde fanmtl.com

PROCESO DE TRADUCCIÓN (bloques de 10, 5 agentes × 2 caps):
1. Descargar sources faltantes si es necesario
2. Lanzar 5 agentes en paralelo, cada uno traduce 2 capítulos
3. Verificar fidelidad con el script de las reglas (mínimo 90%)
4. Actualizar novel.json (chapters array, totalChapters, worldInfo/realms/talentRanks/baseInfoProgressive si hay nueva info revelada)
5. Actualizar characters.json (appearances de TODOS los personajes que aparecen en cada capítulo, crear nuevos personajes, actualizar bios de personajes principales cada 10 caps)
6. Validar cruzadamente que cada personaje referenciado en un capítulo tenga su appearance (0 problemas)
7. Build con ng build
8. Reportar: fidelidad, personajes actualizados, stats/talentos cambiados, info del mundo nueva

REGLAS CRÍTICAS:
- Traducir párrafo por párrafo fiel al source (NO condensar, NO omitir)
- Niveles de talento: Weak=Débil, Inferior=Inferior, Elementary=Elemental, Medium=Medio, High/Advanced=Alto, Top=Supremo, Extraordinary=Extraordinario, Morning Star=Estrella Matutina, Bright Moon=Luna Brillante, Dawn/Sun-Rising=Sol Naciente
- El array "talentos" en stats debe tener TODOS los talentos acumulados hasta ese capítulo
- Stats incluyen: edad, golpeMax, fuerza, ubicacion, reino
- Info del mundo se filtra por capítulo con revealedAt/replacedAt
- NO usar emojis en la UI, usar <app-icon>
- Espacio y Tiempo son talentos SEPARADOS
- estado="" para talentos activos (no mostrar badge), solo usar "por fusionar"/"copiado"/"dormido"

Continúa traduciendo desde donde se quedó.
