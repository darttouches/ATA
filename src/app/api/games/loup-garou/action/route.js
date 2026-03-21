import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GameRoom from '@/models/GameRoom';
import { getUser } from '@/lib/auth';

export async function POST(req) {
    try {
        await dbConnect();
        const user = await getUser();
        
        if (!user || user.error) {
            return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
        }

        const { roomId, playerIndex, field, value } = await req.json();

        const room = await GameRoom.findById(roomId);
        if (!room) {
            return NextResponse.json({ success: false, error: 'Partie non trouvée' }, { status: 404 });
        }

        // Only the creator (MJ) can update the game state
        if (room.creatorId.toString() !== (user.userId || user._id).toString()) {
            return NextResponse.json({ success: false, error: 'Action réservée au Maître du Jeu' }, { status: 403 });
        }

        // Update game state directly
        if (field === 'status') {
            room.status = value;
            await room.save();
            return NextResponse.json({ success: true, data: room });
        }

        // Update player field
        if (playerIndex !== undefined && room.players && room.players[playerIndex]) {
            room.players[playerIndex][field] = value;
            await room.save();
            return NextResponse.json({ success: true, data: room });
        }

        return NextResponse.json({ success: false, error: 'Requête action invalide' }, { status: 400 });

    } catch (error) {
        console.error('Error updating game room:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
