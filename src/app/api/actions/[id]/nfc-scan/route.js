import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Action from '@/models/Action';
import User from '@/models/User';
import { getUser } from '@/lib/auth';

// POST /api/actions/[id]/nfc-scan
// Body: { scannedUserId }
export async function POST(req, { params }) {
    try {
        await dbConnect();
        const sessionUser = await getUser();
        if (!sessionUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { id } = await params;
        const userId = sessionUser.userId || sessionUser._id || sessionUser.id;
        const { scannedUserId } = await req.json();

        const action = await Action.findById(id);
        if (!action) return NextResponse.json({ error: 'Action introuvable' }, { status: 404 });

        // Check authorized scanner
        const isAuthorized = action.authorizedScanners.some(s => s.toString() === userId);
        if (!isAuthorized) return NextResponse.json({ error: 'Non autorisé à scanner pour cette action' }, { status: 403 });

        // Check already present
        const alreadyPresent = action.attendees.some(a => a.member.toString() === scannedUserId && a.present);
        if (alreadyPresent) return NextResponse.json({ success: false, message: 'Membre déjà enregistré comme présent' });

        // Mark present in Action.attendees
        const existingIdx = action.attendees.findIndex(a => a.member.toString() === scannedUserId);
        if (existingIdx >= 0) {
            action.attendees[existingIdx].present = true;
        } else {
            action.attendees.push({ member: scannedUserId, present: true });
        }
        await action.save();

        const scannedUser = await User.findById(scannedUserId).select('firstName lastName');
        return NextResponse.json({ success: true, message: `✅ ${scannedUser?.firstName || ''} ${scannedUser?.lastName || ''} marqué(e) présent(e)` });
    } catch (err) {
        console.error('Action NFC scan error:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
