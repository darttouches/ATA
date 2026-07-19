import mongoose from 'mongoose';

const LocalizedString = {
    ar: { type: String, required: true },
    fr: { type: String, required: false },
    en: { type: String, required: false }
};

const RuleSchema = new mongoose.Schema({
    category: { type: String, required: true },
    fullText: LocalizedString,
    shortTextToType: LocalizedString,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Rule || mongoose.model('Rule', RuleSchema);
