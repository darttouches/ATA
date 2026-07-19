import mongoose from 'mongoose';

const LocalizedString = {
    ar: { type: String, required: true },
    fr: { type: String, required: false },
    en: { type: String, required: false }
};

const QuizQuestionSchema = new mongoose.Schema({
    questionText: LocalizedString,
    options: [{
        text: LocalizedString,
        isCorrect: { type: Boolean, required: true }
    }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.QuizQuestion || mongoose.model('QuizQuestion', QuizQuestionSchema);
