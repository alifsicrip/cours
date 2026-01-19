# 🚀 Guide de déploiement - IFSI CRIP GitHub Pages

## 📋 Prérequis

- Un compte GitHub
- Git installé sur votre ordinateur
- Un éditeur de texte (VS Code, Sublime Text, etc.)

---

## 🎯 Étape 1 : Configuration initiale du dépôt

### 1.1 Vérifier le dépôt
```bash
# Vérifier que vous êtes dans le bon dépôt
git remote -v
# Devrait afficher : https://github.com/alifsicrip/lessons.git
```

### 1.2 Structure des fichiers
Assurez-vous d'avoir cette structure :
```
lessons/
├── index.html
├── styles.css
├── script.js
├── README.md
├── GUIDE_UTILISATION.md
├── DEPLOYMENT.md
├── _config.yml
├── .gitignore
├── template-ue.html
└── [Dossiers UE]/
```

---

## 📤 Étape 2 : Premier déploiement

### 2.1 Ajouter tous les fichiers
```bash
# Ajouter tous les fichiers
git add .

# Vérifier les fichiers ajoutés
git status
```

### 2.2 Créer le commit
```bash
# Créer le commit avec un message descriptif
git commit -m "Initial deployment - IFSI CRIP site structure"
```

### 2.3 Pousser vers GitHub
```bash
# Pousser vers la branche main
git push origin main
```

---

## ⚙️ Étape 3 : Activer GitHub Pages

### 3.1 Accéder aux paramètres
1. Allez sur https://github.com/alifsicrip/lessons
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu latéral, cliquez sur **Pages**

### 3.2 Configurer la source
1. Sous **Source**, sélectionnez :
   - Branch : `main`
   - Folder : `/ (root)`
2. Cliquez sur **Save**

### 3.3 Attendre le déploiement
- GitHub Pages prend 1-5 minutes pour déployer
- Une fois prêt, un lien apparaîtra : `https://alifsicrip.github.io/lessons/`

---

## 📁 Étape 4 : Organiser les documents par UE

### 4.1 Créer la structure de dossiers
```bash
# Créer les dossiers pour chaque UE
mkdir -p UE1-1 UE1-2 UE1-3
mkdir -p UE2-1 UE2-2 UE2-3 UE2-4 UE2-5 UE2-6 UE2-7 UE2-8 UE2-9 UE2-10 UE2-11
mkdir -p UE3-1 UE3-2 UE3-3 UE3-4 UE3-5
mkdir -p UE4-1 UE4-2 UE4-3 UE4-4 UE4-5 UE4-6 UE4-7 UE4-8
mkdir -p UE5-1 UE5-2 UE5-3 UE5-4 UE5-5 UE5-6 UE5-7 UE5-8
```

### 4.2 Exemple de structure UE
```
UE2-1/
├── cours-01-biologie-cellulaire.pdf
├── cours-02-genetique.pdf
├── TD-exercices-biologie.pdf
└── ressources/
    ├── schema-cellule.png
    └── tableau-genetique.xlsx
```

---

## 📝 Étape 5 : Ajouter des documents

### 5.1 Ajouter un nouveau document
```bash
# Copier le document dans le bon dossier
cp ~/Downloads/cours-biologie.pdf UE2-1/

# Ajouter à Git
git add UE2-1/cours-biologie.pdf

# Commit
git commit -m "Add: Cours de biologie fondamentale UE 2.1"

# Push
git push origin main
```

### 5.2 Mettre à jour script.js
Après avoir ajouté des documents, mettez à jour le fichier `script.js` :

```javascript
// Dans le fichier script.js, trouvez la section ueData
// Ajoutez vos documents comme ceci :

'ue2-1': {
    title: 'UE 2.1 - Biologie fondamentale',
    // ...
    documents: [
        { name: 'Cours 1 - Biologie cellulaire', type: 'pdf', size: '2.4 MB', path: 'UE2-1/cours-01-biologie-cellulaire.pdf' },
        { name: 'Cours 2 - Génétique', type: 'pdf', size: '3.1 MB', path: 'UE2-1/cours-02-genetique.pdf' }
    ]
}
```

---

## 🔄 Étape 6 : Mises à jour régulières

### 6.1 Workflow standard
```bash
# 1. Récupérer les dernières modifications
git pull origin main

# 2. Ajouter vos modifications
git add .

# 3. Créer un commit descriptif
git commit -m "Update: Ajout cours UE 2.1 et correction UE 3.2"

# 4. Pousser vers GitHub
git push origin main
```

### 6.2 Messages de commit recommandés
- `Add: [description]` - Ajout de nouveau contenu
- `Update: [description]` - Mise à jour de contenu existant
- `Fix: [description]` - Correction de bug
- `Remove: [description]` - Suppression de contenu
- `Style: [description]` - Modifications visuelles

**Exemples :**
```bash
git commit -m "Add: Cours de pharmacologie S3 UE 2.11"
git commit -m "Update: Correction typos dans README"
git commit -m "Fix: Problème d'affichage menu mobile"
```

---

