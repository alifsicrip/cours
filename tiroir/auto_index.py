#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
auto_index.py — Ajoute automatiquement les nouveaux fichiers importés dans
l'index.html d'une UE, avec la bonne syntaxe de lien selon le type de fichier.

FONCTIONNEMENT
--------------
1. Le script regarde tous les fichiers présents dans pages/UEx/ (ou dans
   assets/img/ pour les images/PDF liés à cette UE).
2. Il compare avec les liens déjà présents dans pages/UEx/index.html pour
   savoir quels fichiers sont "nouveaux" (pas encore listés).
3. Pour chaque nouveau fichier, il devine la sous-section (2.1, 2.2, 2.11...)
   d'après le préfixe du nom de fichier (ex: "2-2_XXX.html" -> section 2.2).
4. Il insère une ligne <li><a href="...">Titre</a></li> au bon endroit
   (juste avant </ul> du panneau "<!-- Onglet X.Y -->" correspondant),
   avec la syntaxe adaptée :
     - .md          -> lien via md-viewer.html?file=UEx/nomfichier.md
     - autre (.html, .jpg, .png, .pdf, .svg...) -> lien direct vers le fichier

UTILISATION
-----------
  # Mode aperçu (ne modifie rien, affiche ce qui serait fait) :
  python3 auto_index.py UE2 --dry-run

  # Mode réel : insère les nouveaux fichiers avec un titre auto-généré
  python3 auto_index.py UE2

  # Donner un titre précis à un fichier particulier avant insertion
  python3 auto_index.py UE2 --title "2-2_NouveauSysteme_2026.html=UE2.2 🫀 Nouveau Système"

