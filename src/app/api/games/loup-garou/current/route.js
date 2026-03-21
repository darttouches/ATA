import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GameRoom from '@/models/GameRoom';
import { getUser } from '@/lib/auth';

export async function GET(req) {
    try {
        await dbConnect();
        const user = await getUser();
        
        if (!user || user.error) {
            return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
        }

        const reqUserId = user.userId || user._id;
        
        const url = new URL(req.url);
        const roomCode = url.searchParams.get('roomCode');
        
        const query = { status: 'playing' };
        
        if (roomCode) {
            query.roomCode = roomCode.toUpperCase();
        }
        
        query.$or = [
            { creatorId: reqUserId },
            { "players.userId": reqUserId }
        ];

        // Find a room where player is registered and status is playing
        const activeRoom = await GameRoom.findOne(query);

        if (!activeRoom) {
            return NextResponse.json({ success: true, data: null });
        }

        return NextResponse.json({ success: true, data: activeRoom });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
