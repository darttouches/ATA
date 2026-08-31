const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://darttouches_db_user:darttouches123%40@cluster1.pmflizw.mongodb.net/siteATA?retryWrites=true&w=majority&appName=Cluster1";

async function migrate() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const UserSchema = new mongoose.Schema({
            name: String,
            email: String,
            password: { type: String, select: false },
            role: String,
            status: String,
            isActive: Boolean,
            club: mongoose.Schema.Types.ObjectId,
            season: String
        }, { strict: false });

        const ClubSchema = new mongoose.Schema({
            name: String,
            slug: String,
            clubAccountId: mongoose.Schema.Types.ObjectId,
            approvedEventsCount: Number,
            isActive: Boolean
        }, { strict: false });

        const ActionSchema = new mongoose.Schema({
            club: mongoose.Schema.Types.ObjectId,
            status: String
        }, { strict: false });

        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        const Club = mongoose.models.Club || mongoose.model('Club', ClubSchema);
        const Action = mongoose.models.Action || mongoose.model('Action', ActionSchema);

        const clubs = await Club.find({});
        console.log(`Found ${clubs.length} total clubs`);

        const createdAccounts = [];

        for (const club of clubs) {
            // Count approved actions for this club
            const approvedEventsCount = await Action.countDocuments({ club: club._id, status: 'approved' });
            club.approvedEventsCount = approvedEventsCount;
            if (club.isActive === undefined) {
                club.isActive = true;
            }

            if (!club.clubAccountId) {
                const slug = club.slug || club.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const email = `club.${slug}@ata.tn`;
                const defaultPassword = `ClubATA2026!`;

                let clubUser = await User.findOne({ email });

                if (!clubUser) {
                    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
                    clubUser = await User.create({
                        name: club.name,
                        email: email,
                        password: hashedPassword,
                        role: 'club',
                        status: 'approved',
                        isActive: true,
                        club: club._id,
                        season: '2025/2026'
                    });
                    console.log(`Created account for club "${club.name}": Email=${email}, Password=${defaultPassword}`);
                } else {
                    clubUser.role = 'club';
                    clubUser.status = 'approved';
                    clubUser.club = club._id;
                    await clubUser.save();
                    console.log(`Linked existing user for club "${club.name}": Email=${email}`);
                }

                club.clubAccountId = clubUser._id;
                createdAccounts.push({ club: club.name, email, password: defaultPassword });
            }

            await club.save();
        }

        console.log("\n==========================================");
        console.log("Migration finished successfully!");
        console.log("Summary of created/linked club accounts:");
        console.table(createdAccounts);
        console.log("==========================================");

        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
