import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subscription: {
        endpoint: { type: String, required: true },
        expirationTime: { type: Number, default: null },
        keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true }
        }
    },
    userAgent: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Avoid duplicate subscriptions for the same user on the same endpoint
SubscriptionSchema.index({ user: 1, 'subscription.endpoint': 1 }, { unique: true });

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
