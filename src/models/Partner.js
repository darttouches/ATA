import mongoose from 'mongoose';

const PartnerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a partner name'],
        trim: true,
    },
    logo: {
        type: String,
        required: [true, 'Please provide a logo URL'],
    },
    website: {
        type: String,
        trim: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    order: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Partner || mongoose.model('Partner', PartnerSchema);
