import dbConnect from '@/lib/db';
import MemberVoice from '@/models/MemberVoice';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'president')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const { id } = await params;
        const { status } = await req.json();

        if (!['nouveau', 'en_cours', 'traite'].includes(status)) {
            return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
        }

        await dbConnect();

        const voice = await MemberVoice.findById(id);
        if (!voice) {
            return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 });
        }

        // Security check for presidents
        if (user.role === 'president' && voice.club?.toString() !== user.club?.toString()) {
            return NextResponse.json({ error: 'Accès refusé à ce message' }, { status: 403 });
        }

        voice.status = status;
        await voice.save();

        return NextResponse.json(voice);
    } catch (error) {
        console.error('MemberVoice PATCH Error:', error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}
