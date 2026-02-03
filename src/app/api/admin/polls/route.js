import dbConnect from '@/lib/db';
import Poll from '@/models/Poll';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        await dbConnect();
        const polls = await Poll.find({})
            .populate('club', 'name')
            .populate('author', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json(polls);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const { id, status } = await req.json();
        await dbConnect();

        // 1. Update the poll
        const poll = await Poll.findByIdAndUpdate(id, { status }, { new: true });

        if (!poll) return NextResponse.json({ error: 'Sondage introuvable' }, { status: 404 });

        // 2. Notify the Author
        if (poll.author) {
            const Notification = (await import('@/models/Notification')).default;

            const statusLabel = status === 'approved' ? 'approuvé' : 'rejeté';
            const title = `Sondage ${statusLabel}`;
            const message = `Votre sondage "${poll.question}" a été ${statusLabel} par le Bureau National.`;

            await Notification.create({
                recipient: poll.author,
                type: 'poll_status',
                title,
                message,
                link: '/dashboard/my-club/polls'
            });
        }

        return NextResponse.json(poll);
    } catch (error) {
        console.error('Error updating poll status:', error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        await dbConnect();
        await Poll.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
