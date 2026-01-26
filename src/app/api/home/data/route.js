import dbConnect from '@/lib/db';
import Content from '@/models/Content';
import Club from '@/models/Club';
import Partner from '@/models/Partner';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await dbConnect();

        const featured = await Content.find({ onHome: true })
            .populate('club', 'name slug')
            .sort({ createdAt: -1 })
            .limit(6)
            .lean();

        const clubs = await Club.find({}).lean();

        const partners = await Partner.find({ active: true })
            .sort({ order: 1 })
            .lean();

        const now = new Date();
        const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const tenDaysStr = tenDaysFromNow.toISOString().split('T')[0];
        const oneDayAgoStr = oneDayAgo.toISOString().split('T')[0];

        const upcomingNews = await Content.find({
            status: 'approved',
            type: { $in: ['event', 'formation', 'news'] },
            date: { $gte: oneDayAgoStr, $lte: tenDaysStr }
        })
            .populate('club', 'name slug')
            .sort({ date: 1 })
            .limit(4)
            .lean();

        return NextResponse.json({
            featured,
            clubs,
            partners,
            upcomingNews
        });
    } catch (error) {
        console.error('Home Data Error:', error);
        return NextResponse.json({ error: 'Failed to fetch home data' }, { status: 500 });
    }
}
