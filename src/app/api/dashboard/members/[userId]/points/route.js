
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Club from '@/models/Club';
import { getUser } from '@/lib/auth';

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const { userId } = await params;
        const { amount } = await req.json();

        const sessionUser = await getUser();
        if (!sessionUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const actor = await User.findById(sessionUser.userId || sessionUser._id || sessionUser.id).select('club role');
        const targetMember = await User.findById(userId);

        if (!targetMember) return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });

        // Security check
        if (actor.role !== 'admin') {
            // Must be chef
            if (actor.role !== 'president') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

            // Must manage the target member's club
            let actorClubId = actor.club;
            if (!actorClubId) {
                const ownedClub = await Club.findOne({ chief: actor._id });
                if (ownedClub) actorClubId = ownedClub._id;
            }

            const targetClubId = targetMember.club?.toString() || targetMember.preferredClub?.toString();

            if (actorClubId.toString() !== targetClubId) {
                return NextResponse.json({ success: false, error: 'Cannot award points to members of other clubs' }, { status: 403 });
            }
        }

        // Update points
        targetMember.bonusPoints = (targetMember.bonusPoints || 0) + amount;
        await targetMember.save();

        return NextResponse.json({
            success: true,
            newPoints: targetMember.bonusPoints
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
