import mongoose from 'mongoose';

const MeetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
    },
    description: {
        type: String,
        required: false,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    scheduledAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    lateLimitMinutes: {
        type: Number,
        default: 15,
    },
    roomName: {
        type: String,
        required: true,
        unique: true,
    },
    type: {
        type: String,
        enum: ['direct', 'scheduled'],
        default: 'direct',
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    presentMembers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    clubs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club'
    }],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
