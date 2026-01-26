import mongoose from 'mongoose';

const PollSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Veuillez fournir une question'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    options: [{
        text: { type: String, required: true },
        votes: { type: Number, default: 0 }
    }],
    allowMultiple: {
        type: Boolean,
        default: false
    },
    visibility: {
        type: String,
        enum: ['members', 'public'],
        default: 'public'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'closed'],
        default: 'pending'
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: false // Can be national (admin) or club-specific
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    voters: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ip: String, // For visitors tracking to prevent duplicate votes
        votedAt: { type: Date, default: Date.now }
    }],
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    hidden: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Poll || mongoose.model('Poll', PollSchema);
