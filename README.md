# 📚 Cours IFSI — site de fiches de révision

Site statique hébergé sur **GitHub Pages** : <https://alifsicrip.github.io/cours/>

Cartes mentales, infographies et fiches de cours, classées par UE (UE1 à UE6) avec un vocabulaire.
Aucune compilation : ce sont de simples fichiers HTML / Markdown / images, servis tels quels.

---

## Sommaire

1. [Organisation du dépôt](#1-organisation-du-dépôt)
2. [Les pages d'index des UE](#2-les-pages-dindex-des-ue)
3. [Règles de nommage](#3-règles-de-nommage)
4. [Les trois types de liens](#4-les-trois-types-de-liens)
5. [Ajouter des fiches (workflow)](#5-ajouter-des-fiches-workflow)
6. [Ajouter une fiche à la main](#6-ajouter-une-fiche-à-la-main)
7. [Cartes mentales interactives (MarkMap)](#7-cartes-mentales-interactives-markmap)
8. [Formatage automatique (facultatif)](#8-formatage-automatique-facultatif)
9. [Installation / mise à jour des automatisations](#9-installation--mise-à-jour-des-automatisations)
10. [Dépannage](#10-dépannage)

---

## 1. Organisation du dépôt

```
cours/
├── index.html                  Page d'accueil du site
├── vocabulaire.html            Page « Voc »
├── manifest.json               Manifeste (installation en appli)
│
├── pages/
│   ├── md-viewer.html          Lecteur de fichiers Markdown classiques (voir §4)
│   ├── markmap-viewer.html     Carte mentale interactive (voir §7)
│   ├── UE1/ … UE6/             Une UE par dossier
│   │   ├── index.html          Sommaire de l'UE (onglets dépliables)
│   │   ├── 2-1_Xxx.html        Fiches HTML
│   │   └── 2-1_Xxx.md          Fiches Markdown
│
├── assets/
│   ├── css/style.css           Feuille de style commune
│   ├── icons/                  Logos, favicon, icônes ue1.svg … ue6.svg
│   └── img/                    Images (.jpg, .png) et PDF
│
├── a-ajouter/                  📥 Boîte de dépôt pour l'import automatique
├── scripts/ajouter.mjs         Script d'import en lot
└── .github/workflows/          Automatisations GitHub Actions
    ├── ajouter-fiche.yml       « Ajouter des fiches »
    └── format.yml              Formatage Prettier (facultatif)
```

> Le détail ci-dessus a été établi à partir de l'index UE2 et des liens qu'il contient.
> Les index des autres UE sont supposés suivre la même structure : vérifie-les avec une
> **simulation** avant le premier import (voir §5).

---

## 2. Les pages d'index des UE

Chaque `pages/UEx/index.html` est le sommaire d'une UE. Elle contient :

- un **en-tête** (icône de l'UE, logo, titre, sous-titre) ;
- une série d'**onglets dépliables** (un par section : 2.1, 2.2, … 2.11), chacun contenant une liste de fiches ;
- une **barre latérale** de navigation vers les autres UE et le vocabulaire ;
- un petit script `togglePanel()` qui ouvre/ferme les onglets.

### Anatomie d'un onglet

```html
<!-- Onglet 2.4 -->
<div class="panel">
  <div class="panel-header" onclick="togglePanel(this)">
    <span class="icon rotated">🔻</span> 🫟 2.4 - Processus traumatiques
  </div>
  <div class="panel-content hidden">
    <ul style="list-style-type:none;">
      <li><a href="…" target="_blank" rel="noopener noreferrer">UE2.4 🫟 Escarres</a></li>
      <li><a href="…" target="_blank" rel="noopener noreferrer">UE2.4 💥 PEC de la Douleur</a></li>
    </ul>
  </div>
</div>
```

**Deux règles à respecter pour que l'import automatique fonctionne :**

1. Le titre de l'onglet (`panel-header`) doit contenir le numéro de section suivi d'un tiret :
   `2.4 - Processus traumatiques`. C'est ce numéro (`2.4`) que le script utilise pour retrouver l'onglet.
2. Chaque onglet doit avoir **son propre `<ul> … </ul>`** : les nouvelles fiches sont insérées juste avant le `</ul>`.

Une ligne `<li class="separateur">---</li>` peut servir de séparateur visuel (ignorée par le script).

### Libellé d'une fiche

```
UE<section> <emoji> <Titre>        ex : UE2.4 🫟 Escarres
```

---

## 3. Règles de nommage

### Fichiers de fiches

```
<UE>-<n°>_<Nom-Fiche>.<extension>
```

| Partie | Règle | Exemple |
|---|---|---|
| `<UE>-<n°>` | numéro de section, **avec un tiret** | `2-1`, `2-11` |
| `_` | séparateur unique entre le numéro et le nom | |
| `<Nom-Fiche>` | mots reliés par des tirets, **sans accents, sans espaces, sans apostrophes** | `Histoire-DeCellEco` |
| extension | en minuscules : `.html`, `.md`, `.pdf`, `.jpg`, `.png` … | `.md` |

Exemples : `2-1_Histoire-DeCellEco.md`, `2-4_Trauma-Cranien_2026.html`, `2-6_Troubles-Anxieux.html`.

> ⚠️ Évite les espaces et les parenthèses dans les noms (`… (1).html`) : ça marche, mais c'est
> fragile dans les URL. L'import automatique les nettoie pour toi.

### Numéro de section : point ou tiret ?

- Dans l'**index** et le **formulaire du workflow** : avec un point → `2.4` (le script accepte aussi `2-4`).
- Dans les **noms de fichiers** : avec un tiret → `2-4_…`.

### Où est rangé chaque type de fichier

| Type | Dossier |
|---|---|
| `.html` | `pages/UEx/` |
| `.md` | `pages/UEx/` |
| `.jpg` `.jpeg` `.png` `.gif` `.webp` `.svg` `.pdf` | `assets/img/` |

---

## 4. Les types de liens

Les liens utilisent l'URL complète du site (`https://alifsicrip.github.io/cours/…`).
La forme dépend du type de fichier :

| Fichier | Lien dans l'index |
|---|---|
| Page HTML | `…/cours/pages/UE2/2-4_Escarres.html` |
| Markdown | `…/cours/pages/md-viewer.html?file=UE2/2-5_Paludisme.md` |
| Markdown « MarkMap » | `…/cours/pages/markmap-viewer.html?file=UE2/2-1_MarkMap-Genetique.md` |
| Image / PDF | `…/cours/assets/img/my_adn-arn_2026.jpg` |

Le fichier `md-viewer.html` lit le paramètre `?file=` et affiche le Markdown mis en forme.
Le chemin passé est relatif au dossier `pages/`, d'où le préfixe `UE2/`.

> Pour passer à des liens relatifs (utile pour tester en local), il suffit de changer la constante
> `BASE_URL` en haut de `scripts/ajouter.mjs` (les liens existants de l'index restent à modifier à la main).

---

## 5. Ajouter des fiches (workflow)

L'import se fait **entièrement depuis le site GitHub**, sans rien installer en local.

### En 3 étapes

1. **Déposer les fichiers** dans le dossier `a-ajouter/` :
   ouvrir le dossier → **Add file → Upload files** → glisser un ou plusieurs fichiers → **Commit changes**.
2. **Lancer le workflow** : onglet **Actions** → **Ajouter des fiches** (colonne de gauche) → **Run workflow**.
3. **Remplir le formulaire**, puis **Run workflow**. Après ~30 secondes, un commit apparaît et le site se met à jour.

### Le formulaire

| Champ | Obligatoire | Description |
|---|---|---|
| UE | oui | `UE2`, `UE3`… (défaut : `UE2`) |
| Numéro d'onglet | oui | `2.1`, `2-1`, `2.11`… (formats `2.1`, `2-1`, `2,1`, `UE2.1` acceptés) |
| Emoji par défaut | non | Appliqué aux fichiers qui n'ont pas d'emoji dans leur nom |
| Insérer après la fiche n° | non | Vide = à la fin de l'onglet ; `0` = tout en haut ; `3` = après la 3ᵉ fiche |
| Simulation | non | Affiche le résultat dans le journal **sans rien modifier** |

> 💡 **Conseil** : lance toujours une **simulation** la première fois (ou après un gros lot).

### Ce que fait le script pour chaque fichier

1. Déduit le **titre affiché** et le **nom technique** à partir du nom du fichier déposé.
2. Renomme le fichier en `<UE>-<n°>_<Nom-Fiche>.<ext>`.
3. Le range dans `pages/UEx/` ou `assets/img/` selon son type.
4. Insère la ligne `<li>` dans l'onglet choisi, avec le bon type de lien.
5. Supprime le fichier de `a-ajouter/`.

Les fichiers d'un même lot sont ajoutés dans l'**ordre alphabétique du titre affiché**.

### Comment nommer le fichier avant de le déposer

**Nomme-le comme tu veux le voir affiché.** Le titre est déduit de ce nom :

| Fichier déposé | Fichier final | Titre dans l'index |
|---|---|---|
| `Histoire de Cellul’Éco.md` | `2-1_Histoire-de-CelluleEco.md` | Histoire de Cellul’Éco |
| `Histoire-DeCellEco.md` | `2-1_Histoire-DeCellEco.md` | Histoire De Cell Eco |
| `🧬 Génétique : les bases.html` | `2-1_Genetique-les-bases.html` | 🧬 Génétique : les bases |

- **Avec des espaces** dans le nom : le titre est repris tel quel (accents, apostrophes…).
- **Sans espaces** (`Nom-DeFiche`) : le script coupe aux tirets/underscores et aux majuscules.
- **Un emoji au début** du nom devient l'emoji de la fiche (prioritaire sur le champ du formulaire).
- **Un préfixe existant** (`2-1_`, `2.1 `, `UE2.1 `) est remplacé, jamais doublé.
- L'extension est mise en minuscules ; `.htm` devient `.html`.

### En cas de problème sur un fichier

Un fichier en erreur **n'arrête pas le lot** : les autres sont ajoutés et enregistrés, le fautif
reste dans `a-ajouter/`. Le détail est visible dans le **résumé** de l'exécution (onglet Actions).
L'exécution s'affiche alors en rouge, même si une partie des fiches a bien été ajoutée.

| Message | Cause |
|---|---|
| `type « .docx » non géré` | Format non accepté (voir tableau §3) |
| `… existe déjà` / `ce lien existe déjà dans l'index` | Une fiche du même nom est déjà publiée : renomme le fichier |
| `nom vide une fois nettoyé` | Le nom ne contient aucun caractère exploitable |

### Utilisation en ligne de commande (facultatif)

Le même script peut être lancé en local ou dans un Codespace :

```bash
node scripts/ajouter.mjs --ue UE2 --section 2.1 [--emoji 🧬] [--after 3] [--dry-run]
```

Options : `--ue`, `--section`, `--emoji`, `--after`, `--dir` (défaut `a-ajouter`), `--dry-run`.
Aucune dépendance à installer (Node.js ≥ 18 suffit).

---

## 6. Ajouter une fiche à la main

Si tu préfères ne pas passer par le workflow :

1. Dépose le fichier au bon endroit (voir §3), avec un nom conforme.
2. Ouvre `pages/UEx/index.html` et copie une ligne `<li>` existante dans l'onglet voulu :

```html
<li><a href="https://alifsicrip.github.io/cours/pages/UE2/2-4_Escarres.html" target="_blank" rel="noopener noreferrer">UE2.4 🫟 Escarres</a></li>
```

3. Adapte le lien (voir §4) et le libellé, puis enregistre (commit).

---

## 7. Cartes mentales interactives (MarkMap)

Un fichier Markdown dont le **nom contient « MarkMap »** (majuscules/minuscules indifférentes)
s'ouvre automatiquement en **carte mentale interactive** grâce à [Markmap](https://markmap.js.org),
au lieu du lecteur Markdown classique. La page qui s'en charge est `pages/markmap-viewer.html`.

### Utilisation

1. Écris ta carte en Markdown : **chaque titre (`#`, `##`, …) et chaque élément de liste devient une branche**.
2. Mets **`MarkMap`** dans le nom du fichier : `MarkMap Génétique.md`, `🧠 carte markmap neuro.md`…
3. Importe-le comme n'importe quelle fiche (§5) : le lien généré pointe vers `markmap-viewer.html`.

```markdown
# Génétique
## ADN
- Double hélice
  - Bases : A, T, C, G
- **Réplication**
## ARN
- ARNm
- ARNt
```

### Dans la carte

- **Glisser** pour se déplacer, **molette / pincement** pour zoomer ; **clic sur un nœud** pour replier/déplier sa branche.
- La **barre d'outils** (en bas à droite) : zoom +/−, ajuster à l'écran, tout déplier/replier, mode sombre.
- Le mode sombre est activé automatiquement si ton appareil l'utilise.
- Gras, italique, liens, listes numérotées, code et formules sont pris en charge.

### Réglages

Toutes les cartes s'ouvrent avec ces **réglages par défaut** (rien à ajouter dans les fichiers) :

| Option | Valeur par défaut | Effet |
|---|---|---|
| `initialExpandLevel` | `2` | Niveaux dépliés à l'ouverture : la racine et ses branches principales ; un clic sur un nœud déplie la suite (`-1` = tout déplier) |
| `maxWidth` | `600` | Largeur maximale d'un nœud en pixels, avant retour à la ligne |
| `colorFreezeLevel` | `2` | Niveau à partir duquel les sous-branches gardent la couleur de leur branche parente |

Pour **modifier ces valeurs pour une seule carte**, ajoute un en-tête tout en haut du fichier `.md`.
Les options indiquées remplacent les valeurs par défaut, les autres restent inchangées :

```markdown
---
title: Génétique — vue d'ensemble
markmap:
  initialExpandLevel: -1
  maxWidth: 300
---
# Génétique
…
```

`title` (facultatif) fixe le titre affiché en haut de la page ; sinon c'est le premier titre du fichier.
Pour changer les valeurs par défaut de **toutes** les cartes, modifier la ligne `DEFAUTS` dans `pages/markmap-viewer.html`.
Liste complète des options : <https://markmap.js.org/docs/json-options>.

### Deux types de fichiers `.md`, deux lecteurs

| Nom du fichier | Ouvert avec | Rendu |
|---|---|---|
| contient « MarkMap » | `pages/markmap-viewer.html` | carte mentale interactive |
| tout autre `.md` | `pages/md-viewer.html` | document mis en forme (style GitHub) |

`md-viewer.html` contient, tout en haut de son `<head>`, une petite redirection : si le nom du fichier
contient « MarkMap », la page bascule automatiquement vers `markmap-viewer.html`. Les **anciens liens**
(qui pointent encore vers `md-viewer.html`) fonctionnent donc sans rien modifier dans les index.
Les nouveaux imports, eux, pointent directement vers le bon lecteur.

```html
<script>
  (function () {
    var f = new URLSearchParams(location.search).get('file') || '';
    if (/markmap/i.test(f.split('/').pop())) location.replace('markmap-viewer.html' + location.search);
  })();
</script>
```

> La règle porte sur le **nom du fichier** (pas sur celui du dossier).

### Détails techniques

- Les bibliothèques (d3, markmap-lib, markmap-view, markmap-toolbar) sont chargées depuis le CDN
  jsDelivr, en **versions fixées** (Markmap 0.18.12, d3 7.9.0) : la page nécessite donc une connexion internet.
- Pour mettre à jour les versions, modifier les adresses `cdn.jsdelivr.net` en haut de `markmap-viewer.html`.
- Pour des raisons de sécurité, la page n'accepte que des chemins `.md` **internes au site**
  (pas d'adresse `http(s)://`, pas de `..`).
- Seuls les `.md` produisent des cartes : un `.html` nommé « MarkMap » reste une page HTML normale.

---

## 8. Formatage automatique (facultatif)

Le workflow **Formater le code** (`format.yml`) passe [Prettier](https://prettier.io) sur les fichiers
`.html` à chaque modification, pour garder une indentation propre.

- Réglages : `.prettierrc` (indentation de 2 espaces, largeur 100).
- Exclusions : `.prettierignore` — il ignore notamment `a-ajouter/` et les `pages/*/index.html`
  (Prettier étirerait chaque fiche de l'index sur 7 lignes ; le script gère déjà leur indentation).
- Il peut aussi être lancé à la main : **Actions → Formater le code → Run workflow**.

---

## 9. Installation / mise à jour des automatisations

Tout se fait depuis l'interface GitHub : **Add file → Create new file**, saisir le chemin complet
dans le champ du nom (les `/` créent les dossiers), coller le contenu, **Commit changes**.

| Fichier à créer | Rôle |
|---|---|
| `scripts/ajouter.mjs` | Script d'import |
| `.github/workflows/ajouter-fiche.yml` | Workflow « Ajouter des fiches » |
| `a-ajouter/.gitkeep` | Crée le dossier de dépôt (fichier vide) |
| `pages/markmap-viewer.html` | Page des cartes mentales MarkMap |
| `pages/md-viewer.html` | Lecteur Markdown (version avec la redirection MarkMap) |
| `.github/workflows/format.yml` *(facultatif)* | Formatage Prettier |
| `.prettierrc`, `.prettierignore` *(facultatif)* | Réglages Prettier |

**Droits de l'Action** : *Settings → Actions → General → Workflow permissions* →
**Read and write permissions** (nécessaire pour que l'Action enregistre ses modifications).

Pour mettre à jour un fichier : ouvrir le fichier → icône ✏️ → remplacer le contenu → **Commit changes**.

---

## 10. Dépannage

| Symptôme | Piste |
|---|---|
| `Onglet « 2-5 » introuvable… Disponibles : 2.1, 2.2…` | Le numéro ne correspond à aucun onglet de l'UE. Reprendre un numéro de la liste affichée. |
| `Aucun fichier à traiter dans a-ajouter/` | Le dossier est vide (ou ne contient que `.gitkeep`) : déposer d'abord les fichiers **dans** `a-ajouter/`. |
| `Dossier « a-ajouter » introuvable` | Créer `a-ajouter/.gitkeep` (voir §9). |
| `Index introuvable : pages/UEx/index.html` | L'UE saisie n'existe pas ou son index n'est pas à cet emplacement. |
| `Onglet 2.x : structure inattendue` | L'onglet n'a pas de `</ul>` : voir les règles du §2. |
| Message « Node.js 20 is deprecated » / « ubuntu-latest will migrate… » | Simples avertissements de GitHub, sans effet sur le fonctionnement. |
| Le site ne se met pas à jour après un import | Vérifier l'onglet **Actions** (déploiement Pages) et patienter quelques minutes ; vider le cache du navigateur. |
| La carte MarkMap reste vide ou affiche « bibliothèques non chargées » | Pas de connexion internet, ou CDN jsDelivr bloqué (réseau d'établissement) : réessayer ailleurs. |
| Une fiche « MarkMap » s'ouvre en texte simple | Le nom du fichier ne contient pas « MarkMap », ou `pages/md-viewer.html` n'a pas la redirection (voir §7). |
| Titre affiché pas joli (`Histoire De Cell Eco`) | Renommer le fichier **avec des espaces** avant dépôt, ou corriger le libellé à la main dans l'index. |

---

*Anaïs Logerais — 52ᵉ promotion — IFSI Crip 34*
