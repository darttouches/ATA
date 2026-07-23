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
        // Ensure legacy existing users without season property get updated to '2025/2026'
        await User.updateMany(
            { $or: [{ season: { $exists: false } }, { season: null }] },
            { $set: { season: '2025/2026' } }
        );

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

        const { id, role, club, status, isPaid, memberNumber, phone, password, officialRole, season, isActive } = await req.json();

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
        if (officialRole !== undefined) updateData.officialRole = officialRole;
        if (season) updateData.season = season;
        if (isActive !== undefined) updateData.isActive = isActive;
        
        if (password) {
            const bcrypt = require('bcryptjs');
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('club', 'name').populate('preferredClub', 'name');

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Update error:', error);
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
