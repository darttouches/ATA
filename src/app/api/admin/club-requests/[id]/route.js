import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ClubRequest from '@/models/ClubRequest';
import Club from '@/models/Club';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const { action } = await req.json(); // 'approve' or 'reject'

        const request = await ClubRequest.findById(id);
        if (!request) {
            return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 });
        }

        if (action === 'reject') {
            request.status = 'rejected';
            await request.save();
            return NextResponse.json({ success: true, message: 'Demande refusée.' }, { status: 200 });
        }

        if (action === 'approve') {
            request.status = 'approved';
            await request.save();

            // 1. Create Club Account (User)
            const hashedPassword = await bcrypt.hash(request.password, 10);
            const clubUser = new User({
                name: request.clubName,
                email: request.email,
                password: hashedPassword,
                role: 'club',
                isActive: true
            });
            await clubUser.save();

            // 2. Create the Club
            // Prepare activeMembers array based on board members passed in request
            // Note: In a real system, you'd fetch the user names before adding. We'll add IDs or fetch names.
            // For now, we store their IDs or let the club update it. We will fetch their names.
            const boardDocs = await User.find({
                _id: { $in: [request.president, request.vicePresident, request.secretary, request.hr, request.events, request.communication]}
            });

            const userMap = {};
            boardDocs.forEach(u => userMap[u._id.toString()] = `${u.firstName || u.name} ${u.lastName || ''}`);

            const activeMembers = [
                { name: userMap[request.president.toString()], role: "Président", month: "" },
                { name: userMap[request.vicePresident.toString()], role: "Vice-Président", month: "" },
                { name: userMap[request.secretary.toString()], role: "Secrétaire Général", month: "" },
                { name: userMap[request.hr.toString()], role: "Responsable RH", month: "" },
                { name: userMap[request.events.toString()], role: "Responsable des Événements", month: "" },
                { name: userMap[request.communication.toString()], role: "Responsable Média", month: "" }
            ];

            const newClub = new Club({
                name: request.clubName,
                description: `Club d'activité situé à ${request.location}.`,
                address: request.location,
                chief: request.president,
                clubAccountId: clubUser._id,
                activeMembers: activeMembers,
                isActive: true,
                approvedEventsCount: 5, // 5 points de score offerts à la création
            });
            await newClub.save();

            // 3. Update all board members to point to this club and set their clubRole
            const roleMap = {
                [request.president.toString()]: "Président",
                [request.vicePresident.toString()]: "Vice-Président",
                [request.secretary.toString()]: "Secrétaire Général",
                [request.hr.toString()]: "Responsable RH",
                [request.events.toString()]: "Responsable des Événements",
                [request.communication.toString()]: "Responsable Média",
            };

            for (const u of boardDocs) {
                await User.findByIdAndUpdate(u._id, {
                    $set: {
                        club: newClub._id,
                        preferredClub: newClub._id,
                        clubRole: roleMap[u._id.toString()] || ''
                    }
                });
            }

            return NextResponse.json({ success: true, message: 'Demande approuvée et club créé.' }, { status: 200 });
        }

        return NextResponse.json({ error: 'Action invalide.' }, { status: 400 });
    } catch (error) {
        console.error('Club request processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
