import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    type: {
        type: String,
        enum: ['content_submission', 'content_approved', 'content_rejected', 'new_message', 'new_reclamation', 'new_demand', 'new_voice'],
        required: true,
    },
    title: String,
    message: String,
    link: String,
    isRead: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
