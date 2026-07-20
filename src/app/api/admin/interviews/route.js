import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InterviewCandidate from '@/models/InterviewCandidate';
import { getUser } from '@/lib/auth';

export async function GET(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        // Sort by date desc
        const candidates = await InterviewCandidate.find({}).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: candidates }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
