import dbConnect from '@/lib/db';
import ChatGroup from '@/models/ChatGroup';
import User from '@/models/User';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { id } = await params;
        const { name, members } = await req.json();

        await dbConnect();

        const group = await ChatGroup.findById(id);
        if (!group) {
            console.log('Group not found:', id);
            return NextResponse.json({ error: 'Groupe non trouvé' }, { status: 404 });
        }

        // Check if user is authorized (admin of group or global admin/president)
        const user = await User.findById(currentUser.userId);
        const isGroupAdmin = group.admins && group.admins.some(adminId => adminId.toString() === currentUser.userId);
        const isGlobalAdmin = user && (user.role === 'admin' || user.role === 'president');

        if (!isGroupAdmin && !isGlobalAdmin) {
            console.log('Unauthorized edit attempt by:', currentUser.userId, 'on group:', id);
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        if (name) group.name = name;
        if (members) {
            // Ensure creator/admins are always in members? 
            // Or just trust the frontend and ensure current user doesn't remove themselves if they are admin?
            // Let's just update members but ensure they are unique
            group.members = Array.from(new Set([...members]));
        }

        group.updatedAt = Date.now();
        await group.save();

        const updatedGroup = await ChatGroup.findById(id).populate('members', 'name role profileImage');

        // Enhance updated group (same logic as GET)
        const ChatMessage = (await import('@/models/ChatMessage')).default;
        const lastMessage = await ChatMessage.findOne({
            group: updatedGroup._id
        }).sort({ createdAt: -1 }).select('createdAt');

        const unreadCount = await ChatMessage.countDocuments({
            group: updatedGroup._id,
            readBy: { $ne: currentUser.userId },
            sender: { $ne: currentUser.userId }
        });

        const enhancedGroup = {
            ...updatedGroup.toObject(),
            unreadCount,
            lastMessageAt: lastMessage ? lastMessage.createdAt : updatedGroup.createdAt,
            isGroup: true
        };

        return NextResponse.json(enhancedGroup);
    } catch (error) {
        console.error('Chat Group PATCH Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const currentUser = await getUser();
        if (!currentUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { id } = await params;

        await dbConnect();

        const group = await ChatGroup.findById(id);
        if (!group) {
            return NextResponse.json({ error: 'Groupe non trouvé' }, { status: 404 });
        }

        const user = await User.findById(currentUser.userId);
        const isGroupAdmin = group.admins.some(adminId => adminId.toString() === currentUser.userId);
        const isGlobalAdmin = user && (user.role === 'admin' || user.role === 'president');

        if (!isGroupAdmin && !isGlobalAdmin) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        await ChatGroup.findByIdAndDelete(id);

        // Also delete messages associated with the group?
        const ChatMessage = (await import('@/models/ChatMessage')).default;
        await ChatMessage.deleteMany({ group: id });

        return NextResponse.json({ message: 'Groupe supprimé' });
    } catch (error) {
        console.error('Chat Group DELETE Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
