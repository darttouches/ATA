
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Testimonial from '@/models/Testimonial';
import { getUser } from '@/lib/auth';
import User from '@/models/User';

// GET: List testimonials
export async function GET(req) {
    try {
        const currentUser = await getUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        await dbConnect();
        const { searchParams } = new URL(req.url);
        const clubId = searchParams.get('clubId');
        const approved = searchParams.get('approved');

        let query = {};

        // Role-based filtering
        if (currentUser.role === 'admin' || currentUser.role === 'national') {
            // Admin and National can see everything or filter by clubId
            if (clubId) query.club = clubId;
        } else if (currentUser.role === 'president') {
            // President can only see their club's testimonials
            const dbUser = await User.findById(currentUser.userId);
            if (!dbUser || !dbUser.club) {
                return NextResponse.json({ success: true, data: [] });
            }
            query.club = dbUser.club;
        } else {
            // Regular members/others only see approved ones
            query.approved = true;
            if (clubId) query.club = clubId;
        }

        if (approved !== null) {
            query.approved = approved === 'true';
        }

        const testimonials = await Testimonial.find(query)
            .populate('user', 'name profileImage')
            .populate('club', 'name')
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
