import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ClubRequest from '@/models/ClubRequest';
import User from '@/models/User';

export async function GET(req) {
    try {
        await dbConnect();
        const requests = await ClubRequest.find({ status: 'pending' })
            .populate('president', 'name firstName lastName email')
            .populate('vicePresident', 'name firstName lastName email')
            .populate('secretary', 'name firstName lastName email')
            .populate('hr', 'name firstName lastName email')
            .populate('events', 'name firstName lastName email')
            .populate('communication', 'name firstName lastName email')
            .sort({ createdAt: -1 });
        return NextResponse.json(requests, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
