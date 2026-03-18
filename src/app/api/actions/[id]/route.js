
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

        const action = await Action.findById(id);
        if (!action) {
            return NextResponse.json({ success: false, error: 'Action not found' }, { status: 404 });
        }

        // Handle points awarding if attendees list is updated
        if (body.attendees && Array.isArray(body.attendees)) {
            const User = (await import('@/models/User')).default;
            const oldAttendeesMap = {};
            action.attendees.forEach(a => {
                const mid = a.member?._id?.toString() || a.member?.toString();
                if (mid) oldAttendeesMap[mid] = a.present;
            });

            for (const newAtt of body.attendees) {
                const mid = newAtt.member?._id?.toString() || newAtt.member?.toString();
                if (!mid) continue;

                const wasPresent = oldAttendeesMap[mid] || false;
                const isPresentNow = newAtt.present || false;

                if (!wasPresent && isPresentNow) {
                    // +1 to score
                    await User.findByIdAndUpdate(mid, { $inc: { bonusPoints: 1 } });
                } else if (wasPresent && !isPresentNow) {
                    // -1 to score
                    await User.findByIdAndUpdate(mid, { $inc: { bonusPoints: -1 } });
                }
            }
        }

        // Use Object.assign to update only provided fields
        Object.assign(action, body);
        await action.save();
        await action.populate('attendees.member', 'name firstName lastName email');

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
