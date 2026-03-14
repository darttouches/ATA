import dbConnect from '@/lib/db';
import AtaWaveEpisode from '@/models/AtaWaveEpisode';
import Settings from '@/models/Settings';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await dbConnect();
        const episodes = await AtaWaveEpisode.find().sort({ publishedAt: -1 });
        return NextResponse.json(episodes);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        await dbConnect();
        
        // Authorization check: User must be admin OR in authorizedUsers list
        if (user.role !== 'admin') {
            const ataWavesSettings = await Settings.findOne({ key: 'ata_waves' });
            const isAuthorized = ataWavesSettings?.value?.authorizedUsers?.includes(user._id);
            if (!isAuthorized) {
                return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
            }
        }

        const data = await req.json();
        const newEpisode = await AtaWaveEpisode.create(data);
        return NextResponse.json(newEpisode, { status: 201 });
    } catch (error) {
        console.error('Create episode error:', error);
        return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }
}
