# 🚀 Guide de Déploiement - Touches d'Art

Ce guide vous accompagne pour déployer votre application sur **Vercel** avec **MongoDB Atlas** et **Cloudinary**.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir:
- ✅ Un compte GitHub avec votre code pushé
- ✅ MongoDB Atlas configuré (déjà fait ✓)
- ⚠️ Un compte Cloudinary à créer

---

## 1️⃣ Configuration Cloudinary

### Étape 1: Créer un compte Cloudinary

1. Allez sur [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Inscrivez-vous gratuitement (10 GB de stockage gratuit)
3. Confirmez votre email

### Étape 2: Récupérer vos identifiants

1. Connectez-vous à [https://cloudinary.com/console](https://cloudinary.com/console)
2. Sur le Dashboard, vous verrez:
   - **Cloud Name** (ex: `dxxxxx`)
   - **API Key** (ex: `123456789012345`)
   - **API Secret** (cliquez sur "Reveal" pour voir)

### Étape 3: Mettre à jour votre fichier `.env`

Remplacez les valeurs dans votre fichier `.env`:

```bash
CLOUDINARY_CLOUD_NAME=votre_cloud_name_ici
CLOUDINARY_API_KEY=votre_api_key_ici
CLOUDINARY_API_SECRET=votre_api_secret_ici
```

### Étape 4: Tester localement

```bash
# Redémarrez votre serveur de développement
npm run dev
```

Essayez d'uploader une image dans votre application. Elle devrait maintenant être uploadée sur Cloudinary!

---

## 2️⃣ Préparation pour Vercel

### Vérifier que tout fonctionne localement

```bash
# Installer les dépendances
npm install

# Build de production (pour tester)
npm run build

# Démarrer en mode production
npm start
```

Si le build réussit, vous êtes prêt pour le déploiement!

---

## 3️⃣ Déploiement sur Vercel

### Étape 1: Créer un compte Vercel

1. Allez sur [https://vercel.com/signup](https://vercel.com/signup)
2. Inscrivez-vous avec votre compte GitHub

### Étape 2: Importer votre projet

1. Cliquez sur **"Add New Project"**
2. Sélectionnez votre repository GitHub `siteATA`
3. Vercel détectera automatiquement Next.js

### Étape 3: Configurer les variables d'environnement

Dans la section **"Environment Variables"**, ajoutez toutes vos variables:

```bash
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app

MONGODB_URI=mongodb+srv://darttouches_db_user:darttouches123@cluster1.pmflizw.mongodb.net/siteATA?retryWrites=true&w=majority&appName=Cluster1

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=darttouches@gmail.com
EMAIL_PASS=12345678@

JWT_SECRET=CHANGEZ_CECI_PAR_UN_SECRET_FORT_ET_ALEATOIRE

CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

⚠️ **IMPORTANT**: Générez un nouveau `JWT_SECRET` fort pour la production!

```bash
# Vous pouvez générer un secret aléatoire avec:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Étape 4: Déployer

1. Cliquez sur **"Deploy"**
2. Attendez quelques minutes (2-3 minutes)
3. Votre site sera accessible sur `https://votre-projet.vercel.app`

---

## 4️⃣ Configuration MongoDB Atlas (Sécurité)

### Autoriser Vercel à accéder à MongoDB

1. Allez sur [MongoDB Atlas](https://cloud.mongodb.com)
2. Cliquez sur **"Network Access"** (dans le menu gauche)
3. Cliquez sur **"Add IP Address"**
4. Sélectionnez **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ C'est nécessaire car Vercel utilise des IPs dynamiques
5. Cliquez sur **"Confirm"**

---

## 5️⃣ Domaine personnalisé (Optionnel)

### Ajouter votre propre domaine

1. Dans Vercel, allez dans **Settings** > **Domains**
2. Ajoutez votre domaine (ex: `touchesdart.com`)
3. Suivez les instructions pour configurer les DNS
4. Mettez à jour `NEXT_PUBLIC_APP_URL` avec votre nouveau domaine

---

## 🔒 Sécurité - Points importants

### ⚠️ À FAIRE AVANT LA PRODUCTION:

1. **Changez le JWT_SECRET**:
   ```bash
   # Générez un secret fort
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Changez le mot de passe email** si vous utilisez Gmail:
   - Utilisez un "App Password" au lieu du mot de passe principal
   - Guide: https://support.google.com/accounts/answer/185833

3. **Sécurisez MongoDB**:
   - Utilisez un mot de passe fort pour l'utilisateur MongoDB
   - Limitez les permissions de l'utilisateur

4. **Variables d'environnement**:
   - Ne commitez JAMAIS le fichier `.env` dans Git
   - Le `.gitignore` devrait contenir `.env`

---

## 📊 Monitoring et Logs

### Voir les logs sur Vercel

1. Allez dans votre projet sur Vercel
2. Cliquez sur l'onglet **"Deployments"**
3. Cliquez sur un déploiement
4. Cliquez sur **"Functions"** pour voir les logs des API routes

### Voir les métriques MongoDB

1. Allez sur MongoDB Atlas
2. Cliquez sur votre cluster
3. Onglet **"Metrics"** pour voir l'utilisation

### Voir l'utilisation Cloudinary

1. Allez sur Cloudinary Dashboard
2. Vous verrez le stockage utilisé et la bande passante

---

## 🆘 Dépannage

### Le site ne se charge pas

1. Vérifiez les logs dans Vercel
2. Vérifiez que toutes les variables d'environnement sont définies
3. Vérifiez que MongoDB Atlas autorise les connexions (Network Access)

### Les images ne s'uploadent pas

1. Vérifiez vos identifiants Cloudinary
2. Vérifiez les logs dans Vercel > Functions
3. Vérifiez que vous n'avez pas dépassé le quota gratuit (10GB)

### Erreur de connexion MongoDB

1. Vérifiez que l'IP 0.0.0.0/0 est autorisée dans Network Access
2. Vérifiez que le mot de passe dans `MONGODB_URI` est correct
3. Vérifiez que le nom de la base de données est correct

---

## 📈 Limites des plans gratuits

### Vercel (Hobby - Gratuit)
- ✅ Bande passante: 100 GB/mois
- ✅ Builds: Illimités
- ✅ Domaines personnalisés: Illimités
- ⚠️ Limite: 100 GB de bande passante

### MongoDB Atlas (Free Tier)
- ✅ Stockage: 512 MB
- ✅ RAM: Partagée
- ⚠️ Limite: 512 MB de données

### Cloudinary (Free Tier)
- ✅ Stockage: 25 GB
- ✅ Bande passante: 25 GB/mois
- ✅ Transformations: 25 crédits/mois
- ⚠️ Limite: 25 GB de stockage

**Pour votre projet, les plans gratuits devraient être largement suffisants au début!**

---

## ✅ Checklist finale

Avant de mettre en production:

- [ ] MongoDB Atlas configuré avec IP 0.0.0.0/0 autorisée
- [ ] Cloudinary configuré avec les bonnes clés
- [ ] JWT_SECRET changé pour un secret fort
- [ ] Email configuré avec App Password
- [ ] Build local réussi (`npm run build`)
- [ ] Variables d'environnement ajoutées dans Vercel
- [ ] Premier déploiement réussi
- [ ] Test de connexion (login/signup)
- [ ] Test d'upload d'images
- [ ] Test de création de contenu

---

## 🎉 Félicitations!

Votre site est maintenant en production sur une infrastructure professionnelle:
- 🚀 **Hébergement**: Vercel (CDN mondial, HTTPS automatique)
- 💾 **Base de données**: MongoDB Atlas (réplication, backups automatiques)
- 🖼️ **Médias**: Cloudinary (CDN, optimisation automatique)

**Profitez de votre site en production!** 🎨✨
