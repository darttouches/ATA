
import mongoose from 'mongoose';

const TestimonialSchema = new mongoose.Schema({
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: String, // fallback if no user
        required: function () { return !this.user; }
    },
    content: {
        type: String,
        required: [true, 'Please provide content'],
        trim: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5,
    },
    approved: {
        type: Boolean,
        default: false, // Requires admin/chief approval
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema);
