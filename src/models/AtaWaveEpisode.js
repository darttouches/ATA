import mongoose from 'mongoose';

const AtaWaveEpisodeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    animator: { type: String },
    coverImage: { type: String },
    videoUrl: { type: String, required: true },
    publishedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.AtaWaveEpisode || mongoose.model('AtaWaveEpisode', AtaWaveEpisodeSchema);
