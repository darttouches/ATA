import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Wasaaa3Room from '@/models/Wasaaa3Room';
import User from '@/models/User';
import { getUser } from '@/lib/auth';

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req) {
    try {
        await dbConnect();
        const userToken = await getUser();
        
        if (!userToken || userToken.error) {
            return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
        }

        const user = await User.findById(userToken.userId || userToken._id);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Utilisateur introuvable' }, { status: 404 });
        }

        const roomCode = generateRoomCode();
        
        const newRoom = await Wasaaa3Room.create({
            roomCode,
            creatorId: user._id,
            status: 'waiting',
            players: [{
                userId: user._id,
                name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.name || 'Hôte',
                profileImage: user.profileImage,
                ready: false,
                score: 0,
                finalHearts: 3,
                isFinished: false
            }]
        });

        return NextResponse.json({ success: true, data: newRoom }, { status: 201 });

    } catch (error) {
        console.error('Error creating Wasaaa3 room:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
