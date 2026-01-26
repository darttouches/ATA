
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Testimonial from '@/models/Testimonial';

// PUT: Approve or Edit
export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

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
        await dbConnect();
        const { id } = await params;
        await Testimonial.findByIdAndDelete(id);
        return NextResponse.json({ success: true, data: {} }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
