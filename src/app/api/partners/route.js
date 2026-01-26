import dbConnect from '@/lib/db';
import Partner from '@/models/Partner';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await dbConnect();
        const partners = await Partner.find({ active: true }).sort({ order: 1, createdAt: -1 });
        return NextResponse.json(partners);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
