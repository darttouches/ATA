import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('GET /api/admin/clubs - Starting...');

        const user = await getUser();
        console.log('User:', user ? `${user.email} (${user.role})` : 'null');

        if (!user || (user.role !== 'admin' && user.role !== 'national')) {
            console.log('Access denied - user not admin');
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        console.log('Connecting to database...');
        await dbConnect();
        console.log('Database connected');

        console.log('Fetching clubs...');
        const clubs = await Club.find({}).populate('chief', 'name email').lean();
        console.log(`Found ${clubs.length} clubs`);

        return NextResponse.json(clubs);
    } catch (error) {
        console.error('Error in GET /api/admin/clubs:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json({
            error: 'Erreur serveur',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        console.log('POST /api/admin/clubs - Starting...');

        const user = await getUser();
        console.log('User:', user ? `${user.email} (${user.role})` : 'null');

        if (!user || (user.role !== 'admin' && user.role !== 'national')) {
            console.log('Access denied - user not admin');
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const body = await req.json();
        console.log('Request body:', JSON.stringify(body, null, 2));

        const { name, description, address, slug, chief, coordinates, socialLinks, coverImage } = body;

        console.log('Connecting to database...');
        await dbConnect();
        console.log('Database connected');

        const finalSlug = slug || name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w ]+/g, '').replace(/ +/g, '-').trim();
        console.log('Final slug:', finalSlug);

        const clubData = {
            name,
            description,
            address,
            slug: finalSlug,
            chief: chief || null,
            coordinates: coordinates || { lat: 36.8065, lng: 10.1815 },
            socialLinks,
            coverImage
        };
        console.log('Creating club with data:', JSON.stringify(clubData, null, 2));

        const club = await Club.create(clubData);
        console.log('Club created successfully:', club._id);

        return NextResponse.json(club);
    } catch (error) {
        console.error('Error in POST /api/admin/clubs:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        return NextResponse.json({
            error: 'Erreur lors de la création',
            details: error.message,
            name: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        const { id, name, description, address, slug, chief, coverImage, activeMembers, socialLinks, coordinates, partnerReviews } = await req.json();
        await dbConnect();

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
            partnerReviews
        };

        const club = await Club.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json(club);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        const { id, chief } = await req.json();
        await dbConnect();
        const club = await Club.findByIdAndUpdate(id, { chief }, { new: true });
        return NextResponse.json(club);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }
}

export async function DELETE(req) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await dbConnect();
    await Club.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Club supprimé' });
}
