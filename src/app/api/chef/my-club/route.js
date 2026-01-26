import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import User from '@/models/User';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUser();
        if (!user || user.role !== 'president') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        await dbConnect();
        // Find club where chief is current user
        const club = await Club.findOne({ chief: user.userId });

        if (!club) {
            return NextResponse.json({ error: 'Aucun club assigné' }, { status: 404 });
        }

        return NextResponse.json(club);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'president') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const updates = await req.json();
        await dbConnect();

        const club = await Club.findOneAndUpdate(
            { chief: user.userId },
            updates,
            { new: true }
        );

        return NextResponse.json(club);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}
