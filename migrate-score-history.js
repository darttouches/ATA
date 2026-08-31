// Script de migration : injecte une entrée scoreHistory initiale pour tous les membres 
// qui ont bonusPoints >= 1 mais un scoreHistory vide.
// Utilisation : node migrate-score-history.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function migrate() {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI manquant dans .env');
        process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const users = db.collection('users');

    // Trouver tous les utilisateurs sans historique
    const result = await users.updateMany(
        { 
            status: 'approved',
            $or: [
                { scoreHistory: { $exists: false } },
                { scoreHistory: { $size: 0 } }
            ]
        },
        {
            $set: {
                scoreHistory: [{
                    points: 1,
                    reason: 'Score de départ (compte activé)',
                    addedBy: 'Système',
                    date: new Date()
                }]
            }
        }
    );

    console.log(`✅ ${result.modifiedCount} membres mis à jour avec un historique initial.`);
    await mongoose.disconnect();
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Erreur migration :', err);
    process.exit(1);
});
