import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Rule from '@/models/Rule';

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const limitStr = searchParams.get('limit');
        
        if (limitStr) {
            // Get random rules
            const limit = parseInt(limitStr);
            const rules = await Rule.aggregate([
                { $match: { isActive: true } },
                { $sample: { size: limit } }
            ]);
            return NextResponse.json({ success: true, data: rules }, { status: 200 });
        }
        
        const rules = await Rule.find({ isActive: true });
        return NextResponse.json({ success: true, data: rules }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        
        // This is a naive array insert check to allow seeding
        if (Array.isArray(body)) {
             const rules = await Rule.insertMany(body);
             return NextResponse.json({ success: true, data: rules }, { status: 201 });
        }
        
        const rule = await Rule.create(body);
        return NextResponse.json({ success: true, data: rule }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
