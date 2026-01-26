import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET() {
    try {
        const userPayload = await getUser();

        if (!userPayload) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findById(userPayload.userId).select('-password');

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Me API Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
