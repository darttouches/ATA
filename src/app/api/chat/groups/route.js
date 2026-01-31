import dbConnect from '@/lib/db';
import ChatGroup from '@/models/ChatGroup';
import User from '@/models/User';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Get groups for current user
export async function GET() {
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        await dbConnect();

        const groups = await ChatGroup.find({
            members: currentUser.userId
        }).populate('members', 'name role profileImage');

        // Enhance groups with last message info (similar to users route)
        const ChatMessage = (await import('@/models/ChatMessage')).default;

        const enhancedGroups = await Promise.all(groups.map(async (group) => {
            const lastMessage = await ChatMessage.findOne({
                group: group._id
            }).sort({ createdAt: -1 }).select('createdAt');

            const unreadCount = await ChatMessage.countDocuments({
                group: group._id,
                readBy: { $ne: currentUser.userId },
                sender: { $ne: currentUser.userId }
            });

            return {
                ...group.toObject(),
                unreadCount,
                lastMessageAt: lastMessage ? lastMessage.createdAt : group.createdAt,
                isGroup: true
            };
        }));

        return NextResponse.json(enhancedGroups);
    } catch (error) {
        console.error('Chat Groups GET Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// Create a group (only for admin/president)
export async function POST(req) {
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        await dbConnect();

        // Fetch current user from DB to check role
        const user = await User.findById(currentUser.userId);
        if (!user || (user.role !== 'admin' && user.role !== 'president')) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const { name, description, members, image } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Le nom du groupe est requis' }, { status: 400 });
        }

        // Ensure current user is in members and admins
        const groupMembers = Array.from(new Set([...(members || []), currentUser.userId]));

        const group = await ChatGroup.create({
            name,
            description,
            members: groupMembers,
            createdBy: currentUser.userId,
            admins: [currentUser.userId],
            image
        });

        return NextResponse.json(group);
    } catch (error) {
        console.error('Chat Groups POST Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
