import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InterviewCandidate from '@/models/InterviewCandidate';

export async function POST(req) {
    try {
        await dbConnect();
        const { code } = await req.json();

        if (!code) return NextResponse.json({ success: false, error: 'Veuillez entrer votre code.' }, { status: 400 });

        const candidate = await InterviewCandidate.findOne({ code: code.toUpperCase() });
        if (!candidate) return NextResponse.json({ success: false, error: 'Code invalide ou introuvable.' }, { status: 404 });

        return NextResponse.json({ success: true, candidateId: candidate._id, status: candidate.status }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
