import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import ScanEvent from '@/models/ScanEvent';
import User from '@/models/User';

export async function GET(request, { params }) {
    try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'Invalid Event ID' }, { status: 400 });
        }

        const event = await ScanEvent.findById(id);

        if (!event) {
            return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: event });
    } catch (error) {
        console.error("Dashboard Scanner GET Event API Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to fetch scan event' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        await dbConnect();

        const { id } = await params;
        const body = await request.json();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'Invalid Event ID' }, { status: 400 });
        }

        // This accepts an array of scannedUsers to directly sync the React state DB.
        const { scannedUsers } = body;

        if (!Array.isArray(scannedUsers)) {
            return NextResponse.json({ success: false, error: 'Scanned users array required' }, { status: 400 });
        }

        const previousEvent = await ScanEvent.findById(id);
        if (!previousEvent) {
            return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
        }

        const prevUserIds = new Set(previousEvent.scannedUsers.map(u => u.userId.toString()));

        for (const u of scannedUsers) {
            if (u.userId && mongoose.Types.ObjectId.isValid(u.userId) && !prevUserIds.has(u.userId.toString())) {
                // New user scanned! Give +1 point
                await User.findByIdAndUpdate(u.userId, {
                    $inc: { bonusPoints: 1 },
                    $push: {
                        scoreHistory: {
                            points: 1,
                            reason: `Présence: ${previousEvent.title} (${previousEvent.date})`,
                            addedBy: 'Système NFC',
                            date: new Date()
                        }
                    }
                });
            }
        }

        const updatedEvent = await ScanEvent.findByIdAndUpdate(
            id,
            { scannedUsers: scannedUsers },
            { new: true }
        );

        if (!updatedEvent) {
            return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedEvent });
    } catch (error) {
        console.error("Dashboard Scanner PUT Event API Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to update scan event' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'Invalid Event ID' }, { status: 400 });
        }

        const deletedEvent = await ScanEvent.findByIdAndDelete(id);

        if (!deletedEvent) {
            return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Dashboard Scanner DELETE Event API Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to delete scan event' }, { status: 500 });
    }
}
