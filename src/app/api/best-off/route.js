import dbConnect from '@/lib/db';
import Content from '@/models/Content';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await dbConnect();
        const data = await Content.find({ isBestOff: true, status: 'approved' })
            .populate('club', 'name')
            .sort({ createdAt: -1 })
            .lean();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
