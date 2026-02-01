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
        unique: true,
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
        enum: ['admin', 'president', 'membre'],
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
});

if (mongoose.models.User) {
    delete mongoose.models.User;
}

export default mongoose.model('User', UserSchema);
