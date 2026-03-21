import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GameRoom from '@/models/GameRoom';
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

        const { mode, rolePool, players } = await req.json();

        // Create new room
        const roomCode = generateRoomCode();
        
        // Distribution of roles
        let availableRoles = [...rolePool];
        const distributedPlayers = players.map(player => {
            const randomIndex = Math.floor(Math.random() * availableRoles.length);
            const roleId = availableRoles[randomIndex];
            availableRoles.splice(randomIndex, 1);
            return {
                ...player,
                roleId,
                isAlive: true,
                isRevealed: false
            };
        });

        const newRoom = await GameRoom.create({
            roomCode,
            creatorId: user.userId || user._id,
            mode,
            gameType: 'loup-garou',
            status: 'playing', // Start immediately after creation
            players: distributedPlayers,
            rolePool
        });

        return NextResponse.json({ success: true, data: newRoom }, { status: 201 });

    } catch (error) {
        console.error('Error creating game room:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
