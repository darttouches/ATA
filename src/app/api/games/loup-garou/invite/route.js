import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GameRoom from '@/models/GameRoom';
import Notification from '@/models/Notification';
import { getUser } from '@/lib/auth';

export async function POST(req) {
    try {
        await dbConnect();
        const user = await getUser();
        
        if (!user || user.error) {
            return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
        }

        const { roomId } = await req.json();
        const room = await GameRoom.findById(roomId);
        if (!room) return NextResponse.json({ success: false, error: 'Partie introuvable' }, { status: 404 });

        // Ensure current user is the GM
        if (room.creatorId.toString() !== (user.userId || user._id).toString()) {
            return NextResponse.json({ success: false, error: 'Seulement le MJ peut inviter' }, { status: 403 });
        }

        const User = mongoose.model('User');
        const senderDoc = await User.findById(user.userId || user._id).select('name');
        const senderName = senderDoc ? senderDoc.name : 'Un Maître du jeu';

        // Send notifications to all assigned players
        const invitees = room.players.filter(p => p.userId);

        const notifPromises = invitees.map(async (player) => {
            try {
                const notif = await Notification.create({
                    recipient: player.userId,
                    sender: user.userId || user._id,
                    type: 'meeting', // Using standard valid enum
                    title: 'Invitation Loup-Garou 🐺',
                    message: `${senderName} vous a invité à paramétrer et rejoindre une partie de Loup-Garou !`,
                    link: '/games/loup-garou'
                });
                return { success: true, userId: player.userId };
            } catch (err) {
                return { success: false, userId: player.userId, error: err.message };
            }
        });

        const results = await Promise.all(notifPromises);
        const failures = results.filter(r => !r.success);

        return NextResponse.json({ 
            success: true, 
            message: `Invitations de jeu envoyées ! (Total: ${invitees.length})`,
            debug: { totalPlayers: room.players.length, inviteesFiltered: invitees.length, failures }
        });

    } catch (error) {
        console.error('Error inviting players to Loup-Garou:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
