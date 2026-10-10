#!/usr/bin/env node
/**
 * Ajoute une fiche au site : copie le fichier au bon endroit, le renomme
 * proprement et insère la ligne correspondante dans l'index de l'UE.
 *
 * Mode interactif (terminal) :
 *   node scripts/ajouter.mjs [--dry-run]
 *
 * Mode automatique (GitHub Actions) : dès que --file est fourni
 *   node scripts/ajouter.mjs --file ma-fiche.html --ue UE2 --section 2.4 \
 *        --title "Traumatisme Crânien" [--emoji 🧠] [--after 3] [--name 2-4_X.html] \
 *        [--deplacer] [--dry-run]
 *   --after : insérer après la fiche n° N (0 = tout en haut, absent = à la fin)
 *   --deplacer : supprime le fichier source une fois copié
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------- réglages
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'https://alifsicrip.github.io/cours'; // mettre '' pour des liens relatifs à la racine
const PAGES_DIR = 'pages';
const MEDIA_DIR = 'assets/img'; // images et PDF

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
    out[key] = key === 'dry-run' || key === 'deplacer' ? true : (argv[++i] ?? '');
  }
  return out;
}
const ARGS = parseArgs(process.argv.slice(2));
const AUTO = ARGS.file !== undefined;
const DRY_RUN = Boolean(ARGS['dry-run']);

// ------------------------------------------------------------------ saisie
let rl;
let lines;
function initRl() {
  rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  lines = rl[Symbol.asyncIterator]();
}

async function ask(question, fallback = '') {
  rl.setPrompt(fallback ? `${question} [${fallback}] ` : `${question} `);
  rl.prompt();
  const { value, done } = await lines.next();
  if (done) throw new Error('Saisie interrompue.');
  return value.trim() || fallback;
}

async function askChoice(question, options, { fallbackIndex } = {}) {
  console.log(`\n${question}`);
  options.forEach((o, i) => console.log(`  ${String(i + 1).padStart(2)}. ${o}`));
  for (;;) {
    const raw = await ask('Numéro :', fallbackIndex !== undefined ? String(fallbackIndex + 1) : '');
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 1 && n <= options.length) return n - 1;
    console.log('  Choix invalide.');
  }
}

// ----------------------------------------------------------------- helpers
function cleanPath(raw) {
  let p = raw.trim().replace(/^['"]|['"]$/g, ''); // guillemets
  p = p.replace(/\\(.)/g, '$1'); // espaces échappés (glisser-déposer)
  if (p.startsWith('~')) p = path.join(os.homedir(), p.slice(1));
  return path.resolve(p);
}

function slug(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/['’]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .join('-');
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const insideRoot = (p) => {
  const rel = path.relative(ROOT, p);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
};

function listUEs() {
  const dir = path.join(ROOT, PAGES_DIR);
  return fs
    .readdirSync(dir)
    .filter((d) => /^UE\d+$/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
    .sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));
}

/** Repère chaque panneau (onglet) de l'index et les fiches qu'il contient. */
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
      p.entries.push({
        label: e[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
        start: p.start + e.index,
      });
    }
  });
  return panels;
}

const lineStart = (html, pos) => html.lastIndexOf('\n', pos - 1) + 1;
const indentOf = (html, pos) => html.slice(lineStart(html, pos), pos).match(/^\s*/)[0];

