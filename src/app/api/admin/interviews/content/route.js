import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InterviewContent from '@/models/InterviewContent';
import { getUser } from '@/lib/auth';

export async function GET(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const content = await InterviewContent.find({}).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: content }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const body = await req.json();
        
        const content = await InterviewContent.create(body);
        return NextResponse.json({ success: true, data: content }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
