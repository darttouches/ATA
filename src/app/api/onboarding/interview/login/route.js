import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InterviewCandidate from '@/models/InterviewCandidate';
import Settings from '@/models/Settings';

export async function POST(req) {
    try {
        await dbConnect();
        const { code } = await req.json();

        if (!code) return NextResponse.json({ success: false, error: 'Veuillez entrer votre code.' }, { status: 400 });

        // Validate recruitment period
        const settings = await Settings.findOne({ key: 'recruitment' });
        if (settings?.value) {
            const { isOpen, startDate, endDate } = settings.value;
            if (isOpen === false) {
                return NextResponse.json({ 
                    success: false, 
                    error: "Les entretiens sont actuellement fermés par l'administration." 
                }, { status: 403 });
            }

            const now = new Date();
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (now < start) {
                    return NextResponse.json({ 
                        success: false, 
                        error: `Les entretiens ouvriront le ${start.toLocaleDateString('fr-FR')}.` 
                    }, { status: 403 });
                }
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (now > end) {
                    return NextResponse.json({ 
                        success: false, 
                        error: `La période d'inscription et d'entretien est clôturée depuis le ${end.toLocaleDateString('fr-FR')}.` 
                    }, { status: 403 });
                }
            }
        }

        const candidate = await InterviewCandidate.findOne({ code: code.toUpperCase() });
        if (!candidate) return NextResponse.json({ success: false, error: 'Code invalide ou introuvable.' }, { status: 404 });

        return NextResponse.json({ success: true, candidateId: candidate._id, status: candidate.status }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
