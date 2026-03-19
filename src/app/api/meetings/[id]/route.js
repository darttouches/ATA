import dbConnect from '@/lib/db';
import Meeting from '@/models/Meeting';
import User from '@/models/User';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        await dbConnect();

        // Need user club which is not in token
        const fullUser = await User.findById(user.userId).select('club');

        const meeting = await Meeting.findById(id)
            .populate('creator', 'name firstName lastName')
            .populate('presentMembers.user', 'firstName lastName name profileImage');

        if (!meeting) return NextResponse.json({ error: 'Réunion non trouvée' }, { status: 404 });

        // Debug access
        console.log('--- Meeting Access Check ---');
        console.log('User Role:', user.role);
        console.log('User ID:', user.userId);
        console.log('Meeting Creator ID:', meeting.creator._id.toString());
        console.log('Meeting Participants:', meeting.participants);
        console.log('Meeting Clubs:', meeting.clubs);
        console.log('Full User Club:', fullUser?.club);

        // Check if user is participant or creator
        const canAccess = user.role === 'admin' || 
            meeting.creator._id.toString() === user.userId.toString() || 
            meeting.participants.some(p => p.toString() === user.userId.toString()) || 
            (fullUser?.club && meeting.clubs.some(c => c.toString() === fullUser.club.toString()));

        console.log('Can Access?', canAccess);

        if (!canAccess) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        return NextResponse.json(meeting);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        await dbConnect();
        const meeting = await Meeting.findById(id);
        if (!meeting) return NextResponse.json({ error: 'Réunion non trouvée' }, { status: 404 });

        if (user.role !== 'admin' && meeting.creator.toString() !== user.userId.toString()) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const updates = await req.json();
        const updatedMeeting = await Meeting.findByIdAndUpdate(id, updates, { new: true });

        return NextResponse.json(updatedMeeting);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        await dbConnect();
        const meeting = await Meeting.findById(id);
        if (!meeting) return NextResponse.json({ error: 'Réunion non trouvée' }, { status: 404 });

        if (user.role !== 'admin' && meeting.creator.toString() !== user.userId.toString()) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        await Meeting.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }
}
