import dbConnect from '@/lib/db';
import Content from '@/models/Content';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const contents = await Content.find({}).populate('club', 'name').populate('author', 'name').sort({ createdAt: -1 });
        return NextResponse.json(contents);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { title, type, description, mediaUrl, date, time, photos, videoUrl, link, status, club, onHome, isBestOff } = await req.json();
        await dbConnect();

        const content = await Content.create({
            title,
            type,
            description,
            mediaUrl,
            date,
            time,
            photos,
            videoUrl,
            link,
            status: status || 'approved',
            club,
            author: user.userId,
            onHome: onHome || false,
            isBestOff: isBestOff || false
        });

        return NextResponse.json(content);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { id, status, onHome, isBestOff } = await req.json();
        await dbConnect();

        const updatedContent = await Content.findByIdAndUpdate(
            id,
            { status, onHome, isBestOff },
            { new: true }
        );

        return NextResponse.json(updatedContent);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { id, title, type, description, mediaUrl, date, time, photos, videoUrl, link, status, onHome, isBestOff, club } = await req.json();
        await dbConnect();

        const updated = await Content.findByIdAndUpdate(
            id,
            { title, type, description, mediaUrl, date, time, photos, videoUrl, link, status, onHome, isBestOff, club },
            { new: true }
        );

        return NextResponse.json(updated);
    } catch (error) {
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
        await Content.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Contenu supprimé' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
