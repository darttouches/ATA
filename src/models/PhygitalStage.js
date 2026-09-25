import mongoose from 'mongoose';

const PhygitalStageSchema = new mongoose.Schema({
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhygitalGame',
        required: true,
    },
    order: {
        type: Number,
        required: true,
    },
    title: {
        type: String,
    },
    clueText: {
        type: String,
        required: true,
    },
    validationType: {
        type: String,
        enum: ['text', 'choice', 'qr', 'nfc'],
        default: 'text',
    },
    correctAnswer: {
        type: String,
        required: true, 
        select: false, // Ensure this is not sent to the client by default
    },
    choices: {
        type: [String], // Populated if validationType is 'choice'
    },
    hints: [{
        text: String,
        pointPenalty: { type: Number, default: 0 }
    }],
    basePoints: {
        type: Number,
        default: 100,
    },
    firstSolveTime: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

if (process.env.NODE_ENV === 'development' && mongoose.models.PhygitalStage) {
    delete mongoose.models.PhygitalStage;
}

export default mongoose.models.PhygitalStage || mongoose.model('PhygitalStage', PhygitalStageSchema);
