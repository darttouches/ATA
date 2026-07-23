import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: 60,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        select: false, // Do not return password by default
    },
    firstName: {
        type: String,
        required: false,
    },
    lastName: {
        type: String,
        required: false,
    },
    phone: {
        type: String,
        required: false,
    },
    birthDate: {
        type: Date,
        required: false,
    },
    profileImage: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    role: {
        type: String,
        enum: ['admin', 'president', 'membre', 'national'],
        default: 'membre',
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: false, // For chefs (assigned)
    },
    preferredClub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: false, // Selected during signup
    },
    bonusPoints: {
        type: Number,
        default: 0,
    },
    lastActive: {
        type: Date,
        default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isPaid: {
        type: Boolean,
        default: false,
    },
    memberNumber: {
        type: String,
        required: false,
    },
    sessionId: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    facebook: String,
    instagram: String,
    whatsapp: String,
    linkedin: String,
    website: String,
    officialRole: String, // Assigned by admin/president
    interviewCode: {
        type: String,
        required: false,
    },
    season: {
        type: String,
        default: '2025/2026',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
});

UserSchema.index({ email: 1, season: 1 }, { unique: true });

if (process.env.NODE_ENV === 'development' && mongoose.models.User) {
    delete mongoose.models.User;
}

// Robust export for Next.js HMR
export default mongoose.models.User || mongoose.model('User', UserSchema);
