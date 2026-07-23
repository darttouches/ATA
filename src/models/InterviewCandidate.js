import mongoose from 'mongoose';

const InterviewCandidateSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, // 8 char code
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    interviewDate: { type: Date, required: true },
    
    // Status can be: 'pending' (waiting for date), 'in-progress', 'completed'
    status: { type: String, default: 'pending' },
    
    // Decision by admin: 'pending', 'accepted', 'rejected'
    decision: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    decisionDate: { type: Date },
    decisionReason: { type: String },
    
    // Assigned questions for this specific candidate
    questions: [{
        originalId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewContent' },
        text: { type: String }, // Saved text in case global question changes
        answer: { type: String, default: '' },
        answeredAt: { type: Date }
    }],
    
    // Assigned remarks
    remarks: [{
        text: { type: String }
    }],

    rulesConfirmed: { type: Boolean, default: false },
}, { timestamps: true });

if (process.env.NODE_ENV === 'development' && mongoose.models.InterviewCandidate) {
    delete mongoose.models.InterviewCandidate;
}

export default mongoose.models.InterviewCandidate || mongoose.model('InterviewCandidate', InterviewCandidateSchema);
