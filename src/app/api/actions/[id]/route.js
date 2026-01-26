
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Action from '@/models/Action';

// GET: Single action details
export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const action = await Action.findById(id)
            .populate('club')
            .populate('attendees.member', 'name firstName lastName email profileImage');

        if (!action) {
            return NextResponse.json({ success: false, error: 'Action not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: action }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// PUT: Update action (details or attendance)
export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const action = await Action.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        }).populate('attendees.member', 'name firstName lastName email');

        if (!action) {
            return NextResponse.json({ success: false, error: 'Action not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: action }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// DELETE: Remove action
export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const deletedAction = await Action.findByIdAndDelete(id);

        if (!deletedAction) {
            return NextResponse.json({ success: false, error: 'Action not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: {} }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
