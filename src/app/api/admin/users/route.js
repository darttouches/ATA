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

        const { id, role, club, status, isPaid, memberNumber, phone, password, officialRole, season, isActive, addScore } = await req.json();

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
        if (isActive !== undefined) {
            updateData.isActive = isActive;
            updateData.deactivatedByAdmin = (isActive === false);
        }
        
        if (password) {
            const bcrypt = require('bcryptjs');
            updateData.password = await bcrypt.hash(password, 10);
        }

        if (addScore) {
            const pointsToAdd = parseInt(addScore, 10);
            if (!isNaN(pointsToAdd)) {
                const targetUser = await User.findById(id);
                if (targetUser) {
                    const newScore = (targetUser.bonusPoints || 0) + pointsToAdd;
                    updateData.bonusPoints = newScore;
                    
                    if (newScore === 0) {
                        updateData.isActive = false;
                    }
                    
                    const reason = pointsToAdd > 0 
                        ? `Avoir plus ${pointsToAdd} par bureau national`
                        : `Avoir pénalité ${pointsToAdd} par ${user.role === 'president' ? 'président de club' : 'admin'}`;
                    
                    updateData.$push = {
                        scoreHistory: {
                            points: pointsToAdd,
                            reason: reason,
                            addedBy: user.name || user.email,
                            date: new Date()
                        }
                    };
                }
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('club', 'name').populate('preferredClub', 'name');

        // Check if all members of the club have score = 0 or are inactive
        const userClubId = updatedUser?.club?._id || updatedUser?.preferredClub?._id;
        if (userClubId) {
            const Club = (await import('@/models/Club')).default;
            const clubMembers = await User.find({
                $or: [{ club: userClubId }, { preferredClub: userClubId }],
                role: { $ne: 'club' },
                status: 'approved'
            });

            if (clubMembers.length > 0) {
                const activeMembersCount = clubMembers.filter(m => (m.bonusPoints || 0) > 0).length;
                if (activeMembersCount === 0) {
                    // Trigger club deactivation and deactivate members
                    await Club.findByIdAndUpdate(userClubId, { isActive: false });
                    await User.updateMany(
                        { $or: [{ club: userClubId }, { preferredClub: userClubId }], role: { $ne: 'club' } },
                        { $set: { isActive: false } }
                    );
                }
            }
        }

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
