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

        const body = await req.json();
        const { title, type, description, mediaUrl, date, time, photos, videoUrl, link, status, club, onHome, isBestOff, program } = body;

        // Clean program data
        const cleanProgram = program ? {
            ...program,
            partsCount: (program.partsCount && !isNaN(parseInt(program.partsCount))) ? parseInt(program.partsCount) : undefined,
            items: Array.isArray(program.items) ? program.items.map(item => ({
                ...item,
                duration: item.duration || ''
            })) : []
        } : undefined;

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
            isBestOff: isBestOff || false,
            program: cleanProgram
        });

        return NextResponse.json(content);
    } catch (error) {
        console.error('Admin Content creation error:', error);
        return NextResponse.json({ error: error.message || 'Erreur lors de la création' }, { status: 500 });
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

        const body = await req.json();
        const { id, title, type, description, mediaUrl, date, time, photos, videoUrl, link, status, onHome, isBestOff, club, program } = body;

        // Clean program data
        const cleanProgram = program ? {
            ...program,
            partsCount: (program.partsCount && !isNaN(parseInt(program.partsCount))) ? parseInt(program.partsCount) : undefined,
            items: Array.isArray(program.items) ? program.items.map(item => ({
                ...item,
                duration: item.duration || ''
            })) : []
        } : undefined;

        await dbConnect();

        const updated = await Content.findByIdAndUpdate(
            id,
            { title, type, description, mediaUrl, date, time, photos, videoUrl, link, status, onHome, isBestOff, club, program: cleanProgram },
            { new: true }
        );

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Admin Content update error:', error);
        return NextResponse.json({ error: error.message || 'Erreur lors de la mise à jour' }, { status: 500 });
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
