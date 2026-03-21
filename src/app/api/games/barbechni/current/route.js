import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BarbechniRoom from '@/models/BarbechniRoom';

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const roomId = searchParams.get('roomId');
        const roomCode = searchParams.get('roomCode');

        let room;
        if (roomId) {
            room = await BarbechniRoom.findById(roomId);
        } else if (roomCode) {
            room = await BarbechniRoom.findOne({ roomCode: roomCode.toUpperCase() });
        }

        if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

        return NextResponse.json(room);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
