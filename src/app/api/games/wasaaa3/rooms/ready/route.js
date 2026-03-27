import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Wasaaa3Room from '@/models/Wasaaa3Room';
import { getUser } from '@/lib/auth';

export async function POST(req) {
    try {
        await dbConnect();
        const user = await getUser();
        const { roomId, ready } = await req.json();

        if (!user || user.error) {
            return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
        }

        const room = await Wasaaa3Room.findById(roomId);
        if (!room) {
            return NextResponse.json({ success: false, error: 'Room non trouvée' }, { status: 404 });
        }

        const player = room.players.find(p => p.userId.toString() === (user.userId || user._id).toString());
        if (player) {
            player.ready = ready;
        } else {
            return NextResponse.json({ success: false, error: 'Pas membre de cette room' }, { status: 403 });
        }

        // Check if all ready to start
        const allReady = room.players.every(p => p.ready);
        if (allReady && room.players.length >= 1) { // Min 1 player (at least host)
            room.status = 'playing';
        }

        await room.save();
        return NextResponse.json({ success: true, data: room }, { status: 200 });

    } catch (error) {
        console.error('Error toggling ready:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
