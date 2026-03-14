const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI not found in .env file');
    process.exit(1);
}

// User Schema
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function resetPassword(email, newPassword) {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        const result = await User.updateOne({ email: email }, { password: hash });

        if (result.matchedCount > 0) {
            console.log(`SUCCESS: Password for ${email} reset to: ${newPassword}`);
        } else {
            console.log(`ERROR: User ${email} not found.`);
        }

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node reset-auth.js <email> <newPassword>');
    process.exit(1);
}

resetPassword(args[0], args[1]);
