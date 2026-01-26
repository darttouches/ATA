import dbConnect from '@/lib/db';
import BoardMember from '@/models/BoardMember';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await dbConnect();
        const data = await BoardMember.find({ active: true }).sort({ order: 1 }).lean();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
