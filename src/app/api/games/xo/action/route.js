import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import XOGameRoom from '@/models/XOGameRoom';
import { getUser } from '@/lib/auth';

const checkWinner = (currentBoard) => {
    // Rows
    for (let r = 0; r < 4; r++) {
        if (currentBoard[r][0] && currentBoard[r][0] === currentBoard[r][1] && currentBoard[r][1] === currentBoard[r][2] && currentBoard[r][2] === currentBoard[r][3]) {
            return currentBoard[r][0];
        }
    }
    // Cols
    for (let c = 0; c < 4; c++) {
        if (currentBoard[0][c] && currentBoard[0][c] === currentBoard[1][c] && currentBoard[1][c] === currentBoard[2][c] && currentBoard[2][c] === currentBoard[3][c]) {
            return currentBoard[0][c];
        }
    }
    // Diagonals
    if (currentBoard[0][0] && currentBoard[0][0] === currentBoard[1][1] && currentBoard[1][1] === currentBoard[2][2] && currentBoard[2][2] === currentBoard[3][3]) {
        return currentBoard[0][0];
    }
    if (currentBoard[0][3] && currentBoard[0][3] === currentBoard[1][2] && currentBoard[1][2] === currentBoard[2][1] && currentBoard[2][1] === currentBoard[3][0]) {
        return currentBoard[0][3];
    }
    return null;
};

export async function POST(req) {
    try {
        await dbConnect();
        const user = await getUser();
        
        if (!user || user.error) {
            return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
        }

        const { roomId, action, r, c, from, to, type } = await req.json();
        const room = await XOGameRoom.findById(roomId);
        if (!room) return NextResponse.json({ success: false, error: 'Partie introuvable' }, { status: 404 });

        // Identify current player
        const userId = (user.userId || user._id).toString();
        let player = room.players.find(p => p.userId.toString() === userId && p.symbol === room.currentTurn);
        if (!player) player = room.players.find(p => p.userId.toString() === userId);
        
        if (!player && action !== 'react') {
            return NextResponse.json({ success: false, error: 'Pas autorisé ou pas joueur de cette partie' }, { status: 403 });
        }

        // --- Reaction Action (Anyone can react) ---
        if (action === 'react') {
            room.reactions.push({
                userId: user.userId || user._id,
                type,
                timestamp: Date.now()
            });
            // Keep last 5 reactions
            if (room.reactions.length > 5) room.reactions.shift();
            room.markModified('reactions'); // Essential for deep array updates
            await room.save();
            return NextResponse.json({ success: true, data: room });
        }

        // --- Game Actions (Turn based) ---
        if (room.status !== 'playing') return NextResponse.json({ success: false, error: 'La partie est interrompue' }, { status: 400 });
        if (room.currentTurn !== player.symbol) return NextResponse.json({ success: false, error: 'Pas votre tour' }, { status: 400 });

        const board = room.board;

        if (action === 'place') {
            const tr = parseInt(r);
            const tc = parseInt(c);
            if (player.reserveCount <= 0) return NextResponse.json({ success: false, error: 'Pas de pièces en réserve' }, { status: 400 });
            if (board[tr][tc] !== null) {
                if (board[tr][tc] === player.symbol) return NextResponse.json({ success: false, error: 'Déjà occupé' }, { status: 400 });
                // Eject
                const occupantSymbol = board[tr][tc];
                board[tr][tc] = null;
                const otherPlayer = room.players.find(p => p.symbol === occupantSymbol);
                if (otherPlayer) otherPlayer.reserveCount += 1;
                room.currentTurn = occupantSymbol; // Force opponent's turn
            } else {
                board[tr][tc] = player.symbol;
                player.reserveCount -= 1;
                room.currentTurn = player.symbol === 'X' ? 'O' : 'X';
            }
        } 
        else if (action === 'move') {
            const fr = parseInt(from.r);
            const fc = parseInt(from.c);
            const tr = parseInt(to.r);
            const tc = parseInt(to.c);
            if (board[fr][fc] !== player.symbol) return NextResponse.json({ success: false, error: 'Pas votre pièce' }, { status: 400 });
            if (board[tr][tc] !== null) {
                 if (board[tr][tc] === player.symbol) return NextResponse.json({ success: false, error: 'Déjà occupé' }, { status: 400 });
                 // Eject
                 const occupantSymbol = board[tr][tc];
                 const otherPlayer = room.players.find(p => p.symbol === occupantSymbol);
                 if (otherPlayer) otherPlayer.reserveCount += 1;
            }
            board[tr][tc] = player.symbol;
            board[fr][fc] = null;
            room.currentTurn = player.symbol === 'X' ? 'O' : 'X';
        }
        else if (action === 'eject') {
            const tr = parseInt(r);
            const tc = parseInt(c);
            if (board[tr][tc] === null || board[tr][tc] === player.symbol) return NextResponse.json({ success: false, error: 'Pas de pièce adverse' }, { status: 400 });
            const occupantSymbol = board[tr][tc];
            const otherPlayer = room.players.find(p => p.symbol === occupantSymbol);
            if (otherPlayer) otherPlayer.reserveCount += 1;
            board[tr][tc] = null;
            room.currentTurn = player.symbol === 'X' ? 'O' : 'X';
        }

        // Check for winner
        const win = checkWinner(board);
        if (win) {
            room.status = 'finished';
            room.winner = win;
        }

        room.markModified('board');
        room.markModified('players');
        await room.save();

        return NextResponse.json({ success: true, data: room }, { status: 200 });

    } catch (error) {
        console.error('Error in XO action:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
