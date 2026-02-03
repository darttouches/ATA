import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        await dbConnect();
        const users = await User.find({}, '-password')
            .populate('club', 'name')
            .populate('preferredClub', 'name')
            .sort({ createdAt: -1 });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const { id, role, club, status, isPaid, memberNumber, phone } = await req.json();

        // Security: National members cannot change roles
        if (user.role === 'national' && role) {
            return NextResponse.json({ error: 'Vous n\'avez pas l\'autorisation de modifier les rôles' }, { status: 403 });
        }

        await dbConnect();

        const updateData = {};
        if (role) updateData.role = role;
        if (club !== undefined) updateData.club = club || null;
        if (status) updateData.status = status;
        if (isPaid !== undefined) updateData.isPaid = isPaid;
        if (memberNumber !== undefined) updateData.memberNumber = memberNumber;
        if (phone !== undefined) updateData.phone = phone;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('club', 'name').populate('preferredClub', 'name');

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        await dbConnect();
        await User.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Utilisateur supprimé' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
