import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InterviewCandidate from '@/models/InterviewCandidate';
import { getUser } from '@/lib/auth';

export async function PUT(req, { params }) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const body = await req.json();
        
        // This can be used to update candidate's questions and remarks
        const candidate = await InterviewCandidate.findByIdAndUpdate(params.id, body, { new: true });
        if (!candidate) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

        return NextResponse.json({ success: true, data: candidate }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
