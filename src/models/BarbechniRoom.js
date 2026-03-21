import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    recipientId: { type: String, required: true },
    type: { type: String, enum: ['question', 'reclamation'], required: true },
    content: { type: String, required: true },
    response: String,
    isRead: { type: Boolean, default: false },
    isAnonymous: { type: Boolean, default: true },
    voteResults: {
        yes: [String], // User IDs who voted YES (show name)
        no: [String],  // User IDs who voted NO (stay anonymous)
        total: { type: Number, default: 0 }
    },
    votingActive: { type: Boolean, default: false }
}, { timestamps: true });

const barbechniRoomSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ['waiting', 'writing', 'reading', 'finished'], default: 'waiting' },
    createdBy: { type: String, required: true },
    players: [{
        _id: String,
        name: String,
        photo: String,
        club: String,
        color: String,
        icon: String,
        isGM: { type: Boolean, default: false }
    }],
    cards: [cardSchema],
    currentReadingPlayerIndex: { type: Number, default: 0 },
    currentCardIndex: { type: Number, default: 0 },
    settings: {
        allowAnonymityVote: { type: Boolean, default: true },
        allowQuestion: { type: Boolean, default: true },
        allowReclamation: { type: Boolean, default: true }
    }
}, { timestamps: true });

// Check if model exists before compiling
export default mongoose.models.BarbechniRoom || mongoose.model('BarbechniRoom', barbechniRoomSchema);
