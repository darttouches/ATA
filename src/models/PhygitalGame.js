import mongoose from 'mongoose';

const PhygitalGameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Veuillez nommer la partie'],
    },
    description: {
        type: String,
    },
    location: {
        type: String,
    },
    startTime: {
        type: Date,
        required: [true, 'Veuillez définir une date/heure de début'],
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'completed'],
        default: 'draft',
    },
    mapTexture: {
        type: String,
        enum: ['map_general', 'map_desert', 'map_foret', 'map_plage'],
        default: 'map_general',
    },
    stages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhygitalStage'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

if (process.env.NODE_ENV === 'development' && mongoose.models.PhygitalGame) {
    delete mongoose.models.PhygitalGame;
}

export default mongoose.models.PhygitalGame || mongoose.model('PhygitalGame', PhygitalGameSchema);
