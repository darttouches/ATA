import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await dbConnect();
        const clubs = await Club.find({}).sort({ createdAt: -1 });
        return NextResponse.json(clubs);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
