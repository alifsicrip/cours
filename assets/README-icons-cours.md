# Icône & PWA — site Cours

## 1. Fichiers à déposer

Dans `assets/icons/` :
- `favicon.ico`
- `icon.svg`
- `apple-touch-icon.png`
- `icon-192.png`
- `icon-512.png`

À la racine du repo :
- `manifest.json` (renommer `manifest-cours.json` téléchargé précédemment)

## 2. Bloc à coller dans le `<head>`

Chemins **absolus** — le même bloc fonctionne sur toutes les pages, quel que soit leur niveau de dossier.

```html
<link rel="icon" href="/cours/assets/icons/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/cours/assets/icons/icon.svg">
<link rel="apple-touch-icon" href="/cours/assets/icons/apple-touch-icon.png">
<link rel="manifest" href="/cours/manifest.json">
```

Remplace la ligne `<!-- Favicon -->` existante par ce bloc.

## 3. Pages à mettre à jour (8 au total)

- [ ] `index.html`
- [ ] `vocabulaire.html`
- [ ] `pages/UE1/index.html`
- [ ] `pages/UE2/index.html`
- [ ] `pages/UE3/index.html`
- [ ] `pages/UE4/index.html`
- [ ] `pages/UE5/index.html`
- [ ] `pages/UE6/index.html`

## 4. Vérification

Une fois en ligne (après un push GitHub Pages, ça prend 1–2 min) :
1. Ouvre chaque page → l'icône doit apparaître dans l'onglet du navigateur.
2. Sur mobile (Chrome Android) : menu ⋮ → **Ajouter à l'écran d'accueil**. L'icône bleu-turquoise doit apparaître, et le site s'ouvre en plein écran sans barre d'adresse.
3. Optionnel : teste sur [manifest-validator.appspot.com](https://manifest-validator.appspot.com) que le `manifest.json` est bien lu (colle l'URL `https://alifsicrip.github.io/cours/manifest.json`).

## 5. Couleurs utilisées

| Usage | Couleur |
|---|---|
| Fond icône / `theme_color` | `#1D4F5C` |
| Accent (pouls) | `#1A9AA4` |

Palette reprise directement du logo personnel (`AL_Logo_color-17.png`).
