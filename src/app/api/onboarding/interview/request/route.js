import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InterviewCandidate from '@/models/InterviewCandidate';

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

        let code;
        let isUnique = false;
        while (!isUnique) {
            code = generateCode();
            const exists = await InterviewCandidate.findOne({ code });
            if (!exists) isUnique = true;
        }

        const candidate = await InterviewCandidate.create({
            code,
            firstName,
            lastName,
            email,
            phone,
            interviewDate
        });

        return NextResponse.json({ success: true, code: candidate.code }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
