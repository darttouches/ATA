import dbConnect from '@/lib/db';
import BoardMember from '@/models/BoardMember';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }
        await dbConnect();
        const members = await BoardMember.find({}).sort({ order: 1, createdAt: -1 });
        return NextResponse.json(members);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }
        const data = await req.json();
        await dbConnect();
        const member = await BoardMember.create(data);
        return NextResponse.json(member);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }
        const { id, ...updateData } = await req.json();
        await dbConnect();
        const member = await BoardMember.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json(member);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        await dbConnect();
        await BoardMember.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Membre supprimé' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
