import mongoose from 'mongoose';

const RegistrationSchema = new mongoose.Schema({
    action: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Action',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    nationality: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    occupation: {
        type: String,
        required: true
    },
    customAnswers: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isMember: {
        type: Boolean,
        default: false
    },
    clubName: {
        type: String,
        default: ''
    },
    ticketCode: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['confirmed', 'cancelled', 'attended'],
        default: 'confirmed'
    },
    attended: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);
