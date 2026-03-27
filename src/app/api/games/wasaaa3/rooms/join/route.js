import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Wasaaa3Room from '@/models/Wasaaa3Room';
import User from '@/models/User';
import { getUser } from '@/lib/auth';

export async function POST(req) {
    try {
        await dbConnect();
        const userToken = await getUser();
        const { roomCode } = await req.json();

        if (!userToken || userToken.error) {
            return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
        }

        const user = await User.findById(userToken.userId || userToken._id);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Utilisateur introuvable' }, { status: 404 });
        }

        const room = await Wasaaa3Room.findOne({ roomCode: roomCode?.toUpperCase(), status: 'waiting' });
        if (!room) {
            return NextResponse.json({ success: false, error: 'Room non trouvée ou déjà démarrée' }, { status: 404 });
        }

        // Check if user already in room
        const isAlreadyIn = room.players.some(p => p.userId.toString() === user._id.toString());
        if (!isAlreadyIn) {
            room.players.push({
                userId: user._id,
                name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.name || 'Joueur',
                profileImage: user.profileImage,
                ready: false,
                score: 0,
                finalHearts: 3,
                isFinished: false
            });
            await room.save();
        }

        return NextResponse.json({ success: true, data: room }, { status: 200 });

    } catch (error) {
        console.error('Error joining Wasaaa3 room:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
