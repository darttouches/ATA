import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Veuillez fournir un titre'],
    },
    type: {
        type: String,
        enum: ['event', 'formation', 'photo', 'video', 'news'],
        required: true,
    },
    description: String,
    date: String,
    time: String,
    mediaUrl: String,
    photos: [String], // Array of photo URLs
    videoUrl: String,
    link: String, // Dynamic link (Facebook event, etc.)
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    isBestOff: {
        type: Boolean,
        default: false,
    },
    onHome: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Content || mongoose.model('Content', ContentSchema);
