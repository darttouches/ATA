import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper to get the current session user
async function getSessionUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return null;
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

// GET: list all members of a given club with their current clubRole
export async function GET(req) {
    try {
        await dbConnect();
        const session = await getSessionUser();
        if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const clubId = searchParams.get('clubId');

        if (!clubId) return NextResponse.json({ error: 'clubId requis' }, { status: 400 });

        // Only admin or club role can access
        if (session.role !== 'admin' && session.role !== 'club') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        // Club accounts can only access their own club
        if (session.role === 'club') {
            const clubUser = await User.findById(session.id).populate('club');
            if (!clubUser?.club || clubUser.club._id.toString() !== clubId) {
                return NextResponse.json({ error: 'Vous ne pouvez gérer que votre propre club' }, { status: 403 });
            }
        }

        const members = await User.find({
            $or: [{ club: clubId }, { preferredClub: clubId }],
            isActive: true
        }).select('name firstName lastName profileImage memberNumber clubRole officialRole club preferredClub');

        return NextResponse.json({ success: true, members }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PUT: update a member's clubRole
export async function PUT(req) {
    try {
        await dbConnect();
        const session = await getSessionUser();
        if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        if (session.role !== 'admin' && session.role !== 'club') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const { memberId, clubRole, clubId } = await req.json();

        // Club account can only assign roles for members of their own club
        if (session.role === 'club') {
            const clubUser = await User.findById(session.id).populate('club');
            if (!clubUser?.club || clubUser.club._id.toString() !== clubId) {
                return NextResponse.json({ error: 'Vous ne pouvez gérer que votre propre club' }, { status: 403 });
            }
        }

        await User.findByIdAndUpdate(memberId, { $set: { clubRole: clubRole || '' } });

        return NextResponse.json({ success: true, message: 'Poste mis à jour.' }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
