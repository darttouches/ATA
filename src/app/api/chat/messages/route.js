import dbConnect from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const recipientId = searchParams.get('recipientId');

        if (!recipientId) return NextResponse.json({ error: 'ID du destinataire requis' }, { status: 400 });

        await dbConnect();

        // Fetch messages between currentUser and recipientId
        const messages = await ChatMessage.find({
            $or: [
                { sender: currentUser.userId, recipient: recipientId },
                { sender: recipientId, recipient: currentUser.userId }
            ]
        }).sort({ createdAt: 1 });

        // Mark incoming messages as read
        await ChatMessage.updateMany(
            { sender: recipientId, recipient: currentUser.userId, isRead: false },
            { $set: { isRead: true } }
        );

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Chat Messages Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { recipientId, message } = await req.json();

        if (!recipientId || !message) {
            return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
        }

        await dbConnect();

        const newMessage = await ChatMessage.create({
            sender: currentUser.userId,
            recipient: recipientId,
            message
        });

        return NextResponse.json(newMessage);
    } catch (error) {
        console.error('Chat Send Error:', error);
        return NextResponse.json({ error: 'Erreur lors de l\'envoi' }, { status: 500 });
    }
}
