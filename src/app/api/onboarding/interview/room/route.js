import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InterviewCandidate from '@/models/InterviewCandidate';

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const candidateId = searchParams.get('candidateId');

        if (!candidateId) return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 });

        const candidate = await InterviewCandidate.findById(candidateId).populate('questions.originalId');
        if (!candidate) return NextResponse.json({ success: false, error: 'Candidat introuvable' }, { status: 404 });

        return NextResponse.json({ success: true, data: candidate }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function PUT(req) {
    try {
        await dbConnect();
        const { candidateId, answerData, nextStatus, rulesConfirmed } = await req.json();

        const updatePayload = {};
        
        if (nextStatus) {
            updatePayload.status = nextStatus;
            if (nextStatus === 'completed') {
                updatePayload.completedAt = new Date();
            }
        }
        if (rulesConfirmed !== undefined) {
            updatePayload.rulesConfirmed = rulesConfirmed;
        }

        const dbOp = { $set: updatePayload };

        if (answerData) {
            const { questionId, answer } = answerData;
            // Update the specific question's answer in the array
            dbOp.$set[`questions.$[elem].answer`] = answer;
            dbOp.$set[`questions.$[elem].answeredAt`] = new Date();
            
            const updated = await InterviewCandidate.findOneAndUpdate(
                { _id: candidateId },
                dbOp,
                { arrayFilters: [{ 'elem._id': questionId }], new: true }
            );
            return NextResponse.json({ success: true, data: updated }, { status: 200 });
        } else {
            const updated = await InterviewCandidate.findByIdAndUpdate(candidateId, dbOp, { new: true });
            return NextResponse.json({ success: true, data: updated }, { status: 200 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
