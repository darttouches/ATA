import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ClubRequest from '@/models/ClubRequest';
import User from '@/models/User';

export async function POST(req) {
    try {
        await dbConnect();
        const data = await req.json();

        // Very basic validation could be done here, but mongoose schema handles most of it.
        const newRequest = new ClubRequest(data);
        await newRequest.save();

        return NextResponse.json({ success: true, message: 'Demande soumise avec succès' }, { status: 201 });
    } catch (error) {
        console.error('ClubRequest Error:', error);
        return NextResponse.json({ success: false, error: 'Erreur lors de la soumission.' }, { status: 500 });
    }
}
