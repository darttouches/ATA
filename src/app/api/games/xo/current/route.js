import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import XOGameRoom from '@/models/XOGameRoom';
import { getUser } from '@/lib/auth';

export async function GET(req) {
    try {
        await dbConnect();
        const url = new URL(req.url);
        const roomId = url.searchParams.get('roomId');
        
        if (!roomId) {
            return NextResponse.json({ success: false, error: 'RoomId manquant' }, { status: 400 });
        }

        const room = await XOGameRoom.findById(roomId);
        
        if (!room) {
            return NextResponse.json({ success: false, error: 'Partie introuvable' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: room }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
