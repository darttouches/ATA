
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Action from '@/models/Action';

// GET: Single action details
export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const action = await Action.findById(id)
            .populate('club')
            .populate('attendees.member', 'name firstName lastName email profileImage');

        if (!action) {
            return NextResponse.json({ success: false, error: 'Action not found' }, { status: 404 });
        }

        const { getUser } = await import('@/lib/auth');
        const sessionUser = await getUser();
        if (!sessionUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const User = (await import('@/models/User')).default;
        const user = await User.findById(sessionUser.userId || sessionUser._id || sessionUser.id).select('club role');
        
        let userClubId = user?.club?.toString() || null;
        if (!userClubId && user?.role === 'president') {
            const Club = (await import('@/models/Club')).default;
            const ownedClub = await Club.findOne({ chief: user._id });
            if (ownedClub) userClubId = ownedClub._id.toString();
        }

        const actionClubId = action.club?._id?.toString() || action.club?.toString();
        
        if (actionClubId && actionClubId !== userClubId && user?.role !== 'admin' && user?.role !== 'national') {
             return NextResponse.json({ success: false, error: 'Accès refusé. Vous n\'êtes pas membre de ce club.' }, { status: 403 });
        }

        return NextResponse.json({ success: true, data: action }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// PUT: Update action (details or attendance)
export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const action = await Action.findById(id);
        if (!action) {
            return NextResponse.json({ success: false, error: 'Action not found' }, { status: 404 });
        }

        // Points are no longer awarded immediately upon scan.
        // They are strictly awarded in chunks of 3 consecutive attendances
        // when the action is approved by admins.
        if (body.attendees && Array.isArray(body.attendees)) {
            // Just letting Object.assign handle the attendees array swap below.
        }

        // Use Object.assign to update only provided fields
        Object.assign(action, body);
        await action.save();
        await action.populate('attendees.member', 'name firstName lastName email');

        return NextResponse.json({ success: true, data: action }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// DELETE: Remove action
export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const deletedAction = await Action.findByIdAndDelete(id);

        if (!deletedAction) {
            return NextResponse.json({ success: false, error: 'Action not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: {} }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
