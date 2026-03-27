import mongoose from 'mongoose';

const GameScoreSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    gameId: { type: String, required: true, default: 'wasaaa3' },
    score: { type: Number, required: true, default: 0 },
    energy: { type: Number, required: true, default: 0 },
    distance: { type: Number, required: true, default: 0 },
    metadata: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now }
});

// Index for top 10 performance
GameScoreSchema.index({ gameId: 1, score: -1, energy: -1 });

export default mongoose.models.GameScore || mongoose.model('GameScore', GameScoreSchema);
