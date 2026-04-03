#!/bin/bash
# Extrae el ZH limpio de un capítulo y lo guarda en /tmp para el agente traductor
# Uso: bash scripts/prepare-chapter.sh 451
CAP=$1
DIR="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$DIR/scripts/extract-chapter.py" "$CAP" > "/tmp/cap${CAP}_zh.txt" 2>/tmp/cap${CAP}_info.txt
cat /tmp/cap${CAP}_info.txt
