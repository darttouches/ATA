import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        await dbConnect();
        const userId = user.userId || user.id || user._id;

        const count = await Notification.countDocuments({ 
            recipient: userId, 
            isRead: false 
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error('Unread Notifications Count Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
