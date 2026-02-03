const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI not found in .env file');
    process.exit(1);
}

// Define User Schema inline to avoid import issues
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'president', 'membre'], default: 'membre' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    preferredClub: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    bonusPoints: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// Create model (or get existing if already compiled)
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function resetAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // Find admin
        let admin = await User.findOne({ role: 'admin' });

        if (admin) {
            console.log('Admin found:', admin.email);
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('123456xata', salt);

            // Update password directly
            await User.updateOne({ _id: admin._id }, { password: hash });
            console.log('SUCCESS: Admin password reset to: 123456xata');
        } else {
            console.log('No admin found. Creating one...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456xata', salt);

            await User.create({
                name: 'Admin',
                email: 'admin@ata.com',
                password: hashedPassword,
                role: 'admin',
                status: 'approved'
            });
            console.log('SUCCESS: Created admin user (admin@ata.com) with password: 123456xata');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

resetAdmin();
