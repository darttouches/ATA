import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        await dbConnect();

        // Update current user's lastActive
        await User.findByIdAndUpdate(currentUser.userId, { lastActive: new Date() });

        // Fetch all approved users except the current one
        let users = await User.find({
            _id: { $ne: currentUser.userId },
            $or: [
                { status: 'approved' },
                { role: 'admin' }
            ]
        })
            .select('name role profileImage lastActive club preferredClub') // Removed email
            .populate('club', 'name')
            .populate('preferredClub', 'name')
            .lean();

        // Enhance users with unread count and last message timestamp
        const ChatMessage = (await import('@/models/ChatMessage')).default;

        users = await Promise.all(users.map(async (user) => {
            const unreadCount = await ChatMessage.countDocuments({
                sender: user._id,
                recipient: currentUser.userId,
                isRead: false
            });

            const lastMessage = await ChatMessage.findOne({
                $or: [
                    { sender: currentUser.userId, recipient: user._id },
                    { sender: user._id, recipient: currentUser.userId }
                ]
            }).sort({ createdAt: -1 }).select('createdAt');

            return {
                ...user,
                unreadCount,
                lastMessageAt: lastMessage ? lastMessage.createdAt : new Date(0) // Default to epoch if no message
            };
        }));

        // Sort users: Most recent message first
        users.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

        return NextResponse.json(users);
    } catch (error) {
        console.error('Chat Users Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
