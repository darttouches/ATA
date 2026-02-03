import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { subscription } = await req.json();
        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Subscription data missing' }, { status: 400 });
        }

        await dbConnect();

        const userId = user.userId || user._id;

        // Upsert the subscription
        await Subscription.findOneAndUpdate(
            { user: userId, 'subscription.endpoint': subscription.endpoint },
            {
                user: userId,
                subscription,
                userAgent: req.headers.get('user-agent')
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Subscription Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
