import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import User from '@/models/User';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

async function syncClubAccount(club, email, password) {
    if (!email) return club.clubAccountId || null;

    if (club.clubAccountId) {
        const clubUser = await User.findById(club.clubAccountId);
        if (clubUser) {
            clubUser.email = email;
            if (password && password.trim() !== '') {
                clubUser.password = await bcrypt.hash(password, 10);
            }
            clubUser.name = club.name;
            clubUser.role = 'club';
            clubUser.status = 'approved';
            clubUser.club = club._id;
            await clubUser.save();
            return clubUser._id;
        }
    }

    let existingUser = await User.findOne({ email });
    if (existingUser) {
        existingUser.role = 'club';
        existingUser.status = 'approved';
        existingUser.club = club._id;
        if (password && password.trim() !== '') {
            existingUser.password = await bcrypt.hash(password, 10);
        }
        await existingUser.save();
        return existingUser._id;
    } else {
        const hashedPassword = await bcrypt.hash(password || 'ClubATA2026!', 10);
        const newUser = await User.create({
            name: club.name,
            email: email,
            password: hashedPassword,
            role: 'club',
            status: 'approved',
            isActive: true,
            club: club._id,
            season: '2025/2026'
        });
        return newUser._id;
    }
}

async function syncClubMembersActiveStatus(clubId, isActive) {
    if (isActive === false) {
        await User.updateMany(
            { $or: [{ club: clubId }, { preferredClub: clubId }], role: { $ne: 'club' } },
            { $set: { isActive: false } }
        );
    } else if (isActive === true) {
        await User.updateMany(
            { $or: [{ club: clubId }, { preferredClub: clubId }], role: { $ne: 'club' }, deactivatedByAdmin: { $ne: true } },
            { $set: { isActive: true } }
        );
    }
}

export async function GET() {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        await dbConnect();
        const clubs = await Club.find({})
            .populate('chief', 'name email')
            .populate('clubAccountId', 'name email')
            .lean();

        return NextResponse.json(clubs);
    } catch (error) {
        console.error('Error in GET /api/admin/clubs:', error);
        return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const body = await req.json();
        const { name, description, address, slug, chief, coordinates, socialLinks, coverImage, clubEmail, clubPassword, isActive } = body;

        await dbConnect();

        const finalSlug = slug || name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w ]+/g, '').replace(/ +/g, '-').trim();

        const clubData = {
            name,
            description,
            address,
            slug: finalSlug,
            chief: chief || null,
            coordinates: coordinates || { lat: 36.8065, lng: 10.1815 },
            socialLinks,
            coverImage,
            isActive: isActive !== undefined ? isActive : true
        };

        const club = await Club.create(clubData);

        if (clubEmail) {
            const accountId = await syncClubAccount(club, clubEmail, clubPassword);
            if (accountId) {
                club.clubAccountId = accountId;
                await club.save();
            }
        }

        return NextResponse.json(club);
    } catch (error) {
        console.error('Error in POST /api/admin/clubs:', error);
        return NextResponse.json({ error: 'Erreur lors de la création', details: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { id, name, description, address, slug, chief, coverImage, activeMembers, socialLinks, coordinates, partnerReviews, clubEmail, clubPassword, isActive } = await req.json();
        await dbConnect();

        const existingClub = await Club.findById(id);
        if (!existingClub) return NextResponse.json({ error: 'Club non trouvé' }, { status: 404 });

        const finalSlug = slug || name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w ]+/g, '').replace(/ +/g, '-').trim();
        
        const updateData = {
            name,
            description,
            address,
            slug: finalSlug,
            chief: chief || null,
            coverImage,
            activeMembers,
            socialLinks,
            coordinates,
            partnerReviews,
        };

        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }

        const club = await Club.findByIdAndUpdate(id, updateData, { new: true });

        if (clubEmail) {
            const accountId = await syncClubAccount(club, clubEmail, clubPassword);
            if (accountId && !club.clubAccountId) {
                club.clubAccountId = accountId;
                await club.save();
            }
        }

        if (isActive !== undefined && isActive !== existingClub.isActive) {
            await syncClubMembersActiveStatus(id, isActive);
        }

        return NextResponse.json(club);
    } catch (error) {
        console.error('Error in PUT /api/admin/clubs:', error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { id, chief, isActive, clubEmail, clubPassword } = await req.json();
        await dbConnect();

        const club = await Club.findById(id);
        if (!club) return NextResponse.json({ error: 'Club non trouvé' }, { status: 404 });

        if (chief !== undefined) club.chief = chief || null;
        if (isActive !== undefined && isActive !== club.isActive) {
            club.isActive = isActive;
            await syncClubMembersActiveStatus(id, isActive);
        }

        if (clubEmail) {
            const accountId = await syncClubAccount(club, clubEmail, clubPassword);
            if (accountId) club.clubAccountId = accountId;
        }

        await club.save();
        return NextResponse.json(club);
    } catch (error) {
        console.error('Error in PATCH /api/admin/clubs:', error);
        return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        await dbConnect();

        const club = await Club.findById(id);
        if (club && club.clubAccountId) {
            await User.findByIdAndDelete(club.clubAccountId);
        }

        await Club.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Club supprimé' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
