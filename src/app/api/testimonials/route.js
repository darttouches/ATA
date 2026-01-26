
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Testimonial from '@/models/Testimonial';

// GET: List testimonials
export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const clubId = searchParams.get('clubId');
        const approved = searchParams.get('approved');

        let query = {};
        if (clubId) query.club = clubId;
        if (approved) query.approved = approved === 'true';

        const testimonials = await Testimonial.find(query)
            .populate('user', 'name profileImage') // If user exists
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: testimonials }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// POST: Add new testimonial
export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();

        const testimonial = await Testimonial.create(body);

        return NextResponse.json({ success: true, data: testimonial }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
