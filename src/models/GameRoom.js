import mongoose from 'mongoose';

const GameRoomSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        unique: true,
        required: true,
        maxlength: 6,
    },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    gameType: {
        type: String,
        default: 'loup-garou',
    },
    mode: {
        type: String,
        enum: ['online', 'presence'],
        required: true,
    },
    status: {
        type: String,
        enum: ['waiting', 'playing', 'finished'],
        default: 'waiting',
    },
    players: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false, // For presence mode, some players might not be registered
        },
        name: String,
        roleId: String,
        isAlive: {
            type: Boolean,
            default: true,
        },
        isRevealed: {
            type: Boolean,
            default: false,
        }
    }],
    rolePool: [String], // List of roleIds included in this session
    chat: [{
        senderId: String,
        senderName: String,
        message: String,
        type: { type: String, enum: ['text', 'audio', 'system'], default: 'text' },
        isDirectToMj: { type: Boolean, default: false }, // If true, only MJ and sender can see it
        createdAt: { type: Date, default: Date.now }
    }],
    voteState: {
        isActive: { type: Boolean, default: false },
        votes: [{
            voterId: String,
            targetId: String // who they voted against
        }],
        title: String // e.g. "Le village vote"
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: '24h' } // Autoclean rooms after 24h
    }
});

export default mongoose.models.GameRoom || mongoose.model('GameRoom', GameRoomSchema);
