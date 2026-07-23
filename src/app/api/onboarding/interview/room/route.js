import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InterviewCandidate from '@/models/InterviewCandidate';
import InterviewContent from '@/models/InterviewContent';

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const candidateId = searchParams.get('candidateId');

        if (!candidateId) return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 });

        let candidate = await InterviewCandidate.findById(candidateId).populate('questions.originalId');
        if (!candidate) return NextResponse.json({ success: false, error: 'Candidat introuvable' }, { status: 404 });

        // Auto-assign default questions if none assigned yet
        let updated = false;
        if (!candidate.questions || candidate.questions.length === 0) {
            const defaultQuestions = await InterviewContent.find({ type: 'question', isActive: { $ne: false }, isDefault: { $ne: false } });
            if (defaultQuestions.length > 0) {
                candidate.questions = defaultQuestions.map(q => ({
                    originalId: q._id,
                    text: q.text,
                    answer: ''
                }));
                updated = true;
            }
        }

        // Auto-assign default remarks if none assigned yet
        if (!candidate.remarks || candidate.remarks.length === 0) {
            const defaultRemarks = await InterviewContent.find({ type: 'remark', isActive: { $ne: false }, isDefault: { $ne: false } });
            if (defaultRemarks.length > 0) {
                candidate.remarks = defaultRemarks.map(r => ({
                    text: r.text
                }));
                updated = true;
            }
        }

        if (updated) {
            await candidate.save();
        }

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
