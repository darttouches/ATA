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
        enum: ['content_submission', 'content_approved', 'content_rejected', 'new_message', 'new_reclamation', 'new_demand', 'new_voice', 'action_status', 'poll_status'],
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

// Middleware to send push notification after saving
NotificationSchema.post('save', async function (doc) {
    try {
        const Subscription = mongoose.model('Subscription');
        const subscriptions = await Subscription.find({ user: doc.recipient });

        if (subscriptions.length === 0) return;

        const webpush = (await import('web-push')).default;

        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:darttouches@gmail.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );

        const payload = JSON.stringify({
            title: doc.title,
            body: doc.message,
            url: doc.link || '/dashboard/notifications'
        });

        const sendPromises = subscriptions.map(sub =>
            webpush.sendNotification(sub.subscription, payload)
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        return Subscription.deleteOne({ _id: sub._id });
                    }
                    console.error('Push Send Error:', err);
                })
        );

        await Promise.all(sendPromises);
    } catch (error) {
        console.error('Push Notification Error:', error);
    }
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
