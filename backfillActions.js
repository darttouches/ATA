require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

// Need to run this from frontend dir to load .env.local
async function backfill() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const Content = require('./src/models/Content').default || mongoose.model('Content');
    const Action = require('./src/models/Action').default || mongoose.model('Action');

    const approvedEvents = await Content.find({ type: { $in: ['event', 'formation'] }, status: 'approved' });
    console.log(`Found ${approvedEvents.length} approved events to sync.`);

    let count = 0;
    for (const content of approvedEvents) {
        const exists = await Action.findOne({ contentRef: content._id });
        if (!exists) {
            let clubId = null;
            if (content.club) clubId = content.club;
            else if (content.clubs && content.clubs.length > 0) clubId = content.clubs[0];

            await Action.create({
                title: content.title || 'Sans titre',
                description: content.description || ' ',
                startDate: content.date ? new Date(content.date) : new Date(),
                localTime: content.time || '00:00',
                club: clubId,
                status: 'approved',
                contentRef: content._id
            });
            count++;
        }
    }

    console.log(`Successfully backfilled ${count} actions.`);
    process.exit(0);
}

backfill();
