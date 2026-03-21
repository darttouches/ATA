import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import XOGameRoom from '@/models/XOGameRoom';
import { getUser } from '@/lib/auth';

export async function POST(req) {
    try {
        await dbConnect();
        const user = await getUser();
        
        if (!user || user.error) {
            return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
        }

        const { roomCode, name } = await req.json();
        
        const room = await XOGameRoom.findOne({ roomCode, status: 'waiting' });
        
        if (!room) {
            return NextResponse.json({ success: false, error: 'Partie introuvable ou déjà commencée.' }, { status: 404 });
        }

        if (room.players.length >= 2) {
            return NextResponse.json({ success: false, error: 'La partie est complète.' }, { status: 400 });
        }

        // Add player 2
        const p1 = room.players[0];
        const nextSymbol = p1.symbol === 'X' ? 'O' : 'X';
        
        room.players.push({
            userId: user.userId || user._id,
            name: name || user.name || 'Invité',
            symbol: nextSymbol,
            reserveCount: 4,
            ready: true
        });

        room.status = 'playing'; // Start when 2nd player joins
        await room.save();

        return NextResponse.json({ success: true, data: room }, { status: 200 });

    } catch (error) {
        console.error('Error joining XO room:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
