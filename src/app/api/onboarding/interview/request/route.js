import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InterviewCandidate from '@/models/InterviewCandidate';
import InterviewContent from '@/models/InterviewContent';
import Settings from '@/models/Settings';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { sendInterviewCodeEmail } from '@/lib/mail';

function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { firstName, lastName, email, phone, interviewDate } = body;
        
        if (!firstName || !lastName || !email || !phone || !interviewDate) {
            return NextResponse.json({ success: false, error: 'Tous les champs sont requis' }, { status: 400 });
        }

        // Check recruitment settings & date window
        const recruitmentDoc = await Settings.findOne({ key: 'recruitment' });
        const recruitment = recruitmentDoc?.value;
        if (recruitment) {
            if (recruitment.isOpen === false) {
                return NextResponse.json(
                    { success: false, error: 'Les inscriptions et demandes d\'entretien sont actuellement fermées par l\'administration.' },
                    { status: 403 }
                );
            }
            const now = new Date();
            if (recruitment.startDate) {
                const start = new Date(recruitment.startDate);
                start.setHours(0, 0, 0, 0);
                if (now < start) {
                    return NextResponse.json(
                        { success: false, error: `La période d'inscription n'a pas encore débuté. Ouverture prévue le ${start.toLocaleDateString('fr-FR')}.` },
                        { status: 403 }
                    );
                }
            }
            if (recruitment.endDate) {
                const end = new Date(recruitment.endDate);
                end.setHours(23, 59, 59, 999);
                if (now > end) {
                    return NextResponse.json(
                        { success: false, error: `La période d'inscription est clôturée depuis le ${end.toLocaleDateString('fr-FR')}.` },
                        { status: 403 }
                    );
                }
            }
        }

        // Validate requested interview date
        const requestedDate = new Date(interviewDate);
        if (isNaN(requestedDate.getTime())) {
            return NextResponse.json({ success: false, error: 'Date d\'entretien invalide.' }, { status: 400 });
        }

        // Dynamic lead time requirement
        const leadDays = recruitment?.interviewLeadTimeDays !== undefined ? recruitment.interviewLeadTimeDays : 2;
        if (leadDays > 0) {
            const minAllowedDate = new Date(Date.now() + leadDays * 24 * 60 * 60 * 1000);
            if (requestedDate < minAllowedDate) {
                return NextResponse.json(
                    { success: false, error: `La date d'entretien doit être fixée au minimum ${leadDays} jour${leadDays > 1 ? 's' : ''} après la date de votre demande.` },
                    { status: 400 }
                );
            }
        }

        // Ensure requested interview date respects recruitment period start and end
        if (recruitment?.startDate) {
            const start = new Date(recruitment.startDate);
            start.setHours(0, 0, 0, 0);
            if (requestedDate < start) {
                return NextResponse.json(
                    { success: false, error: `La date d'entretien doit se trouver dans la période d'inscription (à partir du ${start.toLocaleDateString('fr-FR')}).` },
                    { status: 400 }
                );
            }
        }

        if (recruitment?.endDate) {
            const end = new Date(recruitment.endDate);
            end.setHours(23, 59, 59, 999);
            if (requestedDate > end) {
                return NextResponse.json(
                    { success: false, error: `La date d'entretien doit se trouver dans la période d'inscription (au plus tard le ${end.toLocaleDateString('fr-FR')}).` },
                    { status: 400 }
                );
            }
        }

        let code;
        let isUnique = false;
        while (!isUnique) {
            code = generateCode();
            const exists = await InterviewCandidate.findOne({ code });
            if (!exists) isUnique = true;
        }

        // Fetch default questions and remarks
        const defaultQuestions = await InterviewContent.find({ type: 'question', isActive: { $ne: false }, isDefault: { $ne: false } });
        const defaultRemarks = await InterviewContent.find({ type: 'remark', isActive: { $ne: false }, isDefault: { $ne: false } });

        const initialQuestions = defaultQuestions.map(q => ({
            originalId: q._id,
            text: q.text,
            answer: ''
        }));

        const initialRemarks = defaultRemarks.map(r => ({
            text: r.text
        }));

        const candidate = await InterviewCandidate.create({
            code,
            firstName,
            lastName,
            email,
            phone,
            interviewDate,
            questions: initialQuestions,
            remarks: initialRemarks
        });

        // Send trilingual confirmation email to candidate
        try {
            await sendInterviewCodeEmail({
                to: email,
                firstName,
                lastName,
                code: candidate.code,
                interviewDate
            });
        } catch (emailError) {
            console.error("Impossible d'envoyer l'email au candidat (email error):", emailError);
        }

        // Notify admins and national bureau members about the new interview request
        try {
            const notifRecipients = await User.find(
                { role: { $in: ['admin', 'national'] }, isActive: { $ne: false } },
                '_id'
            );

            if (notifRecipients.length > 0) {
                const formattedDate = new Date(interviewDate).toLocaleDateString('fr-FR', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });

                const notifDocs = notifRecipients.map(u => ({
                    recipient: u._id,
                    type: 'new_candidate',
                    title: '🎓 Nouvelle demande d\'entretien',
                    message: `${firstName} ${lastName} a soumis une demande d'entretien pour le ${formattedDate}. Code : ${candidate.code}`,
                    link: '/dashboard/interviews'
                }));

                // Insert one by one to trigger the push-notification post('save') middleware
                for (const doc of notifDocs) {
                    await new Notification(doc).save();
                }
            }
        } catch (notifError) {
            console.error('Erreur lors de l\'envoi des notifications aux admins:', notifError);
        }

        return NextResponse.json({ success: true, code: candidate.code }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
