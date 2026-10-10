#!/usr/bin/env node
/**
 * Importe en lot les fichiers déposés dans le dossier « a-ajouter/ » :
 * chaque fichier est renommé automatiquement, rangé au bon endroit, puis
 * ajouté à l'index de l'UE (en fin d'onglet).
 *
 *   node scripts/ajouter.mjs --ue UE2 --section 2.1 [--emoji 🧬] [--after 3] [--dry-run]
 *
 *   --ue       UE concernée (défaut : UE2)
 *   --section  numéro de l'onglet, tel qu'affiché dans l'index (ex : 2.1)
 *   --emoji    emoji par défaut (un emoji au début du nom de fichier est prioritaire)
 *   --after    placement manuel : insérer le lot après la fiche n° N (0 = en haut), SANS tri.
 *              Absent (défaut) : l'onglet est classé par ordre alphabétique.
 *   --dir      dossier à traiter (défaut : a-ajouter)
 *   --dry-run  simulation : rien n'est écrit
 *
 * Nom final :  <UE>-<n°>_<Nom-Fiche>.<ext>   ex : 2-1_Histoire-DeCellEco.md
 *
 * Fichier .md dont le nom contient « MarkMap » (majuscules indifférentes) :
 * le lien ouvre la carte mentale interactive (pages/markmap-viewer.html).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------- réglages
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'https://alifsicrip.github.io/cours'; // mettre '' pour des liens relatifs à la racine
const PAGES_DIR = 'pages';
const MEDIA_DIR = 'assets/img'; // images et PDF

// Remplacements appliqués au TITRE AFFICHÉ dans l'index (pas au nom du fichier).
// Un tiret placé juste avant le motif est absorbé : « Génétique - Fiche IFSI » → « Génétique - 📄 ».
const REMPLACEMENTS = [
  { motif: /Fiche[\s_-]*IFSI/i, par: '- 📄' }, // Fiche IFSI, Fiche_IFSI, FicheIFSI…
  { motif: /Mark[\s_-]*Map/i, par: '- 🪢' }, // MarkMap, Mark Map, markmap…
];

const TYPES = {
  '.html': 'page',
  '.htm': 'page',
  '.md': 'markdown',
  '.jpg': 'media',
  '.jpeg': 'media',
  '.png': 'media',
  '.gif': 'media',
  '.webp': 'media',
  '.svg': 'media',
  '.pdf': 'media',
};

// --------------------------------------------------------------- arguments
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    out[key] = key === 'dry-run' ? true : (argv[++i] ?? '');
  }
  return out;
}
const ARGS = parseArgs(process.argv.slice(2));
const DRY_RUN = Boolean(ARGS['dry-run']);

// ----------------------------------------------------------------- helpers
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const insideRoot = (p) => {
  const rel = path.relative(ROOT, p);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
};

/** Sans accents, sans espaces ni caractères spéciaux ; mots reliés par des tirets. */
function slug(text) {
  return text
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'Oe')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'Ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join('-');
}

function appliquerRemplacements(titre) {
  let t = titre;
  for (const { motif, par } of REMPLACEMENTS) {
    t = t.replace(new RegExp(`\\s*(?:[-–—]\\s*)?(?:${motif.source})`, 'gi'), ` ${par}`);
  }
  return t.replace(/\s+/g, ' ').trim();
}

const EMOJI_START = /^((?:\p{Extended_Pictographic}(?:\uFE0F|\u200D|\p{Emoji_Modifier})*)+)\s*/u;
const SECTION_PREFIX = /^(?:UE\s*)?\d+[-.]\d+[\s_-]+/i;

/** Déduit emoji, titre affiché et nom technique à partir du nom du fichier déposé. */
function analyse(fileName) {
  const ext0 = path.extname(fileName).toLowerCase();
  const ext = ext0 === '.htm' ? '.html' : ext0;
  let stem = path.basename(fileName, path.extname(fileName)).normalize('NFC').trim();
  stem = stem.replace(SECTION_PREFIX, ''); // « 2-1_ » déjà présent : on le remplace
  let emoji = '';
  const m = stem.match(EMOJI_START);
  if (m) {
    emoji = m[1];
    stem = stem.slice(m[0].length);
  }
  const title = /\s/.test(stem)
    ? stem.replace(/\s+/g, ' ').trim() // nom écrit avec des espaces : repris tel quel
    : stem.replace(/[-_]+/g, ' ').replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2').trim(); // Nom-DeFiche → Nom De Fiche
  // « Mark Map », « markmap »… → toujours « MarkMap » dans le nom du fichier (c'est lui qui déclenche la carte)
  const base = slug(stem).replace(/Mark-?Map/gi, 'MarkMap');
  return { ext, emoji, title: appliquerRemplacements(title), base };
}

