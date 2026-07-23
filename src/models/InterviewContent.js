import mongoose from 'mongoose';

const InterviewContentSchema = new mongoose.Schema({
    type: { type: String, enum: ['question', 'remark'], required: true },
    text: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.InterviewContent || mongoose.model('InterviewContent', InterviewContentSchema);
