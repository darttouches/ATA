import dbConnect from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { id } = await params;
        const { message, isDeleted } = await req.json();

        await dbConnect();

        const chatMessage = await ChatMessage.findById(id);
        if (!chatMessage) return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 });

        // Only the sender can edit or delete their message
        if (chatMessage.sender.toString() !== currentUser.userId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        if (chatMessage.isDeleted) {
            return NextResponse.json({ error: 'Impossible de modifier un message supprimé' }, { status: 400 });
        }

        if (isDeleted) {
            chatMessage.isDeleted = true;
            chatMessage.message = 'Message supprimé';
        } else if (message) {
            chatMessage.message = message;
            chatMessage.isEdited = true;
        }

        await chatMessage.save();

        return NextResponse.json(chatMessage);
    } catch (error) {
        console.error('Chat Message PATCH Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    // We treat DELETE as soft delete to leave a trace as requested
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { id } = await params;

        await dbConnect();

        const chatMessage = await ChatMessage.findById(id);
        if (!chatMessage) return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 });

        if (chatMessage.sender.toString() !== currentUser.userId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        chatMessage.isDeleted = true;
        chatMessage.message = 'Message supprimé';
        await chatMessage.save();

        return NextResponse.json({ success: true, message: chatMessage });
    } catch (error) {
        console.error('Chat Message DELETE Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
