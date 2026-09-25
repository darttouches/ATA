import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PhygitalTeam from '@/models/PhygitalTeam';
import PhygitalGame from '@/models/PhygitalGame';

export async function POST(request) {
    try {
        await connectDB();
        const { accessCode } = await request.json();

        if (!accessCode) {
            return NextResponse.json({ success: false, error: 'Code d\'accès requis' }, { status: 400 });
        }

        const team = await PhygitalTeam.findOne({ accessCode: accessCode.toUpperCase() });
        if (!team) {
            return NextResponse.json({ success: false, error: 'Code d\'accès invalide' }, { status: 404 });
        }

        const game = await PhygitalGame.findById(team.gameId);
        if (!game) {
            return NextResponse.json({ success: false, error: 'Jeu non trouvé' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                teamId: team._id,
                teamName: team.teamName,
                gameId: game._id,
                gameName: game.name,
                startTime: game.startTime,
                status: game.status,
            }
        });
    } catch (error) {
        console.error('Error logging in team:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}
