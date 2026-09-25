import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PhygitalGame from '@/models/PhygitalGame';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
    try {
        await connectDB();
        const games = await PhygitalGame.find().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, count: games.length, data: games });
    } catch (error) {
        console.error('Error fetching phygital games:', error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        
        // Basic auth check for admin (assume verifyAuth works this way based on standard Next.js setups)
        // const authResult = await verifyAuth(request);
        // if (!authResult.user || authResult.user.role !== 'admin') {
        //     return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        // }

        const body = await request.json();
        
        const game = await PhygitalGame.create({
            name: body.name,
            description: body.description,
            location: body.location,
            startTime: body.startTime,
            status: body.status || 'draft',
            mapTexture: body.mapTexture || 'map_general',
            // createdBy: authResult.user.id
        });
        
        return NextResponse.json({ success: true, data: game }, { status: 201 });
    } catch (error) {
        console.error('Error creating phygital game:', error);
        return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
    }
}
