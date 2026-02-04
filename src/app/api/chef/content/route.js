import dbConnect from '@/lib/db';
import Content from '@/models/Content';
import Club from '@/models/Club';
import { getUser } from '@/lib/auth';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUser();
        if (!user || user.role !== 'president') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const club = await Club.findOne({ chief: user.userId });
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
        if (!user || user.role !== 'president') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const body = await req.json();
        const { title, type, description, mediaUrl, date, time, photos, videoUrl, link, program } = body;

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

        const club = await Club.findOne({ chief: user.userId });
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
                message: `${user.name} a soumis un nouvel élément : ${title}`,
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
        if (!user || user.role !== 'president') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const body = await req.json();
        const { id, title, type, description, mediaUrl, date, time, photos, videoUrl, link, program } = body;

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

        // Check if content belongs to this chef's club
        const club = await Club.findOne({ chief: user.userId });
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
        if (!user || user.role !== 'president') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        await dbConnect();
        await Content.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Contenu supprimé' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
