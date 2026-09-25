import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PhygitalStage from '@/models/PhygitalStage';
import PhygitalGame from '@/models/PhygitalGame';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        
        // Ensure the game exists
        const game = await PhygitalGame.findById(body.gameId);
        if (!game) {
            return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
        }
        
        // Generate an order if not provided
        let order = body.order;
        if (order === undefined) {
            const count = await PhygitalStage.countDocuments({ gameId: body.gameId });
            order = count;
        }

        const stage = await PhygitalStage.create({
            gameId: body.gameId,
            order: order,
            title: body.title,
            clueText: body.clueText,
            validationType: body.validationType || 'text',
            correctAnswer: body.correctAnswer,
            choices: body.choices || [],
            hints: body.hints || [],
            basePoints: body.basePoints || 100,
        });

        // Add stage to game
        game.stages.push(stage._id);
        await game.save();
        
        return NextResponse.json({ success: true, data: stage }, { status: 201 });
    } catch (error) {
        console.error('Error creating stage:', error);
        return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { stageId, ...updateData } = body;
        
        if (!stageId) {
            return NextResponse.json({ success: false, error: 'stageId required' }, { status: 400 });
        }

        const stage = await PhygitalStage.findByIdAndUpdate(stageId, updateData, { new: true });
        if (!stage) {
            return NextResponse.json({ success: false, error: 'Stage not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: stage });
    } catch (error) {
        console.error('Error updating stage:', error);
        return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const stageId = searchParams.get('stageId');
        const gameId = searchParams.get('gameId');

        if (!stageId || !gameId) {
            return NextResponse.json({ success: false, error: 'stageId and gameId required' }, { status: 400 });
        }

        const stage = await PhygitalStage.findByIdAndDelete(stageId);
        if (!stage) {
            return NextResponse.json({ success: false, error: 'Stage not found' }, { status: 404 });
        }

        // Remove from game stages array
        const game = await PhygitalGame.findById(gameId);
        if (game) {
            game.stages = game.stages.filter(id => id.toString() !== stageId);
            await game.save();
        }

        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        console.error('Error deleting stage:', error);
        return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
    }
}