## 🎨 Étape 7 : Personnalisation

### 7.1 Modifier les couleurs
Éditez `styles.css` pour changer les couleurs :
```css
:root {
    --primary-blue: #0071BC;    /* Changer cette valeur */
    --primary-teal: #00A19A;    /* Changer cette valeur */
    /* etc. */
}
```

### 7.2 Modifier le contenu d'accueil
Éditez la fonction `getWelcomeContent()` dans `script.js`

### 7.3 Ajouter une nouvelle UE
1. Créez le dossier correspondant
2. Ajoutez l'entrée dans `ueData` dans `script.js`
3. Ajoutez le bouton dans le menu de `index.html`

---

## 🔍 Étape 8 : Vérification et tests

### 8.1 Vérifier en local
```bash
# Option 1 : Serveur Python simple
python -m http.server 8000

# Option 2 : Serveur Node.js (si installé)
npx http-server

# Puis ouvrez : http://localhost:8000
```

### 8.2 Checklist avant déploiement
- [ ] Tous les liens fonctionnent
- [ ] Les images s'affichent correctement
- [ ] La recherche fonctionne
- [ ] Le menu mobile s'ouvre/ferme bien
- [ ] Les documents sont dans les bons dossiers
- [ ] Le zoom fonctionne
- [ ] Responsive OK (tester plusieurs tailles d'écran)

### 8.3 Vérifier le site en ligne
Après chaque push, attendez 2-3 minutes puis vérifiez :
- https://alifsicrip.github.io/lessons/

---

## 🐛 Dépannage

### Problème : Le site ne se met pas à jour
**Solution :**
1. Vider le cache : Ctrl + F5 (ou Cmd + Shift + R sur Mac)
2. Vérifier que le commit a bien été poussé : `git log`
3. Attendre 5 minutes (GitHub Pages peut être lent)

### Problème : Erreur 404 sur les documents
**Solution :**
1. Vérifier que le fichier existe bien dans le dossier
2. Vérifier le chemin dans `script.js`
3. Vérifier que le fichier a été commit : `git ls-files`

### Problème : GitHub Pages ne s'active pas
**Solution :**
1. Vérifier que le dépôt est public
2. Vérifier que vous avez un fichier `index.html` à la racine
3. Retourner dans Settings > Pages et réactiver

### Problème : Modifications CSS/JS non prises en compte
**Solution :**
1. Vider le cache navigateur
2. Ajouter un paramètre version dans l'URL :
```html
<link rel="stylesheet" href="styles.css?v=2">
<script src="script.js?v=2"></script>
```

---

## 📊 Étape 9 : Monitoring et maintenance

### 9.1 Statistiques GitHub
- Allez dans **Insights** > **Traffic** pour voir les visites
- Vérifiez les **Commits** pour suivre l'historique

### 9.2 Sauvegarde régulière
```bash
# Créer une branche de backup
git checkout -b backup-2025-01
git push origin backup-2025-01

# Revenir sur main
git checkout main
```

### 9.3 Maintenance mensuelle
- [ ] Vérifier tous les liens
- [ ] Supprimer les documents obsolètes
- [ ] Mettre à jour le README si nécessaire
- [ ] Vérifier la compatibilité navigateurs
- [ ] Nettoyer les fichiers inutilisés

---

## 🔐 Sécurité et bonnes pratiques

### ✅ À faire
- ✅ Commit régulièrement (au moins une fois par semaine)
- ✅ Utiliser des messages de commit clairs
- ✅ Tester en local avant de push
- ✅ Garder une structure de dossiers cohérente
- ✅ Nommer les fichiers clairement (sans espaces ni accents)

### ❌ À éviter
- ❌ Committer des fichiers trop volumineux (>50MB)
- ❌ Mettre des informations personnelles sensibles
- ❌ Committer directement sur main sans tester
- ❌ Utiliser des espaces ou caractères spéciaux dans les noms de fichiers

---

## 📞 Support

### Ressources GitHub Pages
- Documentation officielle : https://docs.github.com/pages
- Statut GitHub : https://www.githubstatus.com/

### Aide Git
- Guide Git : https://git-scm.com/doc
- Cheat sheet : https://education.github.com/git-cheat-sheet-education.pdf

---

## 🎓 Commandes Git essentielles - Mémo

```bash
# Voir l'état des fichiers
git status

# Voir l'historique
git log --oneline

# Annuler les modifications locales
git checkout -- fichier.txt

# Récupérer la dernière version
git pull origin main

# Créer une branche
git checkout -b nouvelle-branche

# Fusionner une branche
git merge nom-branche

# Supprimer un fichier
git rm fichier.pdf
git commit -m "Remove: ancien document"
git push

# Renommer un fichier
git mv ancien-nom.pdf nouveau-nom.pdf
git commit -m "Rename: fichier pour clarté"
git push
```

---

**✅ Votre site est maintenant déployé !**

Site accessible sur : **https://alifsicrip.github.io/lessons/**

Pour toute question : anais.logerais@ifsi-crip.fr

---

*Dernière mise à jour : Novembre 2025*
