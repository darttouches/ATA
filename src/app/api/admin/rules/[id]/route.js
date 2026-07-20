import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Rule from '@/models/Rule';
import { getUser } from '@/lib/auth';

export async function PUT(req, { params }) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const body = await req.json();
        
        const rule = await Rule.findByIdAndUpdate(params.id, body, { new: true });
        if (!rule) return NextResponse.json({ error: 'Règle non trouvée' }, { status: 404 });
        
        return NextResponse.json({ success: true, data: rule }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const rule = await Rule.findByIdAndDelete(params.id);
        if (!rule) return NextResponse.json({ error: 'Règle non trouvée' }, { status: 404 });
        
        return NextResponse.json({ success: true, data: {} }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
