import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Optional for group messages
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatGroup',
        required: false, // Optional for direct messages
    },
    message: {
        type: String,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
