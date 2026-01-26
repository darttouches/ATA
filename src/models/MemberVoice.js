import mongoose from 'mongoose';

const MemberVoiceSchema = new mongoose.Schema({
    message: {
        type: String,
        required: [true, 'Le message est obligatoire'],
    },
    isAnonymous: {
        type: Boolean,
        default: false,
    },
    name: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: false,
    },
    phone: {
        type: String,
        required: false,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: false, // Can be null if user has no club
    },
    status: {
        type: String,
        enum: ['nouveau', 'en_cours', 'traite'],
        default: 'nouveau',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.MemberVoice || mongoose.model('MemberVoice', MemberVoiceSchema);
