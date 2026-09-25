import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PhygitalGame from '@/models/PhygitalGame';
import PhygitalStage from '@/models/PhygitalStage'; // To let mongoose know about it for populate
import PhygitalTeam from '@/models/PhygitalTeam';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        
        const game = await PhygitalGame.findById(id).populate({
            path: 'stages',
            select: '+correctAnswer'
        });
        if (!game) {
            return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, data: game });
    } catch (error) {
        console.error('Error fetching game:', error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();
        
        const game = await PhygitalGame.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).populate('stages');
        
        if (!game) {
            return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, data: game });
    } catch (error) {
        console.error('Error updating game:', error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        
        const game = await PhygitalGame.findById(id);
        if (!game) {
            return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
        }
        
        // Delete all stages and teams associated with the game
        await PhygitalStage.deleteMany({ gameId: id });
        await PhygitalTeam.deleteMany({ gameId: id });
        await game.deleteOne();
        
        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        console.error('Error deleting game:', error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