/** Repère chaque onglet de l'index et les fiches qu'il contient. */
function parsePanels(html) {
  const re = /<div\s+class="panel-header"[^>]*>([\s\S]*?)<\/div>/g;
  const panels = [];
  let m;
  while ((m = re.exec(html))) {
    const label = m[1].replace(/<[^>]+>/g, '').replace('🔻', '').replace(/\s+/g, ' ').trim();
    const num = label.match(/(\d+\.\d+)\s*-/);
    panels.push({ label, number: num ? num[1] : null, start: m.index });
  }
  panels.forEach((p, i) => {
    p.end = i + 1 < panels.length ? panels[i + 1].start : html.length;
    const body = html.slice(p.start, p.end);
    const closeUl = body.lastIndexOf('</ul>');
    p.ulClose = closeUl === -1 ? -1 : p.start + closeUl;
    p.entries = [];
    const li = /<li(?:\s[^>]*)?>\s*<a\s[^>]*>([\s\S]*?)<\/a\s*>\s*<\/li\s*>/g;
    let e;
    while ((e = li.exec(body))) {
      p.entries.push({ label: e[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), start: p.start + e.index });
    }
  });
  return panels;
}

const lineStart = (html, pos) => html.lastIndexOf('\n', pos - 1) + 1;
const indentOf = (html, pos) => html.slice(lineStart(html, pos), pos).match(/^\s*/)[0];

/** Insère une ligne <li> dans l'onglet voulu, à la position pos (null = fin). */
function insertLi(html, section, pos, li) {
  const panel = parsePanels(html).find((p) => p.number === section);
  if (!panel || panel.ulClose === -1) throw new Error(`Onglet ${section} : structure inattendue.`);
  const at = pos === null || pos >= panel.entries.length ? panel.ulClose : panel.entries[pos].start;
  const indent =
    panel.entries.length > 0 ? indentOf(html, panel.entries[0].start) : indentOf(html, panel.ulClose) + '  ';
  const cut = lineStart(html, at);
  return html.slice(0, cut) + `${indent}${li}\n` + html.slice(cut);
}

/** Clé de tri d'une fiche : titre sans « UEx.y », sans emoji ni symbole de début, tirets normalisés. */
function sortKey(liHtml) {
  const a = liHtml.match(/<a\s[^>]*>([\s\S]*?)<\/a\s*>/);
  return (a ? a[1] : liHtml)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/^\s*UE\s*\d+(?:\.\d+)?/i, '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/\s*[-–—]\s*/g, ' - ') // « vie -3 » et « vie - 3 » se classent pareil
    .replace(/\s+/g, ' ')
    .trim();
}
const compareKeys = (a, b) => a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' });

/**
 * Classe par ordre alphabétique les fiches d'un onglet. Les lignes qui ne sont pas des fiches
 * (séparateur « --- ») restent en place et délimitent des groupes triés séparément.
 */
function sortPanelEntries(html, section) {
  const panel = parsePanels(html).find((p) => p.number === section);
  if (!panel || panel.ulClose === -1) return html;
  const ulOpen = html.indexOf('<ul', panel.start);
  const innerStart = html.indexOf('>', ulOpen) + 1;
  const inner = html.slice(innerStart, panel.ulClose);

  const items = [];
  const re = /<li(?:\s[^>]*)?>[\s\S]*?<\/li\s*>/g;
  let m;
  while ((m = re.exec(inner))) {
    items.push({ start: m.index, end: m.index + m[0].length, text: m[0], fiche: /<a\s/.test(m[0]) });
  }

  const sorted = items.map((it) => it.text);
  for (let i = 0; i < items.length; ) {
    if (!items[i].fiche) { i++; continue; }
    let j = i;
    while (j < items.length && items[j].fiche) j++;
    const groupe = items.slice(i, j).map((it) => ({ text: it.text, key: sortKey(it.text) }));
    groupe.sort((x, y) => compareKeys(x.key, y.key)); // tri stable : égalité = ordre actuel conservé
    groupe.forEach((g, k) => { sorted[i + k] = g.text; });
    i = j;
  }

  let out = '';
  let cursor = 0;
  items.forEach((it, idx) => {
    out += inner.slice(cursor, it.start) + sorted[idx];
    cursor = it.end;
  });
  out += inner.slice(cursor);
  return html.slice(0, innerStart) + out + html.slice(panel.ulClose);
}

