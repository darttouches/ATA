# 🎨 Touches d'Art - Site Web Officiel

Site web officiel de l'association **Touches d'Art**, une plateforme moderne pour gérer les clubs, événements, membres et contenus de l'association.

## 🚀 Technologies utilisées

### Frontend & Backend
- **Framework**: [Next.js 16](https://nextjs.org/) (React 19)
- **Styling**: CSS Modules + Variables CSS personnalisées
- **Icons**: [Lucide React](https://lucide.dev/)
- **Maps**: [Leaflet](https://leafletjs.com/) + React Leaflet
- **Charts**: [Recharts](https://recharts.org/)

### Base de données & Stockage
- **Base de données**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Cloud)
- **ODM**: [Mongoose](https://mongoosejs.com/)
- **Stockage médias**: [Cloudinary](https://cloudinary.com/) (Images & Vidéos)

### Authentification & Sécurité
- **Auth**: JWT (JSON Web Tokens)
- **Hashing**: bcryptjs
- **Cookies**: Secure HTTP-only cookies

### Hébergement
- **Plateforme**: [Vercel](https://vercel.com/) (Déploiement automatique)
- **CDN**: Global (Cloudinary + Vercel Edge Network)

---

## 📋 Fonctionnalités

### Pour les visiteurs
- ✅ Découverte des clubs et leurs activités
- ✅ Consultation des événements et formations
- ✅ Galerie photos et vidéos
- ✅ Carte interactive des implantations
- ✅ Page "À propos" avec l'équipe dirigeante
- ✅ Système de sondages publics
- ✅ Multilingue (Français/Anglais)

### Pour les membres
- ✅ Inscription et connexion sécurisée
- ✅ Profil personnalisé avec QR code
- ✅ Système de points et récompenses
- ✅ Participation aux sondages
- ✅ Consultation de l'historique des événements

### Pour les présidents de clubs
- ✅ Gestion des événements de leur club
- ✅ Création de sondages
- ✅ Gestion des membres actifs
- ✅ Tableau de bord avec statistiques
- ✅ Système de témoignages

### Pour les administrateurs
- ✅ Gestion complète des clubs
- ✅ Modération du contenu
- ✅ Gestion des utilisateurs et rôles
- ✅ Gestion des partenaires
- ✅ Configuration de la page "À propos"
- ✅ Statistiques globales
- ✅ Approbation des sondages

---

## 🛠️ Installation locale

### Prérequis
- Node.js 18+ et npm
- Un compte MongoDB Atlas (gratuit)
- Un compte Cloudinary (gratuit)

### Étapes

1. **Cloner le repository**
   ```bash
   git clone <votre-repo>
   cd siteATA/frontend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   
   Copiez `.env.example` vers `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Puis remplissez les valeurs dans `.env`:
   ```bash
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   MONGODB_URI=mongodb+srv://...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   JWT_SECRET=...
   EMAIL_USER=...
   EMAIL_PASS=...
   ```

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```
   
   Ouvrez [http://localhost:3000](http://localhost:3000)

5. **Créer un compte admin**
   
   Utilisez le script de réinitialisation:
   ```bash
   node reset-admin.js
   ```
   
   Credentials par défaut:
   - Email: `admin@touchesdart.com`
   - Mot de passe: `Admin123!`

---

## 🚀 Déploiement en production

Consultez le guide complet de déploiement: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

### Résumé rapide

1. **Cloudinary**: Créez un compte et récupérez vos clés
2. **MongoDB Atlas**: Configurez Network Access (0.0.0.0/0)
3. **Vercel**: Importez le projet et ajoutez les variables d'environnement
4. **Deploy**: Vercel déploiera automatiquement à chaque push

---

## 📁 Structure du projet

```
frontend/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── api/               # API Routes
│   │   ├── dashboard/         # Pages admin/président
│   │   ├── about/             # Page "À propos"
│   │   ├── clubs/             # Pages des clubs
│   │   └── ...
│   ├── components/            # Composants réutilisables
│   ├── context/               # Contexts React (Auth, Language)
│   ├── lib/                   # Utilitaires (db, auth, cloudinary)
│   └── models/                # Modèles Mongoose
├── public/                    # Assets statiques
├── .env                       # Variables d'environnement (local)
├── .env.example              # Template des variables
├── DEPLOYMENT.md             # Guide de déploiement
└── package.json
```

---

## 🔐 Sécurité

- ✅ Authentification JWT avec cookies HTTP-only
- ✅ Mots de passe hashés avec bcrypt
- ✅ Protection CSRF
- ✅ Variables d'environnement sécurisées
- ✅ Validation des données côté serveur
- ✅ Système de rôles (admin, president, member, visitor)

---

## 🌍 Multilingue

Le site supporte:
- 🇫🇷 Français (par défaut)
- 🇬🇧 Anglais

Les traductions sont gérées via le `LanguageContext`.

---

## 📊 Limites des plans gratuits

- **Vercel**: 100 GB bande passante/mois
- **MongoDB Atlas**: 512 MB stockage
- **Cloudinary**: 25 GB stockage + 25 GB bande passante/mois

Ces limites sont largement suffisantes pour démarrer!

---

## 🆘 Support

Pour toute question ou problème:
1. Consultez [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Vérifiez les logs dans Vercel
3. Contactez l'équipe de développement

---

## 📝 License

© 2026 Touches d'Art. Tous droits réservés.

---

**Développé avec ❤️ pour Touches d'Art** 🎨✨

