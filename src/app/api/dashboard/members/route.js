
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Club from '@/models/Club';
import { getUser } from '@/lib/auth';

export async function GET(req) {
    try {
        await dbConnect();
        const sessionUser = await getUser();
        if (!sessionUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const user = await User.findById(sessionUser.userId || sessionUser._id || sessionUser.id).select('club role');
        if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

        let query = {};

        // If not admin, they can only see members of THEIR club
        if (user.role !== 'admin') {
            let clubId = user.club;
            if (!clubId && user.role === 'president') {
                const ownedClub = await Club.findOne({ chief: user._id });
                if (ownedClub) clubId = ownedClub._id;
            }
            if (!clubId) return NextResponse.json({ success: false, error: 'No club assigned' }, { status: 400 });

            query.$or = [{ club: clubId }, { preferredClub: clubId }];
        }

        const members = await User.find(query)
            .select('firstName lastName name email profileImage bonusPoints club preferredClub role')
            .sort({ firstName: 1 });

        return NextResponse.json({ success: true, data: members });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
