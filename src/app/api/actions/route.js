
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Action from '@/models/Action';
import User from '@/models/User';
import Club from '@/models/Club';
// import { getToken } from 'next-auth/jwt'; // Removed unused import causing error

// GET: Fetch actions with filters (e.g., by club)
export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        let club = searchParams.get('clubId');

        const { getUser } = await import('@/lib/auth');
        const sessionUser = await getUser();
        if (!sessionUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findById(sessionUser.userId || sessionUser._id || sessionUser.id).select('club role');
        let userClubId = user?.club?.toString() || null;
        
        if (!userClubId && user?.role === 'president') {
            const ownedClub = await Club.findOne({ chief: user._id });
            if (ownedClub) userClubId = ownedClub._id.toString();
        }

        // If no clubId is explicitly provided in query, use the user's club automatically
        if (!club) {
            club = userClubId;
        }

        // Must belong to a club unless admin or national
        if (!club && user?.role !== 'admin' && user?.role !== 'national') {
            return NextResponse.json({ success: true, data: [] }, { status: 200 });
        }

        // If querying a specific club, check authorization
        if (club && club !== userClubId && user?.role !== 'admin' && user?.role !== 'national') {
             return NextResponse.json({ success: false, error: 'Accès refusé. Vous n\'êtes pas membre de ce club.' }, { status: 403 });
        }

        let query = {};
        if (club) {
            query.club = club;
        }

        const actions = await Action.find(query)
            .populate('club', 'name')
            .sort({ startDate: -1 }); // Newest first

        return NextResponse.json({ success: true, data: actions }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// POST: Create a new action
export async function POST(req) {
    try {
        await dbConnect();

        console.log("Starting POST /api/actions");

        const { getUser } = await import('@/lib/auth');
        const sessionUser = await getUser();

        console.log("Session User:", sessionUser);

        if (!sessionUser) {
            console.log("No session user found");
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = sessionUser.userId || sessionUser._id || sessionUser.id;
        console.log("Searching for user ID:", userId);

        const user = await User.findById(userId).select('club role');
        console.log("Database User found:", user);

        if (!user) {
            console.log("User not found in DB");
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 400 });
        }

        let clubId = user.club;

        // If user is a chef but club is not directly linked on user object
        if (!clubId && user.role === 'president') {
            const ownedClub = await Club.findOne({ chief: user._id });
            if (ownedClub) {
                clubId = ownedClub._id;
            }
        }

        const body = await req.json();

        // Admins and National Board members can specify WHICH club the action belongs to
        if ((user.role === 'admin' || user.role === 'national') && body.club) {
            clubId = body.club;
        }

        if (!clubId && user.role !== 'admin' && user.role !== 'national') {
            console.log("User has no club assigned and is not authorized to create global actions");
            return NextResponse.json({ success: false, error: 'User does not belong to a club' }, { status: 400 });
        }

        // Filter out empty endDate
        if (body.endDate === '') {
            delete body.endDate;
        }

        const actionData = {
            ...body,
            club: clubId
        };
        console.log("Creating action with data:", actionData);

        const action = await Action.create(actionData);
        console.log("Action created successfully:", action._id);

        return NextResponse.json({ success: true, data: action }, { status: 201 });
    } catch (error) {
        console.error("Error in POST /api/actions:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
