import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const authUser = await getUser();
        if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        await dbConnect();
        const user = await User.findById(authUser.userId).populate('preferredClub', 'name');

        if (!user) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const authUser = await getUser();
        if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const body = await req.json();
        const { firstName, lastName, phone, birthDate, profileImage, preferredClub } = body;

        await dbConnect();

        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (firstName || lastName) {
            updateData.name = `${firstName || ''} ${lastName || ''}`.trim();
        }
        if (phone) updateData.phone = phone;
        if (birthDate) updateData.birthDate = birthDate;
        if (profileImage) updateData.profileImage = profileImage;
        if (preferredClub) updateData.preferredClub = preferredClub;

        const updatedUser = await User.findByIdAndUpdate(
            authUser.userId,
            updateData,
            { new: true }
        );

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}
