
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Testimonial from '@/models/Testimonial';
import { getUser } from '@/lib/auth';
import User from '@/models/User';

// PUT: Approve or Edit
export async function PUT(req, { params }) {
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // Security check
        if (currentUser.role !== 'admin' && currentUser.role !== 'national') {
            if (currentUser.role === 'president') {
                const dbUser = await User.findById(currentUser.userId);
                const testimonial = await Testimonial.findById(id);
                if (!dbUser || !testimonial || dbUser.club?.toString() !== testimonial.club?.toString()) {
                    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
                }
            } else {
                return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
            }
        }

        const testimonial = await Testimonial.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!testimonial) {
            return NextResponse.json({ success: false, error: 'Testimonial not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: testimonial }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// DELETE
export async function DELETE(req, { params }) {
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        await dbConnect();
        const { id } = await params;

        // Security check
        if (currentUser.role !== 'admin' && currentUser.role !== 'national') {
            if (currentUser.role === 'president') {
                const dbUser = await User.findById(currentUser.userId);
                const testimonial = await Testimonial.findById(id);
                if (!dbUser || !testimonial || dbUser.club?.toString() !== testimonial.club?.toString()) {
                    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
                }
            } else {
                return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
            }
        }

        await Testimonial.findByIdAndDelete(id);
        return NextResponse.json({ success: true, data: {} }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
