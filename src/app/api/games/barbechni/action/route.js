import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BarbechniRoom from '@/models/BarbechniRoom';

export async function POST(req) {
    try {
        await dbConnect();
        const { roomId, type, playerIndex, card, vote, fromId } = await req.json();

        const room = await BarbechniRoom.findById(roomId);
        if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

        switch (type) {
            case 'START_WRITING':
                room.status = 'writing';
                break;
            
            case 'SUBMIT_CARD':
                const newCard = {
                    ...card,
                    isAnonymous: true,
                    votingActive: false,
                    voteResults: { yes: [], no: [], total: 0 }
                };
                room.cards.push(newCard);
                if (room.cards.length >= room.players.length) {
                    room.status = 'reading';
                }
                break;
            
            case 'START_READING':
                room.status = 'reading';
                room.currentReadingPlayerIndex = 0;
                room.currentCardIndex = 0;
                // Shuffle reading order? Or just go through players
                break;

            case 'VOTE':
                const voteCard = room.cards[room.currentCardIndex];
                if (voteCard && voteCard.votingActive) {
                    if (vote === 'yes') {
                        voteCard.voteResults.no = voteCard.voteResults.no.filter(id => id !== fromId);
                        if (!voteCard.voteResults.yes.includes(fromId)) voteCard.voteResults.yes.push(fromId);
                    } else {
                        voteCard.voteResults.yes = voteCard.voteResults.yes.filter(id => id !== fromId);
                        if (!voteCard.voteResults.no.includes(fromId)) voteCard.voteResults.no.push(fromId);
                    }
                    voteCard.voteResults.total = voteCard.voteResults.yes.length + voteCard.voteResults.no.length;
                    
                    if (voteCard.voteResults.total >= room.players.length) {
                        voteCard.votingActive = false;
                        if (voteCard.voteResults.yes.length > voteCard.voteResults.no.length) {
                            voteCard.isAnonymous = false;
                        }
                    }
                }
                break;

            case 'NEXT_CARD':
                room.currentCardIndex += 1;
                if (room.currentCardIndex >= room.cards.length) {
                    room.status = 'finished';
                }
                break;
            
            case 'ACTIVATE_VOTE':
                if (room.cards[room.currentCardIndex]) {
                    room.cards[room.currentCardIndex].votingActive = true;
                }
                break;
        }

        await room.save();
        return NextResponse.json(room);
    } catch (error) {
        console.error('Barbechni action error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
