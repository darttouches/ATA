// CACHE_BUSTER_v3
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import ScanEvent from '@/models/ScanEvent';

export async function GET(request) {
    try {
        await dbConnect();
        
        // Fetch all events sorted by most recent
        const events = await ScanEvent.find().sort({ createdAt: -1 });
        
        return NextResponse.json({ success: true, data: events });
    } catch (error) {
        console.error("Dashboard Scanner GET API Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to fetch scan events' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        
        const body = await request.json();
        const { title, date, time, location, authorizedScanners } = body;
        
        if (!title || !date || !time) {
            return NextResponse.json({ success: false, error: 'Title, Date, and Time are required' }, { status: 400 });
        }
        
        const newEvent = new ScanEvent({
            title,
            date,
            time,
            location: location || '',
            authorizedScanners: authorizedScanners || [],
            scannedUsers: []
        });
        
        const savedEvent = await newEvent.save();
        
        return NextResponse.json({ success: true, data: savedEvent }, { status: 201 });
    } catch (error) {
        console.error("Dashboard Scanner POST API Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to create scan event' }, { status: 500 });
    }
}
