import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Club from '@/models/Club';
import Action from '@/models/Action';
import Content from '@/models/Content';
import { getUser } from '@/lib/auth';

export async function GET() {
    try {
        await dbConnect();
        const sessionUser = await getUser();
        if (!sessionUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const userId = sessionUser.userId || sessionUser._id || sessionUser.id;
        const dbUser = await User.findById(userId).select('club preferredClub role');
        if (!dbUser) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

        // Find the club this member belongs to
        let clubId = dbUser.club || dbUser.preferredClub;
        if (!clubId && dbUser.role === 'president') {
            const ownedClub = await Club.findOne({ chief: userId });
            if (ownedClub) clubId = ownedClub._id;
        }
        if (!clubId) return NextResponse.json({ actions: [], contents: [] });

        // Actions: all statuses visible to members of same club
        const actions = await Action.find({ club: clubId })
            .populate('attendees.member', 'firstName lastName profileImage')
            .sort({ startDate: -1 });

        // Events & Contents: approved only for public display, or all if club/president
        const contentQuery = { club: clubId };
        if (dbUser.role !== 'club' && dbUser.role !== 'president') {
            contentQuery.status = 'approved';
        }
        const contents = await Content.find(contentQuery)
            .populate('attendees.member', 'firstName lastName profileImage')
            .sort({ createdAt: -1 });

        return NextResponse.json({ actions, contents, userId });
    } catch (err) {
        console.error('Club activities error:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
