import dbConnect from '@/lib/db';
import AtaWaveEpisode from '@/models/AtaWaveEpisode';
import Settings from '@/models/Settings';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        await dbConnect();
        
        if (user.role !== 'admin') {
            const ataWavesSettings = await Settings.findOne({ key: 'ata_waves' });
            const isAuthorized = ataWavesSettings?.value?.authorizedUsers?.includes(user._id);
            if (!isAuthorized) {
                return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
            }
        }

        const deleted = await AtaWaveEpisode.findByIdAndDelete(id);
        if (!deleted) return NextResponse.json({ error: 'Émission introuvable' }, { status: 404 });

        return NextResponse.json({ success: true, message: 'Supression réussie' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        await dbConnect();
        
        if (user.role !== 'admin') {
            const ataWavesSettings = await Settings.findOne({ key: 'ata_waves' });
            const isAuthorized = ataWavesSettings?.value?.authorizedUsers?.includes(user._id);
            if (!isAuthorized) {
                return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
            }
        }

        const data = await req.json();
        const updated = await AtaWaveEpisode.findByIdAndUpdate(id, data, { new: true });
        if (!updated) return NextResponse.json({ error: 'Émission introuvable' }, { status: 404 });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}
