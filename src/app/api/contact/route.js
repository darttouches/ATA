import dbConnect from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { subject, message, email } = await req.json();

        await dbConnect();

        // 1. Save the message
        const contactMessage = await ContactMessage.create({
            subject,
            message,
            email
        });

        // 2. Notify Admins
        const admins = await User.find({ role: 'admin' });

        for (const admin of admins) {
            await Notification.create({
                recipient: admin._id,
                type: subject === 'reclamation' ? 'new_reclamation' : 'new_message',
                title: `Nouveau message: ${subject}`,
                message: `De: ${email}\n\n${message.substring(0, 50)}...`,
                link: (subject === 'reclamation' || subject === 'partenariat') ? '/dashboard/reclamations' : '/dashboard/messages'
            });
        }

        return NextResponse.json({ success: true, data: contactMessage });
    } catch (error) {
        console.error('Contact API Error:', error);
        return NextResponse.json({ success: false, error: 'Erreur lors de l\'envoi du message' }, { status: 500 });
    }
}
