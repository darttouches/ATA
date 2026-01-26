
const mongoose = require('mongoose');

// MONGODB_URI should be in env but for this script I'll assume it's available or use a fallback
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/touches_dart";

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const UserSchema = new mongoose.Schema({
            role: String
        }, { strict: false });

        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        const result = await User.updateMany(
            { role: 'chef' },
            { $set: { role: 'president' } }
        );

        console.log(`Updated ${result.modifiedCount} users from 'chef' to 'president'`);

        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
