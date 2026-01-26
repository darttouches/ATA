import mongoose from 'mongoose';

const ClubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a club name'],
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    address: {
        type: String,
    },
    coordinates: {
        lat: { type: Number, default: 36.8065 }, // Default to Tunis
        lng: { type: Number, default: 10.1815 }
    },
    coverImage: {
        type: String,
        default: '/images/default-club-cover.jpg',
    },
    logo: {
        type: String,
        default: '/images/default-club-logo.jpg',
    },
    socialLinks: {
        facebook: String,
        instagram: String,
        youtube: String,
        website: String,
    },
    activeMembers: [{
        name: String,
        photo: String, // URL
        role: String,
        month: String, // e.g., "Janvier 2026"
    }],
    partnerReviews: [{
        author: String,
        content: String,
        organization: String,
    }],
    chief: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

ClubSchema.pre('save', function () {
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-')
            .trim();
    }
});

// Force model rebuild in dev to apply schema changes
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Club;
}

export default mongoose.models.Club || mongoose.model('Club', ClubSchema);
