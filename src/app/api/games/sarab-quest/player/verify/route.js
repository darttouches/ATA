import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PhygitalTeam from '@/models/PhygitalTeam';
import PhygitalStage from '@/models/PhygitalStage';
import PhygitalGame from '@/models/PhygitalGame';

export async function POST(request) {
    try {
        await connectDB();
        const { teamId, stageId, answer } = await request.json();

        if (!teamId || !stageId || !answer) {
            return NextResponse.json({ success: false, error: 'Données manquantes' }, { status: 400 });
        }

        const team = await PhygitalTeam.findById(teamId);
        if (!team || team.completed) {
            return NextResponse.json({ success: false, error: 'Équipe invalide ou jeu terminé' }, { status: 400 });
        }

        // Verify stage with correct answer populated explicitly
        const stage = await PhygitalStage.findById(stageId).select('+correctAnswer').lean();
        if (!stage) {
            return NextResponse.json({ success: false, error: 'Étape non trouvée' }, { status: 404 });
        }

        const game = await PhygitalGame.findById(team.gameId);
        const actualCurrentStageId = game.stages[team.currentStageIndex].toString();
        
        if (actualCurrentStageId !== stageId) {
             return NextResponse.json({ success: false, error: 'Cette étape n\'est pas votre étape actuelle' }, { status: 400 });
        }

        const isCorrect = answer.trim().toLowerCase() === stage.correctAnswer.trim().toLowerCase();

        if (isCorrect) {
            let pointsEarned = stage.basePoints || 100;
            const now = new Date();
            let rankMessage = '';

            // Dynamic logic based on firstSolveTime
            if (!stage.firstSolveTime) {
                // First team to solve it!
                await PhygitalStage.findByIdAndUpdate(stageId, { firstSolveTime: now });
                rankMessage = 'أنت أول من يحل هذا اللغز! (الدرجة الكاملة)';
            } else {
                // Calculate time difference in minutes
                const minutesDiff = Math.floor((now - new Date(stage.firstSolveTime)) / 60000);
                
                if (minutesDiff > 0) {
                    // Deduct 2 points per minute, keeping a minimum of 25% of base points
                    const penalty = minutesDiff * 2;
                    const minPoints = Math.floor(pointsEarned * 0.25);
                    pointsEarned = Math.max(minPoints, pointsEarned - penalty);
                    rankMessage = `أحسنت! تأخرت بـ ${minutesDiff} دقيقة عن الفريق الأول.`;
                } else {
                    rankMessage = 'أحسنت! تقريباً في نفس الوقت مع الفريق الأول!';
                }
            }
            
            team.score += pointsEarned;
            team.currentStageIndex += 1;
            
            team.stageRecords.push({
                stageId: stage._id,
                completedAt: now,
                pointsEarned,
                hintsUsed: 0 
            });

            // Check if game is completed
            if (team.currentStageIndex >= game.stages.length) {
                team.completed = true;
                team.completedAt = now;
            }

            await team.save();

            return NextResponse.json({ 
                success: true, 
                message: rankMessage,
                pointsEarned,
                completed: team.completed
            });
        } else {
             return NextResponse.json({ 
                success: false, 
                message: 'Réponse incorrecte, réessayez !'
            });
        }

    } catch (error) {
        console.error('Error verifying answer:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}
