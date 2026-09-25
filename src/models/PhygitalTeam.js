import mongoose from 'mongoose';

const StageRecordSchema = new mongoose.Schema({
    stageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhygitalStage',
    },
    completedAt: {
        type: Date,
    },
    pointsEarned: {
        type: Number,
        default: 0,
    },
    hintsUsed: {
        type: Number,
        default: 0,
    }
}, { _id: false });

const PhygitalTeamSchema = new mongoose.Schema({
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhygitalGame',
        required: true,
    },
    teamName: {
        type: String,
        required: true,
    },
    accessCode: {
        type: String,
        required: true, // Will be generated randomly for quick login
    },
    members: {
        type: [String], // Can just be names
        default: [],
    },
    currentStageIndex: {
        type: Number,
        default: 0, // Starts at the first stage (0)
    },
    score: {
        type: Number,
        default: 0,
    },
    stageRecords: [StageRecordSchema], // Log when they finish stages
    completed: {
        type: Boolean,
        default: false,
    },
    completedAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// An access code should be unique per game
PhygitalTeamSchema.index({ gameId: 1, accessCode: 1 }, { unique: true });

if (process.env.NODE_ENV === 'development' && mongoose.models.PhygitalTeam) {
    delete mongoose.models.PhygitalTeam;
}

export default mongoose.models.PhygitalTeam || mongoose.model('PhygitalTeam', PhygitalTeamSchema);
