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

        // Find a room where player is registered and status is playing
        const activeRoom = await GameRoom.findOne({
            $or: [
                { creatorId: user._id },
                { "players.userId": user._id }
            ],
            status: 'playing'
        });

        if (!activeRoom) {
            return NextResponse.json({ success: true, data: null });
        }

        return NextResponse.json({ success: true, data: activeRoom });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
