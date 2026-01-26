
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const clubId = searchParams.get('clubId');
        const role = searchParams.get('role');

        let query = {};

        // Handle club filtering
        // Users have a 'club' field. It might be populated or an ID.
        if (clubId) {
            // Check both 'club' and 'preferredClub'
            query.$or = [
                { club: clubId },
                { preferredClub: clubId }
            ];
        }

        if (role) {
            query.role = role;
        }

        const users = await User.find(query).select('-password'); // Exclude password

        return NextResponse.json({ success: true, data: users }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
