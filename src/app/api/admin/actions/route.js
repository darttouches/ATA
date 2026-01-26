import dbConnect from '@/lib/db';
import Action from '@/models/Action';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

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
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { id, status } = await req.json();
        await dbConnect();

        const updatedAction = await Action.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        return NextResponse.json(updatedAction);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        await dbConnect();
        await Action.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Action supprimée' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
