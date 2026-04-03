#!/usr/bin/env python3
"""
Guarda una traducción ES en un capítulo JSON.
El agente solo necesita escribir el HTML a un archivo temporal y llamar este script.

Uso: python3 scripts/save-translation.py CAP_NUM "Título ES" /tmp/capN_es.html
  - CAP_NUM: número del capítulo (ej: 110)
  - "Título ES": título traducido al español
  - /tmp/capN_es.html: archivo con el HTML traducido

También acepta el HTML por stdin:
  echo "<p>contenido</p>" | python3 scripts/save-translation.py 110 "Título"
"""
import json, os, sys, re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
CHAPTERS_DIR = os.path.join(PROJECT_DIR, "public/novels/i-can-copy-talents/chapters")


def save(cap_num, title_es, html):
    f = os.path.join(CHAPTERS_DIR, f"cap{cap_num}.json")
    cap = json.load(open(f, encoding='utf-8'))

    content = cap.get("content", {})
    if isinstance(content, str):
        content = {"es": content}
    content["es"] = html
    cap["content"] = content

    title = cap.get("title", {})
    if isinstance(title, str):
        title = {"es": title}
    title["es"] = title_es
    cap["title"] = title

    json.dump(cap, open(f, "w", encoding='utf-8'), ensure_ascii=False, indent=2)

    paras = html.count("</p>")
    emph = html.count("emphasis")
    dial = html.count("dialogue")
    new_terms = re.findall(r'<!--\s*NEW_TERM:\s*(.+?)\s*→\s*(.+?)\s*-->', html)

    print(f"✅ cap{cap_num}: {len(html)} chars | {paras}p | {emph} emphasis | {dial} dialogue")
    if new_terms:
        for zh, es in new_terms:
            print(f"  🆕 {zh} → {es}")
    return new_terms


def main():
    if len(sys.argv) < 3:
        print("Uso: python3 save-translation.py CAP_NUM \"Título\" [archivo.html]")
        sys.exit(1)

    cap_num = int(sys.argv[1])
    title_es = sys.argv[2]

    if len(sys.argv) > 3:
        html = open(sys.argv[3], encoding='utf-8').read()
    else:
        html = sys.stdin.read()

    # Strip inline title if accidentally included
    html = re.sub(r'^<p class="centered-italic">.*?[Cc]ap[ií]tulo\s+\d+.*?</p>\s*', '', html, count=1)

    save(cap_num, title_es, html)


if __name__ == "__main__":
    main()