// -------------------------------------------------------------------- main
function main() {
  const ue = ARGS.ue || 'UE2';
  const section = (ARGS.section || '').trim().replace(/^UE\s*/i, '').replace(/^(\d+)[-,_\s]+(\d+)$/, '$1.$2'); // 2-5, 2,5, UE2.5 → 2.5
  const inbox = path.resolve(ROOT, ARGS.dir || 'a-ajouter');
  const tag = DRY_RUN ? ' (SIMULATION)' : '';
  console.log(`=== Import de fiches${tag} : ${ue}, onglet ${section || '?'} ===`);

  if (!/^UE\d+$/.test(ue)) throw new Error(`UE invalide : « ${ue} ».`);
  const indexPath = path.join(ROOT, PAGES_DIR, ue, 'index.html');
  if (!fs.existsSync(indexPath)) throw new Error(`Index introuvable : ${path.relative(ROOT, indexPath)}`);
  let html = fs.readFileSync(indexPath, 'utf8');

  const panels = parsePanels(html);
  const panel = panels.find((p) => p.number === section);
  if (!panel) {
    const dispo = panels.map((p) => p.number).filter(Boolean).join(', ');
    throw new Error(`Onglet « ${section} » introuvable dans ${ue}. Disponibles : ${dispo}`);
  }

  let pos = null;
  if ((ARGS.after ?? '') !== '') {
    pos = Number(ARGS.after);
    if (!Number.isInteger(pos) || pos < 0 || pos > panel.entries.length) {
      throw new Error(`Position invalide : « ${ARGS.after} » (0 à ${panel.entries.length}).`);
    }
  }

  if (!insideRoot(inbox) || !fs.existsSync(inbox) || !fs.statSync(inbox).isDirectory()) {
    throw new Error(`Dossier « ${ARGS.dir || 'a-ajouter'} » introuvable dans le dépôt.`);
  }
  const names = fs
    .readdirSync(inbox, { withFileTypes: true })
    .filter((d) => d.isFile() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort((a, b) => analyse(a).title.localeCompare(analyse(b).title, 'fr', { numeric: true })); // ordre alphabétique du nom affiché
  if (!names.length) throw new Error(`Aucun fichier à traiter dans ${path.relative(ROOT, inbox)}/`);

  const manuel = pos !== null; // --after : placement manuel, sans tri alphabétique
  const rapport = []; // { ok, source, detail }
  for (const name of names) {
    const src = path.join(inbox, name);
    try {
      const a = analyse(name);
      const type = TYPES[a.ext];
      if (!type) throw new Error(`type « ${a.ext || 'inconnu'} » non géré`);
      if (!a.base) throw new Error('nom vide une fois nettoyé');

      const fileName = `${section.replace('.', '-')}_${a.base}${a.ext}`;
      const destDir = path.join(ROOT, type === 'media' ? MEDIA_DIR : path.join(PAGES_DIR, ue));
      const dest = path.join(destDir, fileName);
      if (fs.existsSync(dest)) throw new Error(`${path.relative(ROOT, dest)} existe déjà`);

      let url;
      if (type === 'page') url = `${BASE_URL}/${PAGES_DIR}/${ue}/${fileName}`;
      else if (type === 'markdown') {
        // « MarkMap » dans le nom du fichier → carte mentale interactive, sinon lecteur Markdown classique
        const viewer = /markmap/i.test(fileName) ? 'markmap-viewer.html' : 'md-viewer.html';
        url = `${BASE_URL}/${PAGES_DIR}/${viewer}?file=${ue}/${fileName}`;
      }
      else url = `${BASE_URL}/${MEDIA_DIR}/${fileName}`;
      if (html.includes(`href="${url}"`)) throw new Error('ce lien existe déjà dans l\'index');

      const emoji = a.emoji || (ARGS.emoji || '').trim();
      const label = `UE${section} ${emoji ? emoji + ' ' : ''}${a.title}`;
      const li = `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></li>`;

      html = insertLi(html, section, pos, li);
      if (pos !== null) pos += 1; // le lot reste dans l'ordre alphabétique
      if (!DRY_RUN) {
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, dest);
        fs.unlinkSync(src);
      }
      rapport.push({ ok: true, source: name, detail: `${path.relative(ROOT, dest)}  →  « ${label} »` });
    } catch (err) {
      rapport.push({ ok: false, source: name, detail: err.message });
    }
  }

  const ajoutees = rapport.some((r) => r.ok);
  let ordre = [];
  if (ajoutees && !manuel) {
    html = sortPanelEntries(html, section);
    ordre = (parsePanels(html).find((p) => p.number === section)?.entries ?? []).map((e) => e.label);
  }
  if (!DRY_RUN && ajoutees) fs.writeFileSync(indexPath, html, 'utf8');

  // ---- compte rendu
  console.log('');
  for (const r of rapport) console.log(`${r.ok ? '✔' : '✘'} ${r.source}\n    ${r.detail}`);
  const ok = rapport.filter((r) => r.ok).length;
  const ko = rapport.length - ok;
  console.log(`\n${ok} ajoutée(s), ${ko} en erreur${DRY_RUN ? ' — simulation : rien n\'a été modifié' : ''}.`);
  if (ko) console.log('Les fichiers en erreur sont restés dans le dossier : corrige et relance.');
  if (ordre.length) {
    console.log(`\nOrdre de l'onglet ${section} (classement alphabétique) :`);
    ordre.forEach((l, i) => console.log(`  ${String(i + 1).padStart(2)}. ${l}`));
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    const md = [
      `### Import ${ue} — onglet ${section}${DRY_RUN ? ' (simulation)' : ''}`,
      '',
      ...rapport.map((r) => `- ${r.ok ? '✅' : '❌'} \`${r.source}\` — ${r.detail}`),
      '',
      ...(ordre.length
        ? ['<details><summary>Ordre de l\'onglet ' + section + '</summary>', '', ...ordre.map((l, i) => `${i + 1}. ${l}`), '', '</details>', '']
        : []),
    ].join('\n');
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  }
  if (ko) process.exitCode = 1;
}

try {
  main();
} catch (err) {
  console.error(`\nErreur : ${err.message}`);
  process.exitCode = 1;
}
