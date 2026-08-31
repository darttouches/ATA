// Script de migration : retrouve tous les scans NFC existants dans ScanEvent
// et injecte les entrées manquantes dans User.scoreHistory
// Utilisation : node migrate-scan-history.js

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
    const scanEvents = db.collection('scanevents');
    const users = db.collection('users');

    // Récupérer tous les ScanEvents
    const events = await scanEvents.find({}).toArray();
    console.log(`📋 ${events.length} événements trouvés`);

    let totalUpdated = 0;

    for (const event of events) {
        if (!event.scannedUsers || event.scannedUsers.length === 0) continue;

        const eventTitle = event.title || 'Événement';
        const eventDate = event.date ? new Date(event.date).toLocaleDateString('fr-FR') : '—';
        const reason = `Présence: ${eventTitle} (${eventDate})`;

        for (const scanned of event.scannedUsers) {
            if (!scanned.userId) continue;

            const userId = new mongoose.Types.ObjectId(scanned.userId);

            // Vérifier si une entrée pour cet événement existe déjà dans scoreHistory
            const user = await users.findOne({ _id: userId });
            if (!user) continue;

            const history = user.scoreHistory || [];
            const alreadyExists = history.some(h => h.reason === reason);

            if (!alreadyExists) {
                // Ajouter l'entrée de présence à l'historique
                await users.updateOne(
                    { _id: userId },
                    {
                        $push: {
                            scoreHistory: {
                                points: 1,
                                reason: reason,
                                addedBy: 'Système NFC',
                                date: scanned.scannedAt || event.createdAt || new Date()
                            }
                        }
                    }
                );
                totalUpdated++;
                console.log(`  ✅ Ajouté: ${user.firstName || user.name} → ${reason}`);
            }
        }
    }

    console.log(`\n✅ Migration terminée : ${totalUpdated} entrées ajoutées dans l'historique.`);
    await mongoose.disconnect();
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Erreur migration :', err);
    process.exit(1);
});
