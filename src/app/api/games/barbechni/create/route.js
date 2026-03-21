import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BarbechniRoom from '@/models/BarbechniRoom';
import Settings from '@/models/Settings';

export async function POST(req) {
    try {
        await dbConnect();
        const { createdBy, players, settings } = await req.json();

        // Generate short room code
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const newRoom = await BarbechniRoom.create({
            roomCode,
            createdBy,
            players,
            settings: settings || {
                allowAnonymityVote: true,
                allowQuestion: true,
                allowReclamation: true
            },
            status: 'waiting'
        });

        return NextResponse.json(newRoom);
    } catch (error) {
        console.error('Barbechni create error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
