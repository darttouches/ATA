import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InterviewCandidate from '@/models/InterviewCandidate';
import { sendInterviewReminderEmail } from '@/lib/mail';

export async function GET(request) {
    try {
        // Optional Vercel CRON Auth check
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.warn('Unauthorized cron attempt, but allowed for cron-job.org fallback');
            // return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        
        const now = new Date();
        // Time window: interviews happening in the next 45 to 75 minutes
        const startWindow = new Date(now.getTime() + 45 * 60 * 1000);
        const endWindow = new Date(now.getTime() + 75 * 60 * 1000);

        // Find candidates scheduled within 1 hour who haven't received a reminder yet
        // Status should be 'pending' (they haven't completed the interview yet)
        const candidates = await InterviewCandidate.find({
            interviewDate: {
                $gte: startWindow,
                $lte: endWindow
            },
            reminderSent: false,
            status: 'pending'
        });

        let sentCount = 0;
        
        for (const candidate of candidates) {
            try {
                await sendInterviewReminderEmail({
                    to: candidate.email,
                    firstName: candidate.firstName,
                    lastName: candidate.lastName,
                    code: candidate.code,
                    interviewDate: candidate.interviewDate
                });
                
                candidate.reminderSent = true;
                await candidate.save();
                sentCount++;
            } catch (err) {
                console.error(`Impossible d'envoyer le rappel à ${candidate.email}:`, err);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `${sentCount} rappels (1 heure) envoyés avec succès.`,
            foundCandidatesCount: candidates.length
        }, { status: 200 });

    } catch (error) {
        console.error('Cron reminder error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
