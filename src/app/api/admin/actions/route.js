import dbConnect from '@/lib/db';
import Action from '@/models/Action';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const actions = await Action.find({})
            .populate('club', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json(actions);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { id, status } = await req.json();
        await dbConnect();

        // 1. Update the action
        const updatedAction = await Action.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('club');

        if (!updatedAction) return NextResponse.json({ error: 'Action introuvable' }, { status: 404 });

        // 2. Notify the President (Club Chief)
        if (updatedAction.club && updatedAction.club.chief) {
            const Notification = (await import('@/models/Notification')).default;

            const statusLabel = status === 'approved' ? 'approuvée' : 'rejetée';
            const title = `Action ${statusLabel}`;
            const message = `Votre action "${updatedAction.title}" a été ${statusLabel} par le Bureau National.`;

            await Notification.create({
                recipient: updatedAction.club.chief,
                type: 'action_status',
                title,
                message,
                link: '/dashboard/my-club/actions'
            });
        }

        return NextResponse.json(updatedAction);
    } catch (error) {
        console.error('Error updating action status:', error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        await dbConnect();
        await Action.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Action supprimée' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
