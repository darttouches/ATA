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

        // Validate exact time window (max 16 minutes late, and max 5 minutes early)
        if (candidate.interviewDate) {
            const scheduledTime = new Date(candidate.interviewDate).getTime();
            const minAllowedTime = scheduledTime - 5 * 60 * 1000; // 5 minutes before
            const expiryTime = scheduledTime + 16 * 60 * 1000; // 16 minutes grace period
            const now = Date.now();

            if (now < minAllowedTime) {
                const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const optionsTime = { hour: '2-digit', minute: '2-digit' };
                const dateStr = new Date(candidate.interviewDate).toLocaleDateString('fr-FR', optionsDate);
                const timeStr = new Date(candidate.interviewDate).toLocaleTimeString('fr-FR', optionsTime);

                return NextResponse.json({ 
                    success: false, 
                    error: `Ce code n'est utilisable qu'à l'heure exacte de votre entretien prévu le ${dateStr} à ${timeStr}.` 
                }, { status: 400 });
            }

            if (now > expiryTime) {
                return NextResponse.json({ 
                    success: false, 
                    error: "Le code d'entretien a expiré. Vous avez dépassé le délai de retard maximal autorisé (16 minutes après l'heure prévue)." 
                }, { status: 400 });
            }
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
