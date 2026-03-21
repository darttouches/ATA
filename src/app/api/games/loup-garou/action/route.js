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
        const reqUserId = (user.userId || user._id)?.toString();

        // EMERGENCY OVERRIDE
        if (roomId === 'FORCE_CLEAN' && user.role === 'admin') {
            const result = await GameRoom.updateMany({}, { status: 'finished' });
            return NextResponse.json({ success: true, message: 'All locked rooms cleaned.', count: result.modifiedCount });
        }

        const room = await GameRoom.findById(roomId);
        if (!room) {
            return NextResponse.json({ success: false, error: 'Partie non trouvée' }, { status: 404 });
        }

        const isMj = room.creatorId.toString() === reqUserId;

        // Update game status (MJ only)
        if (field === 'status') {
            if (!isMj) return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
            room.status = value;
            await room.save();
            return NextResponse.json({ success: true, data: room });
        }

        // Send a chat message (anyone in the room)
        if (field === 'send_chat') {
            const isParticipant = isMj || room.players.some(p => p.userId?.toString() === reqUserId);
            if (!isParticipant) return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
            if (!room.chat) room.chat = [];
            room.chat.push(value);
            room.markModified('chat');
            await room.save();
            return NextResponse.json({ success: true, data: room });
        }

        // Manage Vote State (Only MJ)
        if (field === 'vote_state') {
            if (!isMj) return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
            if (!room.voteState) room.voteState = { isActive: false, votes: [] };
            room.voteState = value;
            room.markModified('voteState');
            await room.save();
            return NextResponse.json({ success: true, data: room });
        }

        // Submit a vote (alive players only)
        if (field === 'submit_vote') {
            const voter = room.players.find(p => p.userId?.toString() === reqUserId);
            if (!voter || !voter.isAlive) {
                return NextResponse.json({ success: false, error: 'Seuls les joueurs en vie peuvent voter' }, { status: 403 });
            }
            if (!room.voteState || !room.voteState.isActive) {
                return NextResponse.json({ success: false, error: 'Aucun vote en cours' }, { status: 400 });
            }
            if (!room.voteState.votes) room.voteState.votes = [];
            const existingVoteIndex = room.voteState.votes.findIndex(v => v.voterId === reqUserId);
            if (existingVoteIndex > -1) {
                room.voteState.votes[existingVoteIndex].targetId = value;
            } else {
                room.voteState.votes.push({ voterId: reqUserId, targetId: value });
            }
            room.markModified('voteState');
            await room.save();
            return NextResponse.json({ success: true, data: room });
        }

        // Update player field (MJ only)
        if (!isMj) {
            return NextResponse.json({ success: false, error: 'Action réservée au Maître du Jeu' }, { status: 403 });
        }

        if (playerIndex !== undefined && room.players && room.players[playerIndex]) {
            room.players[playerIndex][field] = value;
            room.markModified('players');
            await room.save();
            return NextResponse.json({ success: true, data: room });
        }

        return NextResponse.json({ success: false, error: 'Requête action invalide' }, { status: 400 });

    } catch (error) {
        console.error('Error updating game room:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
