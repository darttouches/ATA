import dbConnect from '@/lib/db';
import AboutSection from '@/models/AboutSection';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();
        const sections = await AboutSection.find({ active: true }).sort({ order: 1, createdAt: -1 });
        return NextResponse.json(sections);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
