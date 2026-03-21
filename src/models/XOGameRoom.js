import mongoose from 'mongoose';

const XOGameRoomSchema = new mongoose.Schema({
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
            required: false,
        },
        name: String,
        symbol: String, // 'X' or 'O'
        reserveCount: {
            type: Number,
            default: 4
        },
        ready: {
            type: Boolean,
            default: false
        }
    }],
    board: {
        type: [[String]], // 4x4 array of 'X', 'O', or null
        default: [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null]
        ]
    },
    currentTurn: {
        type: String, // userId or 'player1' / 'player2'
        default: 'X'
    },
    winner: String,
    history: [String],
    reactions: [{
        userId: String,
        type: String, // 'laugh', 'angry', 'cry'
        timestamp: Number
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: '24h' }
    }
});

export default mongoose.models.XOGameRoom || mongoose.model('XOGameRoom', XOGameRoomSchema);