Le script est volontairement prudent : si un fichier ne correspond à
aucune sous-section connue (ex: "2-7_..." alors qu'il n'y a pas de panneau
2.7 dans l'index), il ne l'insère pas et l'affiche dans une liste
"À traiter manuellement" à la fin.

Lancez-le depuis la racine du dépôt (là où se trouve le dossier pages/).
"""

import argparse
import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_URL = "https://alifsicrip.github.io/cours"

# Extensions qui passent par le visionneur markdown
MD_EXT = {".md"}
# Extensions "image/document" qui vivent généralement dans assets/img
ASSET_EXT = {".png", ".jpg", ".jpeg", ".svg", ".pdf", ".gif", ".webp"}


def slugify_title(filename: str, section: str) -> str:
    """Génère un titre par défaut lisible à partir du nom de fichier.
    Ex: '2-2_Systeme_Renal_2026.html' -> 'UE2.2 Systeme Renal'
    """
    name, _ext = os.path.splitext(filename)
    # enlève le préfixe "2-2_", "2-2 " ou "UE2-2_"
    name = re.sub(r"^(?:UE)?\d+-\d+[_ ]", "", name)
    # enlève un suffixe année du type _2026 ou -2026
    name = re.sub(r"[_ ]?20\d\d$", "", name)
    # remplace _ et - par des espaces
    name = re.sub(r"[_\-]+", " ", name).strip()
    return f"UE{section} {name}"


def find_sections(index_html: str):
    """Retourne un dict {"2.1": position_du_</ul>_de_ce_panel, ...}"""
    sections = {}
    for m in re.finditer(r"<!--\s*Onglet\s+([\d.]+)\s*-->", index_html):
        sec = m.group(1)
        # on cherche le prochain </ul> après ce commentaire : c'est la fin
        # de la liste de liens de cette section.
        ul_close = index_html.find("</ul>", m.end())
        if ul_close != -1:
            sections[sec] = ul_close
    return sections


def already_listed_files(index_html: str):
    """Renvoie l'ensemble des noms de fichiers déjà référencés dans l'index
    (que ce soit en lien direct ou via md-viewer.html?file=...)."""
    listed = set()
    for href in re.findall(r'href="([^"]+)"', index_html):
        if "md-viewer.html?file=" in href:
            # file=UE2/nom-du-fichier.md
            file_part = href.split("file=", 1)[1]
            listed.add(os.path.basename(file_part))
        else:
            listed.add(os.path.basename(href))
    return listed


def guess_section(filename: str):
    """'2-11_Antalgiques.html' -> '2.11' ; 'UE2-5_Truc.md' -> '2.5'"""
    m = re.match(r"^(?:UE)?(\d+)-(\d+)[_ ]", filename)
    if not m:
        return None
    return f"{m.group(1)}.{m.group(2)}"


def build_link_html(ue: str, filename: str, title: str, from_assets: bool) -> str:
    if from_assets:
        href = f"{BASE_URL}/assets/img/{filename}"
    else:
        ext = os.path.splitext(filename)[1].lower()
        if ext in MD_EXT:
            href = f"{BASE_URL}/pages/md-viewer.html?file={ue}/{filename}"
        else:
            href = f"{BASE_URL}/pages/{ue}/{filename}"
    return (
        f'                  <li><a href="{href}" target="_blank" '
        f'rel="noopener noreferrer">{title}</a></li> \n'
        f"                  <br>\n"
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("ue", help="Nom du dossier UE, ex: UE2")
    parser.add_argument("--dry-run", action="store_true", help="N'écrit rien, affiche seulement ce qui serait fait")
    parser.add_argument(
        "--title",
        action="append",
        default=[],
        metavar="fichier.ext=Titre",
        help="Force le titre d'un fichier précis (répétable)",
    )
    parser.add_argument(
        "--from-assets",
        action="store_true",
        help="Cherche les nouveaux fichiers dans assets/img/ au lieu de pages/<UE>/",
    )
    args = parser.parse_args()

    ue = args.ue
    title_overrides = {}
    for t in args.title:
        if "=" not in t:
            print(f"⚠️  Ignoré (--title mal formé) : {t}")
            continue
        fname, title = t.split("=", 1)
        title_overrides[fname] = title

    index_path = os.path.join(REPO_ROOT, "pages", ue, "index.html")
    if not os.path.isfile(index_path):
        print(f"❌ Introuvable : {index_path}")
        sys.exit(1)

    scan_dir = os.path.join(REPO_ROOT, "assets", "img") if args.from_assets else os.path.join(REPO_ROOT, "pages", ue)
    if not os.path.isdir(scan_dir):
        print(f"❌ Dossier introuvable : {scan_dir}")
        sys.exit(1)

    with open(index_path, "r", encoding="utf-8") as f:
        index_html = f.read()

    listed = already_listed_files(index_html)
    sections = find_sections(index_html)

    candidates = [
        f
        for f in os.listdir(scan_dir)
        if os.path.isfile(os.path.join(scan_dir, f)) and f != "index.html" and not f.startswith(".")
    ]
    new_files = [f for f in candidates if f not in listed]

    if not new_files:
        print("✅ Rien à faire : tous les fichiers sont déjà référencés dans l'index.")
        return

    inserts_by_pos = {}  # position -> liste de lignes à insérer
    manual_review = []

    for filename in sorted(new_files):
        section = guess_section(filename)
        if section is None or section not in sections:
            manual_review.append((filename, section))
            continue

        title = title_overrides.get(filename) or slugify_title(filename, section)
        link_html = build_link_html(ue, filename, title, args.from_assets)
        pos = sections[section]
        inserts_by_pos.setdefault(pos, []).append((filename, title, link_html))

    if not inserts_by_pos:
        print("Aucun fichier ne correspond à une section existante dans l'index.")
    else:
        # on insère en partant de la fin du fichier pour ne pas décaler les
        # positions déjà calculées
        new_html = index_html
        for pos in sorted(inserts_by_pos.keys(), reverse=True):
            block = "".join(link for _, _, link in inserts_by_pos[pos])
            new_html = new_html[:pos] + block + new_html[pos:]

        print(f"📄 {index_path}")
        for pos in sorted(inserts_by_pos.keys()):
            for filename, title, _ in inserts_by_pos[pos]:
                print(f"  + [{filename}] -> \"{title}\"")

        if args.dry_run:
            print("\n(mode --dry-run : aucun fichier n'a été modifié)")
        else:
            with open(index_path, "w", encoding="utf-8") as f:
                f.write(new_html)
            print("\n✅ index.html mis à jour.")

    if manual_review:
        print("\n⚠️  À traiter manuellement (section introuvable/inconnue) :")
        for filename, section in manual_review:
            print(f"  - {filename}  (section devinée : {section or 'aucune'})")


if __name__ == "__main__":
    main()
