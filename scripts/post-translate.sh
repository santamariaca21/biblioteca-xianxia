#!/bin/bash
# Pipeline post-traducción. Ejecutar después de cada bloque.
# Uso: bash scripts/post-translate.sh START END
#   Ej: bash scripts/post-translate.sh 110 114

START=${1:-100}
END=${2:-109}
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

echo "=== Post-traducción caps ${START}-${END} ==="
echo ""

echo "1️⃣  fix-consistency.py"
python3 scripts/fix-consistency.py "$START" "$END"

echo ""
echo "2️⃣  normalize-talent-panels.py"
python3 scripts/normalize-talent-panels.py "$START" "$END" 2>&1

echo ""
echo "3️⃣  harvest-new-terms.py (auto-guardar términos nuevos)"
python3 scripts/harvest-new-terms.py "$START" "$END"

echo ""
echo "4️⃣  validate-translation.py"
python3 scripts/validate-translation.py "$START" "$END"

echo ""
echo "5️⃣  Regenerar prompt con glosario actualizado"
python3 scripts/build-prompt.py > /tmp/translation-prompt.txt
TOTAL=$(python3 -c "import json; g=json.load(open('scripts/glosario-maestro.json')); print(sum(len(v) for k,v in g.items() if not k.startswith('_') and isinstance(v,dict)))")
echo "   Prompt regenerado (${TOTAL} términos)"

echo ""
echo "✅ Pipeline completo"
