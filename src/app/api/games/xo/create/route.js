import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import XOGameRoom from '@/models/XOGameRoom';
import { getUser } from '@/lib/auth';

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req) {
    try {
        await dbConnect();
        const user = await getUser();
        
        if (!user || user.error) {
            return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
        }

        const { symbol = 'X', name } = await req.json();

        const roomCode = generateRoomCode();
        
        const newRoom = await XOGameRoom.create({
            roomCode,
            creatorId: user.userId || user._id,
            mode: 'online',
            status: 'waiting',
            players: [{
                userId: user.userId || user._id,
                name: name || user.name || 'Hôte',
                symbol: symbol,
                reserveCount: 4,
                ready: true
            }],
            currentTurn: 'X'
        });

        return NextResponse.json({ success: true, data: newRoom }, { status: 201 });

    } catch (error) {
        console.error('Error creating XO room:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
