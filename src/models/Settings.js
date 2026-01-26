import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
    key: { type: String, unique: true, required: true },
    value: mongoose.Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
