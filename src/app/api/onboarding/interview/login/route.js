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

        // Validate exact time window (max 16 minutes late, and max 5 minutes early)
        if (candidate.interviewDate) {
            const scheduledTime = new Date(candidate.interviewDate).getTime();
            const now = Date.now();

            // Helper: check if 'now' falls within the allowed window for a given reference time
            const isWithinWindow = (refTime) => {
                const minAllowed = refTime - 5 * 60 * 1000;  // 5 min early
                const expiry    = refTime + 16 * 60 * 1000; // 16 min late
                return now >= minAllowed && now <= expiry;
            };

            // Primary check (correct timezone, ISO-stored date)
            const primaryOk = isWithinWindow(scheduledTime);

            // Fallback: legacy entries may have been saved with +1h or +2h offset
            // (naive "HH:mm" string parsed as UTC when user was in UTC+1 or UTC+2).
            // We check shifted windows so those candidates aren't locked out.
            const fallback1hOk = isWithinWindow(scheduledTime - 1 * 60 * 60 * 1000);
            const fallback2hOk = isWithinWindow(scheduledTime - 2 * 60 * 60 * 1000);

            const inWindow = primaryOk || fallback1hOk || fallback2hOk;

            if (!inWindow) {
                // Determine whether the candidate is yet to arrive or has expired
                // Use the most permissive reference time for error messaging
                const effectiveScheduled = fallback1hOk || fallback2hOk
                    ? scheduledTime - 1 * 60 * 60 * 1000
                    : scheduledTime;

                const tooEarly = now < (effectiveScheduled - 5 * 60 * 1000);

                if (tooEarly) {
                    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                    const optionsTime = { hour: '2-digit', minute: '2-digit' };
                    const dateStr = new Date(candidate.interviewDate).toLocaleDateString('fr-FR', optionsDate);
                    const timeStr = new Date(candidate.interviewDate).toLocaleTimeString('fr-FR', optionsTime);
                    return NextResponse.json({ 
                        success: false, 
                        error: `Ce code n'est utilisable qu'à l'heure exacte de votre entretien prévu le ${dateStr} à ${timeStr}.` 
                    }, { status: 403 });
                }

                return NextResponse.json({ 
                    success: false, 
                    error: "Le code d'entretien a expiré. Vous avez dépassé le délai de retard maximal autorisé (16 minutes après l'heure prévue)." 
                }, { status: 403 });
            }
        }

        return NextResponse.json({ success: true, candidateId: candidate._id, status: candidate.status }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
