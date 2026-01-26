import dbConnect from '@/lib/db';
import Poll from '@/models/Poll';
import Club from '@/models/Club';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'president' && user.role !== 'admin')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const { question, description, options, allowMultiple, visibility, clubId, startDate, endDate, hidden } = await req.json();

        await dbConnect();

        // If president, verify club ownership or use their assigned club
        let targetClubId = clubId;
        if (user.role === 'president') {
            const club = await Club.findOne({ chief: user.userId });
            targetClubId = club?._id;
        }

        const pollData = {
            question,
            description,
            options: options.map(opt => ({ text: opt, votes: 0 })),
            allowMultiple,
            visibility,
            club: targetClubId,
            author: user.userId,
            startDate,
            endDate,
            hidden,
            status: 'pending' // Always pending for moderation
        };

        const poll = await Poll.create(pollData);

        return NextResponse.json(poll);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erreur lors de la création du sondage' }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const clubId = searchParams.get('clubId');
        const user = await getUser();
        const now = new Date();

        await dbConnect();

        let query = {};

        // If it's a public request (not specified as management or just general fetch)
        // We filter for approved, not hidden, and started polls
        if (searchParams.get('manage') !== 'true') {
            query = {
                status: 'approved',
                hidden: false,
                startDate: { $lte: now }
            };
        } else {
            // Dashboard view: show based on role
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            if (user.role === 'president') {
                query.author = user.userId;
            } else if (user.role === 'admin') {
                // Admin sees everything if they want, but usually admins use the admin/polls endpoint
                query = {};
            }
        }

        if (clubId) {
            query.club = clubId;
        }

        const polls = await Poll.find(query)
            .populate('club', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json(polls);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
