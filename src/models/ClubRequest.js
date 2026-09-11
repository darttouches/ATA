import mongoose from 'mongoose';

const ClubRequestSchema = new mongoose.Schema({
    clubName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    president: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    vicePresident: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    secretary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    hr: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    events: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    communication: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Force model rebuild in dev
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.ClubRequest;
}

export default mongoose.models.ClubRequest || mongoose.model('ClubRequest', ClubRequestSchema);
