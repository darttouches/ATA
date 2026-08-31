import dbConnect from '@/lib/db';
import Content from '@/models/Content';
import Club from '@/models/Club';
import { getUser } from '@/lib/auth';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { NextResponse } from 'next/server';

async function getClubForUser(user) {
    await dbConnect();
    const dbUser = await User.findById(user.userId);
    let club = null;
    if (dbUser && dbUser.club) {
        club = await Club.findById(dbUser.club);
    }
    if (!club) {
        club = await Club.findOne({ $or: [{ clubAccountId: user.userId }, { chief: user.userId }] });
    }
    return club;
}

export async function GET() {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'club' && user.role !== 'president' && user.role !== 'admin')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const club = await getClubForUser(user);
        if (!club) return NextResponse.json({ error: 'Club non trouvé' }, { status: 404 });

        const contents = await Content.find({ club: club._id }).sort({ createdAt: -1 });
        return NextResponse.json(contents);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'club' && user.role !== 'admin')) {
            return NextResponse.json({ error: 'La création de contenu est désormais réservée exclusivement au compte officiel du Club.' }, { status: 403 });
        }

        const body = await req.json();
        const { title, type, description, mediaUrl, date, time, photos, videoUrl, link, program } = body;

        // Clean program data
        const cleanProgram = program ? {
            ...program,
            partsCount: (program.partsCount && !isNaN(parseInt(program.partsCount))) ? parseInt(program.partsCount) : undefined,
            items: Array.isArray(program.items) ? program.items.map(item => ({
                title: item.title || '',
                startTime: item.startTime || '',
                endTime: item.endTime || '',
                duration: item.duration || '',
                type: item.type || 'content',
                description: item.description || '',
                speakerName: item.speakerName || '',
                speakerPhoto: item.speakerPhoto || ''
            })) : []
        } : undefined;

        await dbConnect();

        const club = await getClubForUser(user);
        if (!club) return NextResponse.json({ error: 'Club non trouvé' }, { status: 404 });

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
            club: club._id,
            author: user.userId,
            status: 'pending',
            program: cleanProgram
        });

        // Notify Admins
        const Admin = await User.find({ role: 'admin' });
        if (Admin.length > 0) {
            await Notification.create(Admin.map(admin => ({
                recipient: admin._id,
                sender: user.userId,
                type: 'content_submission',
                title: 'Nouveau contenu à valider',
                message: `Le compte club ${club.name} a soumis un nouvel élément : ${title}`,
                link: '/dashboard/content'
            })));
        }

        return NextResponse.json(content);
    } catch (error) {
        console.error('Content creation error:', error);
        return NextResponse.json({ error: error.message || 'Erreur lors de la création' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'club' && user.role !== 'admin')) {
            return NextResponse.json({ error: 'La modification de contenu est désormais réservée exclusivement au compte officiel du Club.' }, { status: 403 });
        }

        const body = await req.json();
        const { id, title, type, description, mediaUrl, date, time, photos, videoUrl, link, program } = body;

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

        const club = await getClubForUser(user);
        const existing = await Content.findById(id);

        if (!existing || existing.club.toString() !== club._id.toString()) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const updated = await Content.findByIdAndUpdate(
            id,
            { title, type, description, mediaUrl, date, time, photos, videoUrl, link, status: 'pending', program: cleanProgram },
            { new: true }
        );

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Content update error:', error);
        return NextResponse.json({ error: error.message || 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'club' && user.role !== 'admin')) {
            return NextResponse.json({ error: 'La suppression de contenu est réservée au compte officiel du Club.' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        await dbConnect();
        await Content.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Contenu supprimé' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
