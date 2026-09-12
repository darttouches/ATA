import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Content from '@/models/Content';
import User from '@/models/User';
import { getUser } from '@/lib/auth';

// POST /api/member/club-activities/scan-content
// Body: { contentId, scannedUserId }
export async function POST(req) {
    try {
        await dbConnect();
        const sessionUser = await getUser();
        if (!sessionUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const userId = sessionUser.userId || sessionUser._id || sessionUser.id;
        const { contentId, scannedUserId } = await req.json();

        const content = await Content.findById(contentId);
        if (!content) return NextResponse.json({ error: 'Contenu introuvable' }, { status: 404 });

        // Check caller is an authorized scanner
        const isAuthorized = content.authorizedScanners.some(s => s.toString() === userId);
        if (!isAuthorized) return NextResponse.json({ error: 'Non autorisé à scanner pour cet événement' }, { status: 403 });

        // Only award point when content is approved
        const alreadyPresent = content.attendees.some(a => a.member.toString() === scannedUserId);
        if (alreadyPresent) return NextResponse.json({ success: false, message: 'Membre déjà enregistré comme présent' });

        // Mark present
        content.attendees.push({ member: scannedUserId, present: true, scannedAt: new Date() });
        await content.save();

        // Award +1 point immediately (event/content approved)
        if (content.status === 'approved') {
            await User.findByIdAndUpdate(scannedUserId, {
                $inc: { bonusPoints: 1 },
                $push: {
                    scoreHistory: {
                        points: 1,
                        reason: `Présence: ${content.title}`,
                        addedBy: 'Système NFC',
                        date: new Date()
                    }
                }
            });
        }

        const scannedUser = await User.findById(scannedUserId).select('firstName lastName');
        return NextResponse.json({ success: true, message: `✅ ${scannedUser?.firstName || ''} ${scannedUser?.lastName || ''} marqué(e) présent(e)` });
    } catch (err) {
        console.error('Content scan error:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
