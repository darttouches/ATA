import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InterviewCandidate from '@/models/InterviewCandidate';

export async function POST(req) {
    try {
        await dbConnect();
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ success: false, error: "Veuillez fournir un code d'entretien." }, { status: 400 });
        }

        const formattedCode = code.trim().toUpperCase();
        const candidate = await InterviewCandidate.findOne({ code: formattedCode });

        if (!candidate) {
            return NextResponse.json({ success: false, error: "Code d'entretien introuvable. Veuillez vérifier votre saisie." }, { status: 404 });
        }

        if (candidate.decision === 'rejected') {
            return NextResponse.json({ 
                success: false, 
                error: "Désolé, la candidature associée à ce code n'a pas été retenue par l'administration." 
            }, { status: 400 });
        }

        if (candidate.decision !== 'accepted') {
            return NextResponse.json({ 
                success: false, 
                error: "Votre entretien n'a pas encore été validé/accepté par l'administration." 
            }, { status: 400 });
        }

        return NextResponse.json({ 
            success: true, 
            candidate: {
                firstName: candidate.firstName,
                lastName: candidate.lastName,
                email: candidate.email,
                phone: candidate.phone,
                code: candidate.code
            } 
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
