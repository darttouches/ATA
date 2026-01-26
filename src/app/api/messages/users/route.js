import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        await dbConnect();
        // Fetch all users except current one for the chat list
        const users = await User.find({ _id: { $ne: user.userId } }, 'name role').sort({ name: 1 });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
