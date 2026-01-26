import mongoose from 'mongoose';

const BoardMemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
    },
    role: {
        type: String,
        required: [true, 'Please provide a role'],
        trim: true,
    },
    photo: {
        type: String,
        required: [true, 'Please provide a photo URL'],
    },
    order: {
        type: Number,
        default: 0,
    },
    active: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.BoardMember || mongoose.model('BoardMember', BoardMemberSchema);
