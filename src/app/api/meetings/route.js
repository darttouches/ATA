import dbConnect from '@/lib/db';
import Meeting from '@/models/Meeting';
import Settings from '@/models/Settings';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        await dbConnect();
        
        // Need user club which is not in token
        const fullUser = await User.findById(user.userId).select('club');

        // Find meetings where user is participant, or creator, or for their club
        const meetings = await Meeting.find({
            $or: [
                { creator: user.userId },
                { participants: user.userId },
                { clubs: fullUser?.club }
            ]
        })
        .populate('creator', 'name firstName lastName')
        .sort({ scheduledAt: -1 });

        return NextResponse.json(meetings);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        await dbConnect();

        // Check if user is authorized in settings
        const settings = await Settings.findOne({ key: 'meeting_ta' });
        const m = settings?.value;
        const isAuthorized = user.role === 'admin' || 
            (m?.isPublished && (m?.authorizedRoles?.includes(user.role) || m?.authorizedUsers?.includes(user.userId) || m?.authorizedUsers?.includes(user.userId.toString())));

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const { title, description, scheduledAt, lateLimitMinutes, participants, clubs, type } = await req.json();

        // Generate a unique room name
        const roomName = `ATA_Meet_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const meeting = await Meeting.create({
            title,
            description,
            creator: user.userId,
            scheduledAt,
            lateLimitMinutes,
            roomName,
            type,
            participants: participants || [],
            clubs: clubs || [],
            status: 'upcoming'
        });

        // Send notifications
        let targetUserIds = new Set(participants || []);
        
        if (clubs && clubs.length > 0) {
            const clubMembers = await User.find({ club: { $in: clubs } }, '_id');
            clubMembers.forEach(m => targetUserIds.add(m._id.toString()));
        }

        // Create notifications for each user
        const notificationPromises = Array.from(targetUserIds).map(userId => {
            if (userId === user.userId.toString()) return null; // Don't notify creator
            return Notification.create({
                recipient: userId,
                title: 'Nouvelle Réunion TA',
                message: `Vous êtes invité à la réunion : ${title}`,
                link: `/dashboard/meetings`, // Hub will show the "Join" button
                type: 'meeting'
            });
        }).filter(p => p !== null);

        await Promise.all(notificationPromises);

        return NextResponse.json(meeting);
    } catch (error) {
        console.error('Meeting creation error:', error);
        return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }
}
