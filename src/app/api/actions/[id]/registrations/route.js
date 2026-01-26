import dbConnect from '@/lib/db';
import Registration from '@/models/Registration';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const registrations = await Registration.find({ action: id })
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: registrations });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
