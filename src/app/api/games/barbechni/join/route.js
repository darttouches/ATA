import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BarbechniRoom from '@/models/BarbechniRoom';

export async function POST(req) {
    try {
        await dbConnect();
        const { roomCode, player } = await req.json();

        const room = await BarbechniRoom.findOne({ roomCode: roomCode.toUpperCase(), status: 'waiting' });
        if (!room) return NextResponse.json({ error: 'Room not found or already started' }, { status: 404 });

        // Add player if not already in
        const exists = room.players.find(p => p._id === player._id);
        if (!exists) {
            room.players.push(player);
            await room.save();
        }

        return NextResponse.json(room);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
