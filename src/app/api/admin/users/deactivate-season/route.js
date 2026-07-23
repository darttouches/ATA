import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const currentUser = await getUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Accès refusé. Seul un administrateur peut effectuer cette action.' }, { status: 403 });
        }

        const { season, action } = await req.json();
        if (!season) {
            return NextResponse.json({ error: 'La saison spécifiée est requise.' }, { status: 400 });
        }

        await dbConnect();

        // Target non-admin users for the specified season
        // Admins are EXCLUDED (role !== 'admin')
        const filter = {
            role: { $ne: 'admin' },
            $or: [
                { season: season },
                // If targeting 2025/2026, also match legacy users without explicit season
                ...(season === '2025/2026' ? [{ season: { $exists: false } }, { season: null }] : [])
            ]
        };

        const targetActiveState = action === 'activate';

        const updateFields = {
            isActive: targetActiveState
        };

        let result;
        if (action === 'delete') {
            result = await User.deleteMany(filter);
        } else {
            result = await User.updateMany(filter, { $set: updateFields });
        }

        const count = result.modifiedCount || result.deletedCount || 0;

        return NextResponse.json({
            success: true,
            count,
            message: `${count} compte(s) membre(s) de la saison ${season} ont été ${targetActiveState ? 'réactivés' : 'désactivés'} (Statut d'activité). Le statut d'approbation et l'historique de cotisation restent conservés.`
        });
    } catch (error) {
        console.error('Deactivate season error:', error);
        return NextResponse.json({ error: 'Erreur lors de la désactivation des comptes pour cette année.' }, { status: 500 });
    }
}
