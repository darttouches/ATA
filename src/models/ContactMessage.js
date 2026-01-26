import mongoose from 'mongoose';

const ContactMessageSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        enum: ['info', 'partenariat', 'reclamation', 'autre']
    },
    message: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'replied'],
        default: 'unread'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema);
