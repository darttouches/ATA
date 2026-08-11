import dbConnect from '@/lib/db';
import Content from '@/models/Content';
import Action from '@/models/Action';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

async function syncContentToAction(content, user) {
    if (!content || (content.type !== 'event' && content.type !== 'formation')) return;
    if (content.status !== 'approved') return;

    try {
        const exists = await Action.findOne({ contentRef: content._id });
        if (!exists) {
            await Action.create({
                title: content.title,
                description: content.description,
                startDate: content.date || new Date(),
                localTime: content.time || '00:00',
                club: content.club || (content.clubs && content.clubs[0]) || null,
                author: user.userId,
                status: 'approved',
                contentRef: content._id
            });
        } else {
            await Action.findByIdAndUpdate(exists._id, {
                title: content.title,
                startDate: content.date || exists.startDate,
                localTime: content.time || exists.localTime
            });
        }
    } catch (err) {
        console.error('Error syncing to Action', err);
    }
}

export async function GET() {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const contents = await Content.find({}).populate('club', 'name').populate('clubs', 'name').populate('author', 'name').sort({ createdAt: -1 });
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
        const { title, type, description, mediaUrl, date, endDate, time, photos, videoUrl, link, status, clubs: clubsRaw, onHome, isBestOff, program } = body;
        // clubs = tableau d'IDs, on garde aussi club (premier) pour rétrocompatiblité
        const clubs = Array.isArray(clubsRaw) ? clubsRaw.filter(Boolean) : (clubsRaw ? [clubsRaw] : []);
        const club = clubs[0] || null;

        // Clean program data
        const cleanProgram = program ? {
            ...program,
            partsCount: (program.partsCount && !isNaN(parseInt(program.partsCount))) ? parseInt(program.partsCount) : undefined,
            items: Array.isArray(program.items) ? program.items.map(pitem => ({
                title: pitem.title || '',
                startTime: pitem.startTime || '',
                endTime: pitem.endTime || '',
                duration: pitem.duration || '',
                type: pitem.type || 'content',
                description: pitem.description || '',
                speakerName: pitem.speakerName || '',
                speakerPhoto: pitem.speakerPhoto || ''
            })) : []
        } : undefined;

        await dbConnect();

        const content = await Content.create({
            title,
            type,
            description,
            mediaUrl,
            date,
            endDate,
            time,
            photos,
            videoUrl,
            link,
            status: status || 'approved',
            club,
            clubs,
            author: user.userId,
            onHome: onHome || false,
            isBestOff: isBestOff || false,
            program: cleanProgram
        });

        await syncContentToAction(content, user);

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

        if (updatedContent) {
            await syncContentToAction(updatedContent, user);
        }

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
        const { id, title, type, description, mediaUrl, date, endDate, time, photos, videoUrl, link, status, onHome, isBestOff, clubs: clubsRaw, program } = body;
        const clubs = Array.isArray(clubsRaw) ? clubsRaw.filter(Boolean) : (clubsRaw ? [clubsRaw] : []);
        const club = clubs[0] || null;

        // Clean program data
        const cleanProgram = program ? {
            ...program,
            partsCount: (program.partsCount && !isNaN(parseInt(program.partsCount))) ? parseInt(program.partsCount) : undefined,
            items: Array.isArray(program.items) ? program.items.map(pitem => ({
                title: pitem.title || '',
                startTime: pitem.startTime || '',
                endTime: pitem.endTime || '',
                duration: pitem.duration || '',
                type: pitem.type || 'content',
                description: pitem.description || '',
                speakerName: pitem.speakerName || '',
                speakerPhoto: pitem.speakerPhoto || ''
            })) : []
        } : undefined;

        await dbConnect();

        const updated = await Content.findByIdAndUpdate(
            id,
            { title, type, description, mediaUrl, date, endDate, time, photos, videoUrl, link, status, onHome, isBestOff, club, clubs, program: cleanProgram },
            { new: true }
        );

        if (updated) {
            await syncContentToAction(updated, user);
        }

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
