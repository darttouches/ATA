import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth'; // Ensure this exists or use a compatible one

export async function GET() {
    try {
        await dbConnect();
        // Just return all approved users for the dropdown
        const users = await User.find({ status: 'approved' })
            .select('_id name photo club')
            .sort({ club: 1, name: 1 });
        
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