// -------------------------------------------------------------------- main
async function main() {
  if (!AUTO) initRl();
  const tag = DRY_RUN ? ' (SIMULATION)' : '';
  console.log(`=== Ajout d'une fiche${tag} ===`);

  // 1. UE
  const ues = listUEs();
  if (!ues.length) throw new Error(`Aucune UE trouvée dans ${PAGES_DIR}/`);
  let ue;
  if (AUTO) {
    ue = ARGS.ue || 'UE2';
    if (!ues.includes(ue)) throw new Error(`UE inconnue : ${ue}. Disponibles : ${ues.join(', ')}`);
  } else {
    const def = ues.indexOf('UE2') >= 0 ? ues.indexOf('UE2') : 0;
    ue = ues[await askChoice('Pour quelle UE ?', ues, { fallbackIndex: def })];
  }
  const indexPath = path.join(ROOT, PAGES_DIR, ue, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  const panels = parsePanels(html);
  if (!panels.length) throw new Error(`Aucun onglet reconnu dans ${indexPath}`);

  // 2. Fichier source
  let src;
  if (AUTO) {
    src = path.resolve(ROOT, ARGS.file);
    if (!insideRoot(src)) throw new Error('Le fichier doit se trouver dans le dépôt.');
    if (!fs.existsSync(src) || !fs.statSync(src).isFile()) throw new Error(`Fichier introuvable : ${ARGS.file}`);
    if (!TYPES[path.extname(src).toLowerCase()]) {
      throw new Error(`Type non géré. Formats acceptés : ${Object.keys(TYPES).join(' ')}`);
    }
  } else {
    for (;;) {
      src = cleanPath(await ask('\nFichier à ajouter (glisse-le ici) :'));
      if (!fs.existsSync(src) || !fs.statSync(src).isFile()) console.log('  Fichier introuvable.');
      else if (!TYPES[path.extname(src).toLowerCase()]) {
        console.log(`  Type non géré. Formats acceptés : ${Object.keys(TYPES).join(' ')}`);
      } else break;
    }
  }
  let ext = path.extname(src).toLowerCase();
  if (ext === '.htm') ext = '.html';
  const type = TYPES[ext];

  // 3. Nom, emoji, onglet
  const title = AUTO ? (ARGS.title || '').trim() : await ask('\nNom affiché (ex : Traumatisme Crânien) :');
  if (!title) throw new Error('Le nom est obligatoire.');
  const emoji = AUTO ? (ARGS.emoji || '').trim() : await ask('Emoji (facultatif) :');

  let panel;
  if (AUTO) {
    panel = panels.find((p) => p.number === (ARGS.section || '').trim());
    if (!panel) {
      const dispo = panels.map((p) => p.number).filter(Boolean).join(', ');
      throw new Error(`Onglet « ${ARGS.section} » introuvable. Disponibles : ${dispo}`);
    }
  } else {
    panel = panels[await askChoice('Dans quel onglet ?', panels.map((p) => p.label))];
  }
  const section = panel.number ?? ue.slice(2);

  // 4. Position
  let pos = panel.entries.length; // fin par défaut
  if (AUTO) {
    if ((ARGS.after ?? '') !== '') {
      const n = Number(ARGS.after);
      if (!Number.isInteger(n) || n < 0 || n > panel.entries.length) {
        throw new Error(`Position invalide : « ${ARGS.after} » (0 à ${panel.entries.length}).`);
      }
      pos = n;
    }
  } else if (panel.entries.length) {
    console.log(`\nFiches actuelles de « ${panel.label} » :`);
    panel.entries.forEach((e, i) => console.log(`  ${String(i + 1).padStart(2)}. ${e.label}`));
    const raw = await ask('Insérer APRÈS le numéro (0 = tout en haut, Entrée = à la fin) :');
    if (raw !== '') {
      const n = Number(raw);
      if (Number.isInteger(n) && n >= 0 && n <= panel.entries.length) pos = n;
      else console.log('  Valeur ignorée, ajout à la fin.');
    }
  }

  // 5. Nom de fichier et lien
  const proposed = `${section.replace('.', '-')}_${slug(title)}${ext}`;
  const chosen = AUTO ? ARGS.name || proposed : await ask('\nNom du fichier', proposed);
  const fileName = chosen.replace(/[^\w.\-]/g, '_');
  const destDir = path.join(ROOT, type === 'media' ? MEDIA_DIR : path.join(PAGES_DIR, ue));
  const dest = path.join(destDir, fileName);

  let url;
  if (type === 'page') url = `${BASE_URL}/${PAGES_DIR}/${ue}/${fileName}`;
  else if (type === 'markdown') url = `${BASE_URL}/${PAGES_DIR}/md-viewer.html?file=${ue}/${fileName}`;
  else url = `${BASE_URL}/${MEDIA_DIR}/${fileName}`;

  const label = `UE${section} ${emoji ? emoji + ' ' : ''}${title}`;
  const li = `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></li>`;

  if (html.includes(`href="${url}"`)) throw new Error("Ce lien existe déjà dans l'index.");
  const same = path.resolve(dest) === path.resolve(src);
  const overwrite = fs.existsSync(dest) && !same;
  if (overwrite && AUTO) throw new Error(`${path.relative(ROOT, dest)} existe déjà : choisis un autre nom (--name).`);

  // 6. Récapitulatif
  console.log('\n--- Récapitulatif ---');
  console.log(`Fichier  : ${path.relative(ROOT, dest)}`);
  console.log(`Onglet   : ${panel.label}`);
  console.log(`Position : ${pos === panel.entries.length ? 'à la fin' : pos === 0 ? 'tout en haut' : `après « ${panel.entries[pos - 1].label} »`}`);
  console.log(`Ligne    : ${li}`);
  if (overwrite) console.log('⚠  Un fichier du même nom existe déjà : il sera REMPLACÉ.');
  if (!AUTO && (await ask('\nConfirmer ? (O/n)', 'O')).toLowerCase().startsWith('n')) {
    console.log('Annulé.');
    return;
  }

  // 7. Écriture
  if (panel.ulClose === -1) throw new Error('Pas de </ul> dans cet onglet : structure inattendue.');
  const target = pos < panel.entries.length ? panel.entries[pos].start : panel.ulClose;
  const indent =
    panel.entries.length > 0 ? indentOf(html, panel.entries[0].start) : indentOf(html, panel.ulClose) + '  ';
  const at = lineStart(html, target);
  const updated = html.slice(0, at) + `${indent}${li}\n` + html.slice(at);

  if (DRY_RUN) {
    console.log('\nSimulation terminée : aucun fichier modifié.');
    return;
  }
  fs.mkdirSync(destDir, { recursive: true });
  if (!same) fs.copyFileSync(src, dest);
  fs.writeFileSync(indexPath, updated, 'utf8');
  if (ARGS.deplacer && !same && insideRoot(src)) fs.unlinkSync(src);

  console.log(`\n✔ Fiche ajoutée à ${path.relative(ROOT, indexPath)}`);
  if (!AUTO) console.log('Étape suivante : git add -A && git commit -m "ajout fiche" && git push');
}

try {
  await main();
} catch (err) {
  console.error(`\nErreur : ${err.message}`);
  process.exitCode = 1;
} finally {
  rl?.close();
}
