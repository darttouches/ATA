import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PhygitalTeam from '@/models/PhygitalTeam';
import PhygitalStage from '@/models/PhygitalStage';
import PhygitalGame from '@/models/PhygitalGame';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('teamId');

        if (!teamId) {
            return NextResponse.json({ success: false, error: 'Team ID requis' }, { status: 400 });
        }

        await connectDB();
        
        const team = await PhygitalTeam.findById(teamId);
        if (!team) {
            return NextResponse.json({ success: false, error: 'Équipe non trouvée' }, { status: 404 });
        }

        const game = await PhygitalGame.findById(team.gameId).populate({
            path: 'stages',
            options: { sort: { 'order': 1 } }
        });
        
        if (!game) {
            return NextResponse.json({ success: false, error: 'Jeu non trouvé' }, { status: 404 });
        }

        // Determine if game has started
        const now = new Date();
        const hasStarted = game.status === 'active' || (game.startTime && now >= new Date(game.startTime));

        if (!hasStarted) {
             return NextResponse.json({
                success: true,
                data: {
                    gameState: 'waiting',
                    gameName: game.name,
                    mapTexture: game.mapTexture || 'map_general',
                    startTime: game.startTime,
                    stagesSummary: game.stages.map((st, idx) => ({ id: st._id, title: st.title || `المهمة ${idx + 1}`, validationType: st.validationType })),
                    team: { name: team.teamName, score: team.score }
                }
            });
        }

        if (team.completed || team.currentStageIndex >= game.stages.length) {
            const leaderboard = await PhygitalTeam.find({ gameId: game._id })
                .sort({ score: -1, currentStageIndex: -1 })
                .select('teamName score currentStageIndex completed')
                .lean();
                
            return NextResponse.json({
                success: true,
                data: {
                    gameState: 'completed',
                    gameName: game.name,
                    mapTexture: game.mapTexture || 'map_general',
                    stagesSummary: game.stages.map((st, idx) => ({ id: st._id, title: st.title || `المهمة ${idx + 1}`, validationType: st.validationType })),
                    leaderboard: leaderboard,
                    team: { name: team.teamName, score: team.score, completedAt: team.completedAt }
                }
            });
        }

        // Present current stage
        const currentStage = game.stages[team.currentStageIndex];
        
        // Only return necessary info, NEVER the correctAnswer
        const stageInfo = {
            _id: currentStage._id,
            title: currentStage.title,
            clueText: currentStage.clueText,
            validationType: currentStage.validationType,
            choices: currentStage.validationType === 'choice' ? currentStage.choices : undefined,
            order: currentStage.order,
            totalStages: game.stages.length,
        };
        
        // Expose a summary of all stages for the map (without correct answers)
        const stagesSummary = game.stages.map((st, idx) => ({
            id: st._id,
            title: st.title || `المهمة ${idx + 1}`,
            validationType: st.validationType,
            order: st.order
        }));
        
        // Fetch leaderboard Data
        const leaderboard = await PhygitalTeam.find({ gameId: game._id })
            .sort({ score: -1, currentStageIndex: -1 })
            .select('teamName score currentStageIndex completed')
            .lean();

        return NextResponse.json({
            success: true,
            data: {
                gameState: 'playing',
                gameName: game.name,
                mapTexture: game.mapTexture || 'map_general',
                stage: stageInfo,
                stagesSummary: stagesSummary,
                leaderboard: leaderboard,
                team: { 
                    name: team.teamName, 
                    score: team.score,
                    currentStageIndex: team.currentStageIndex 
                }
            }
        });

    } catch (error) {
        console.error('Error fetching game state:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}
