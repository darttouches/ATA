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
        const groupId = searchParams.get('groupId');

        if (!recipientId && !groupId) return NextResponse.json({ error: 'ID du destinataire ou du groupe requis' }, { status: 400 });

        await dbConnect();

        if (groupId) {
            // Fetch messages for the group
            const messages = await ChatMessage.find({ group: groupId }).sort({ createdAt: 1 });

            // Mark group messages as read by current user
            await ChatMessage.updateMany(
                { group: groupId, readBy: { $ne: currentUser.userId }, sender: { $ne: currentUser.userId } },
                { $addToSet: { readBy: currentUser.userId } }
            );

            return NextResponse.json(messages);
        } else {
            // Fetch messages between currentUser and recipientId
            const messages = await ChatMessage.find({
                $or: [
                    { sender: currentUser.userId, recipient: recipientId },
                    { sender: recipientId, recipient: currentUser.userId }
                ]
            }).sort({ createdAt: 1 });

            // Mark incoming private messages as read
            await ChatMessage.updateMany(
                { sender: recipientId, recipient: currentUser.userId, isRead: false },
                { $set: { isRead: true } }
            );

            return NextResponse.json(messages);
        }
    } catch (error) {
        console.error('Chat Messages Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { recipientId, groupId, message } = await req.json();

        if ((!recipientId && !groupId) || !message) {
            return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
        }

        await dbConnect();

        const messageData = {
            sender: currentUser.userId,
            message,
            readBy: [currentUser.userId]
        };

        if (groupId) {
            messageData.group = groupId;
        } else {
            messageData.recipient = recipientId;
        }

        const newMessage = await ChatMessage.create(messageData);

        return NextResponse.json(newMessage);
    } catch (error) {
        console.error('Chat Send Error:', error);
        return NextResponse.json({ error: 'Erreur lors de l\'envoi' }, { status: 500 });
    }
}
