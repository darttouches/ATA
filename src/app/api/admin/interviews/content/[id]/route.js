import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InterviewContent from '@/models/InterviewContent';
import { getUser } from '@/lib/auth';

export async function DELETE(req, { params }) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const content = await InterviewContent.findByIdAndDelete(params.id);
        if (!content) return NextResponse.json({ error: 'Contenu non trouvé' }, { status: 404 });
        
        return NextResponse.json({ success: true, data: {} }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
