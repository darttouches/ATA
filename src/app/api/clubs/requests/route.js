import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ClubRequest from '@/models/ClubRequest';
import Club from '@/models/Club';
import User from '@/models/User';

function escapeRegex(text) {
    return text ? text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') : '';
}

export async function POST(req) {
    try {
        await dbConnect();
        const data = await req.json();

        const rawClubName = (data.clubName || '').trim();
        const rawEmail = (data.email || '').trim().toLowerCase();
        const rawLocation = (data.location || '').trim();

        data.clubName = rawClubName;
        data.email = rawEmail;
        data.location = rawLocation;

        const slug = rawClubName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-')
            .trim();

        // 1. Detect if club already exists
        let existingClub = null;
        if (data.clubId) {
            existingClub = await Club.findById(data.clubId);
        }
        if (!existingClub && rawClubName) {
            existingClub = await Club.findOne({
                $or: [
                    { name: rawClubName },
                    { name: { $regex: new RegExp(`^${escapeRegex(rawClubName)}$`, 'i') } },
                    { slug: slug }
                ]
            });
        }

        if (existingClub) {
            data.clubId = existingClub._id;
            data.isReactivation = true;
            data.clubName = existingClub.name; // Use canonical name
        }

        // 2. Check for an already pending request for this club
        const pendingQuery = [];
        if (data.clubId) {
            pendingQuery.push({ clubId: data.clubId });
        }
        if (rawClubName) {
            pendingQuery.push({ clubName: { $regex: new RegExp(`^${escapeRegex(data.clubName)}$`, 'i') } });
        }

        let existingPending = null;
        if (pendingQuery.length > 0) {
            existingPending = await ClubRequest.findOne({
                $or: pendingQuery,
                status: 'pending'
            });
        }

        if (existingPending) {
            // Update existing pending request rather than throwing or creating duplicate
            Object.assign(existingPending, data);
            await existingPending.save();
            return NextResponse.json({
                success: true,
                message: existingClub
                    ? 'Votre demande de réactivation existante a été mise à jour avec succès.'
                    : 'Votre demande en attente a été mise à jour avec succès.'
            }, { status: 200 });
        }

        const newRequest = new ClubRequest(data);
        await newRequest.save();

        const message = existingClub
            ? 'Demande de réactivation du club soumise avec succès.'
            : 'Demande de création de club soumise avec succès.';

        return NextResponse.json({ success: true, message }, { status: 201 });
    } catch (error) {
        console.error('ClubRequest Error:', error);
        return NextResponse.json({
            success: false,
            error: error.code === 11000
                ? "Une demande similaire existe déjà."
                : (error.message || 'Erreur lors de la soumission.')
        }, { status: 500 });
    }
}
