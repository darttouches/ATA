
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

        // If no clubId is provided, try to find the user's club automatically
        if (!club) {
            const { getUser } = await import('@/lib/auth');
            const sessionUser = await getUser();

            if (sessionUser) {
                const user = await User.findById(sessionUser.userId || sessionUser._id || sessionUser.id).select('club role');
                if (user) {
                    if (user.club) {
                        club = user.club;
                    } else if (user.role === 'president') {
                        const ownedClub = await Club.findOne({ chief: user._id });
                        if (ownedClub) club = ownedClub._id;
                    }
                }
            }
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

        // If user is a chef but club is not directly linked on user object, 
        // look up which club they are chief of.
        if (!clubId && user.role === 'president') {
            const ownedClub = await Club.findOne({ chief: user._id });
            if (ownedClub) {
                clubId = ownedClub._id;
            }
        }

        if (!clubId && user.role !== 'admin') {
            console.log("User has no club assigned and is not admin");
            return NextResponse.json({ success: false, error: 'User does not belong to a club' }, { status: 400 });
        }

        const body = await req.json();
        console.log("Request Body:", body);

        // Filter out empty endDate if it's an empty string, to avoid Date cast error
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
