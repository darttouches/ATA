import mongoose from 'mongoose';

const AboutSectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['objective', 'domain', 'value', 'general'], default: 'general' },
    icon: { type: String }, // Store icon name from lucide-react
    images: { type: [String], default: [] },
    imageLayout: { type: String, enum: ['top', 'bottom', 'left', 'right', 'grid'], default: 'bottom' },
    buttonText: { type: String },
    buttonLink: { type: String },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
}, { timestamps: true });

// Force model rebuild in dev to apply schema changes
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.AboutSection;
}

export default mongoose.model('AboutSection', AboutSectionSchema);
