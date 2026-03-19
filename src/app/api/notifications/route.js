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
        console.log('Fetching notifications for recipient ID:', userId);

        const totalInDb = await Notification.countDocuments();
        console.log('Total notifications in database:', totalInDb);

        const notifications = await Notification.find({ recipient: userId }).sort({ createdAt: -1 });
        console.log(`Found ${notifications.length} notifications for this user`);

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Notifications GET Error:', error);
        return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { id } = await req.json();
        await dbConnect();
        await Notification.findByIdAndUpdate(id, { isRead: true });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

        await dbConnect();
        const notification = await Notification.findById(id);

        if (!notification) {
            return NextResponse.json({ error: 'Notification introuvable' }, { status: 404 });
        }

        // ONLY allow deletion if user is an admin
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
        }

        await Notification.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Notification DELETE Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
