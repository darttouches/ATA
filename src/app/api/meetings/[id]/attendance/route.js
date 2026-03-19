import dbConnect from '@/lib/db';
import Meeting from '@/models/Meeting';
import User from '@/models/User';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
    try {
        const { id } = await params;
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        await dbConnect();

        const userId = user.userId.toString();

        // Check presence window first
        const meeting = await Meeting.findById(id).select('scheduledAt lateLimitMinutes presentMembers');
        if (!meeting) return NextResponse.json({ error: 'Réunion non trouvée' }, { status: 404 });

        // Check if user already marked as present (robust string comparison)
        const alreadyPresent = meeting.presentMembers.some(p => {
            const memberId = p.user?._id ? p.user._id.toString() : p.user.toString();
            return memberId === userId;
        });

        if (alreadyPresent) {
            return NextResponse.json({ success: true, alreadyPresent: true });
        }

        // Check time window
        const now = new Date();
        const start = new Date(meeting.scheduledAt);
        const end = new Date(start.getTime() + (meeting.lateLimitMinutes * 60000));
        const bufferStart = new Date(start.getTime() - (15 * 60000));

        if (now < bufferStart) {
            return NextResponse.json({ error: 'Trop tôt pour marquer le point bonus' }, { status: 403 });
        }
        if (now > end) {
            return NextResponse.json({ error: 'Retard trop important pour le point bonus' }, { status: 403 });
        }

        // Atomic update: only adds if userId not already in presentMembers
        // $addToSet on subdocuments doesn't work directly, so we use $push with a pre-check
        // We use findOneAndUpdate with a condition to prevent race conditions
        const updated = await Meeting.findOneAndUpdate(
            { 
                _id: id, 
                'presentMembers.user': { $ne: user.userId } // Only update if NOT already present
            },
            { 
                $push: { presentMembers: { user: user.userId, joinedAt: now } }
            },
            { new: true }
        );

        if (!updated) {
            // Someone sneaked in concurrently — already present
            return NextResponse.json({ success: true, alreadyPresent: true });
        }

        // Award point only if we actually added the entry
        await User.findByIdAndUpdate(user.userId, { $inc: { bonusPoints: 1 } });

        return NextResponse.json({ success: true, pointsAwarded: true });
    } catch (error) {
        console.error('Attendance error:', error);
        return NextResponse.json({ error: 'Erreur lors du marquage de la présence' }, { status: 500 });
    }
}
