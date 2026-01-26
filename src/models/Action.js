
import mongoose from 'mongoose';

const ActionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an action title'],
        trim: true,
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide a start date'],
    },
    endDate: {
        type: Date, // Optional, can be same as startDate
    },
    localTime: {
        type: String, // e.g. "14:30"
        required: [true, 'Please provide a time'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true,
    },
    attendees: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        present: {
            type: Boolean,
            default: false,
        },
        remark: {
            type: String,
            trim: true,
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Calculate metrics like "attendance rate" if needed later

export default mongoose.models.Action || mongoose.model('Action', ActionSchema);
