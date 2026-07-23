import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InterviewContent from '@/models/InterviewContent';
import { getUser } from '@/lib/auth';

export async function PUT(req, { params }) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const resolvedParams = await params;
        const id = resolvedParams?.id || params?.id;

        const body = await req.json();
        const content = await InterviewContent.findByIdAndUpdate(id, body, { new: true });
        if (!content) return NextResponse.json({ error: 'Contenu non trouvé' }, { status: 404 });
        
        return NextResponse.json({ success: true, data: content }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const resolvedParams = await params;
        const id = resolvedParams?.id || params?.id;

        const content = await InterviewContent.findByIdAndDelete(id);
        if (!content) return NextResponse.json({ error: 'Contenu non trouvé' }, { status: 404 });
        
        return NextResponse.json({ success: true, message: 'Supprimé avec succès' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
