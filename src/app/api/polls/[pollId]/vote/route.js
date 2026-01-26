
import dbConnect from '@/lib/db';
import Poll from '@/models/Poll';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
    try {
        const { pollId } = await params;
        const { selectedOptions } = await req.json(); // Array of option indices
        const user = await getUser();
        const ip = req.headers.get('x-forwarded-for') || 'anonymous';

        await dbConnect();
        const poll = await Poll.findById(pollId);

        if (!poll || poll.status !== 'approved') {
            return NextResponse.json({ error: 'Sondage non disponible' }, { status: 404 });
        }

        // Check if user/ip already voted
        const alreadyVoted = poll.voters.some(v =>
            (user && v.user?.toString() === user.userId) || (!user && v.ip === ip)
        );

        if (alreadyVoted) {
            return NextResponse.json({ error: 'Vous avez déjà participé à ce sondage' }, { status: 400 });
        }

        // Check visibility restriction
        if (poll.visibility === 'members' && !user) {
            return NextResponse.json({ error: 'Seuls les membres connectés peuvent participer' }, { status: 403 });
        }

        // Validate selection
        if (!poll.allowMultiple && selectedOptions.length > 1) {
            return NextResponse.json({ error: 'Un seul choix est autorisé' }, { status: 400 });
        }

        // Update votes
        selectedOptions.forEach(index => {
            if (poll.options[index]) {
                poll.options[index].votes += 1;
            }
        });

        // Add voter
        poll.voters.push({
            user: user ? user.userId : null,
            ip: user ? null : ip
        });

        await poll.save();

        return NextResponse.json({ success: true, poll });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erreur lors du vote' }, { status: 500 });
    }
}
