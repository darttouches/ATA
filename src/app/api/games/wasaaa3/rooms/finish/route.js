import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Wasaaa3Room from '@/models/Wasaaa3Room';
import { getUser } from '@/lib/auth';

export async function POST(req) {
    try {
        await dbConnect();
        const user = await getUser();
        const { roomId, score, energy, finalHearts } = await req.json();

        if (!user || user.error) {
            return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
        }

        const room = await Wasaaa3Room.findById(roomId);
        if (!room) {
            return NextResponse.json({ success: false, error: 'Room non trouvée' }, { status: 404 });
        }

        const player = room.players.find(p => p.userId.toString() === (user.userId || user._id).toString());
        if (player) {
            player.score = score;
            player.energy = energy;
            player.finalHearts = finalHearts;
            player.isFinished = true;
            player.finishedAt = new Date();
        } else {
            return NextResponse.json({ success: false, error: 'Pas membre de cette room' }, { status: 403 });
        }

        // If all players are finished, mark room as finished
        const allFinished = room.players.every(p => p.isFinished);
        if (allFinished) {
            room.status = 'finished';
        }

        await room.save();
        return NextResponse.json({ success: true, data: room }, { status: 200 });

    } catch (error) {
        console.error('Error finishing Wasaaa3 game in room:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
