import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PhygitalTeam from '@/models/PhygitalTeam';
import PhygitalGame from '@/models/PhygitalGame';
import crypto from 'crypto';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const gameId = searchParams.get('gameId');

        await connectDB();
        
        let query = {};
        if (gameId) {
            query.gameId = gameId;
        }

        const teams = await PhygitalTeam.find(query).sort({ score: -1, completedAt: 1 });
        return NextResponse.json({ success: true, count: teams.length, data: teams });
    } catch (error) {
        console.error('Error fetching teams:', error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        
        const { gameId, teamName, members } = body;

        const game = await PhygitalGame.findById(gameId);
        if (!game) {
            return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
        }

        // Generate a random 6-character alphanumeric code
        const accessCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        const team = await PhygitalTeam.create({
            gameId,
            teamName,
            members: members || [],
            accessCode,
            currentStageIndex: 0,
            score: 0,
        });
        
        return NextResponse.json({ success: true, data: team }, { status: 201 });
    } catch (error) {
        console.error('Error creating team:', error);
        return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
    }
}
