import mongoose from 'mongoose';

const Wasaaa3RoomSchema = new mongoose.Schema({
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
    status: {
        type: String,
        enum: ['waiting', 'playing', 'finished'],
        default: 'waiting',
    },
    players: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: String,
        profileImage: String,
        ready: {
            type: Boolean,
            default: false
        },
        score: {
            type: Number,
            default: 0
        },
        energy: {
            type: Number,
            default: 0
        },
        finalHearts: {
            type: Number,
            default: 3
        },
        isFinished: {
            type: Boolean,
            default: false
        },
        finishedAt: Date
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: '24h' }
    }
});

export default mongoose.models.Wasaaa3Room || mongoose.model('Wasaaa3Room', Wasaaa3RoomSchema);
