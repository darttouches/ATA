import dbConnect from '@/lib/db';
import User from '@/models/User';
import Club from '@/models/Club';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/members — accessible to any authenticated user
// Returns a simple list of members for use in meeting/event forms
export async function GET() {
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        await dbConnect();

        // Get all users who are approved/active (adjust filter to your schema)
        const users = await User.find({ status: 'approved' })
            .select('firstName lastName name email role club profileImage')
            .sort({ firstName: 1, lastName: 1 })
            .lean();

        console.log(`Found ${users.length} approved members`);

        // Attach club name for display
        const clubIds = [...new Set(users.map(u => u.club).filter(Boolean))];
        const clubs = clubIds.length > 0 ? await Club.find({ _id: { $in: clubIds } }).select('name').lean() : [];
        const clubMap = Object.fromEntries(clubs.map(c => [c._id.toString(), c.name]));

        const enriched = users.map(u => ({
            ...u,
            clubName: u.club ? (clubMap[u.club.toString()] || 'Club inconnu') : null
        }));

        return NextResponse.json(enriched);
    } catch (error) {
        console.error('Members API Error Detail:', error);
        return NextResponse.json({ error: 'Erreur serveur lors de la récupération des membres', details: error.message }, { status: 500 });
    }
}
