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
        const roomId = url.searchParams.get('roomId');
        
        let query = {};
        
        if (roomId) {
            query._id = roomId;
        } else if (roomCode) {
            query.roomCode = roomCode.toUpperCase();
            query.status = 'playing';
        } else {
            query.status = 'playing';
        }
        
        query.$or = [
            { creatorId: reqUserId },
            { "players.userId": reqUserId }
        ];

        const activeRoom = await GameRoom.findOne(query);

        if (!activeRoom) {
            return NextResponse.json({ success: true, data: null });
        }

        return NextResponse.json({ success: true, data: activeRoom });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
