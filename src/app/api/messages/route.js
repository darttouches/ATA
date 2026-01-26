import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import Notification from '@/models/Notification';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const otherUserId = searchParams.get('userId');

        await dbConnect();
        const messages = await Message.find({
            $or: [
                { sender: user.userId, receiver: otherUserId },
                { sender: otherUserId, receiver: user.userId }
            ]
        }).sort({ createdAt: 1 });

        return NextResponse.json(messages);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { receiverId, content } = await req.json();
        await dbConnect();

        const message = await Message.create({
            sender: user.userId,
            receiver: receiverId,
            content
        });

        // Create notification for receiver
        await Notification.create({
            recipient: receiverId,
            sender: user.userId,
            type: 'new_message',
            title: 'Nouveau message',
            message: `${user.name} vous a envoyé un message : ${content.substring(0, 30)}...`,
            link: '/dashboard/messages'
        });

        return NextResponse.json(message);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }
}
