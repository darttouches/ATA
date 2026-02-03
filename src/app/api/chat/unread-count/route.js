import dbConnect from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import ChatGroup from '@/models/ChatGroup';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ count: 0 });

        await dbConnect();

        const userId = currentUser.userId || currentUser._id;

        // 1. Direct Messages unread count
        const directUnreadCount = await ChatMessage.countDocuments({
            recipient: userId,
            isRead: false,
            isDeleted: false
        });

        // 2. Group Messages unread count
        // First find all groups the user is a member of
        const userGroups = await ChatGroup.find({ members: userId }).select('_id');
        const groupIds = userGroups.map(g => g._id);

        const groupUnreadCount = await ChatMessage.countDocuments({
            group: { $in: groupIds },
            sender: { $ne: userId },
            readBy: { $ne: userId },
            isDeleted: false
        });

        return NextResponse.json({
            count: directUnreadCount + groupUnreadCount,
            direct: directUnreadCount,
            groups: groupUnreadCount
        });
    } catch (error) {
        console.error('Unread Count Error:', error);
        return NextResponse.json({ count: 0 });
    }
}
