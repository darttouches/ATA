import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Wasaaa3Room from '@/models/Wasaaa3Room';
import { getUser } from '@/lib/auth';

export async function GET(req) {
    try {
        await dbConnect();
        const user = await getUser();
        const { searchParams } = new URL(req.url);
        const roomId = searchParams.get('roomId');

        if (!user || user.error) {
            return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
        }

        if (!roomId) {
            return NextResponse.json({ success: false, error: 'RoomId requis' }, { status: 400 });
        }

        const room = await Wasaaa3Room.findById(roomId);
        if (!room) {
            return NextResponse.json({ success: false, error: 'Room non trouvée' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: room }, { status: 200 });

    } catch (error) {
        console.error('Error getting current Wasaaa3 room state:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
