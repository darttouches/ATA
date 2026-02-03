import dbConnect from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const messages = await ContactMessage.find({}).sort({ createdAt: -1 });
        return NextResponse.json(messages);
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
        const updated = await ContactMessage.findByIdAndUpdate(id, { status }, { new: true });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        await dbConnect();
        await ContactMessage.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Message supprimé' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }
}
