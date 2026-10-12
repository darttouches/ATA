import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ClubRequest from '@/models/ClubRequest';
import Club from '@/models/Club';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

function escapeRegex(text) {
    return text ? text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') : '';
}

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
            const rawClubName = (request.clubName || '').trim();
            const rawEmail = (request.email || '').trim().toLowerCase();
            const rawLocation = (request.location || '').trim();

            const clubSlug = rawClubName
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-')
                .trim();

            // 1. Find existing Club (by ID, exact name, case-insensitive name regex, or slug)
            let targetClub = null;
            if (request.clubId) {
                targetClub = await Club.findById(request.clubId);
            }
            if (!targetClub && rawClubName) {
                targetClub = await Club.findOne({
                    $or: [
                        { name: rawClubName },
                        { name: { $regex: new RegExp(`^${escapeRegex(rawClubName)}$`, 'i') } },
                        { slug: clubSlug }
                    ]
                });
            }

            // 2. Create or Update Club Account (User)
            const hashedPassword = await bcrypt.hash(request.password, 10);
            let clubUser = null;

            if (rawEmail) {
                clubUser = await User.findOne({
                    email: { $regex: new RegExp(`^${escapeRegex(rawEmail)}$`, 'i') }
                });
            }

            if (!clubUser && targetClub?.clubAccountId) {
                clubUser = await User.findById(targetClub.clubAccountId);
            }

            if (clubUser) {
                clubUser.password = hashedPassword;
                clubUser.name = targetClub ? targetClub.name : rawClubName;
                if (rawEmail) clubUser.email = rawEmail;
                clubUser.role = 'club';
                clubUser.status = 'approved';
                clubUser.isActive = true;
                if (targetClub) clubUser.club = targetClub._id;
                await clubUser.save();
            } else {
                clubUser = new User({
                    name: rawClubName,
                    email: rawEmail,
                    password: hashedPassword,
                    role: 'club',
                    status: 'approved',
                    isActive: true,
                    club: targetClub ? targetClub._id : undefined,
                    season: '2025/2026'
                });
                await clubUser.save();
            }

            // 3. Prepare board activeMembers
            const boardUserIds = [
                request.president,
                request.vicePresident,
                request.secretary,
                request.hr,
                request.events,
                request.communication
            ].filter(Boolean);

            const boardDocs = await User.find({ _id: { $in: boardUserIds } });
            const userMap = {};
            boardDocs.forEach(u => {
                userMap[u._id.toString()] = `${u.firstName || u.name} ${u.lastName || ''}`.trim();
            });

            const activeMembers = [
                { name: userMap[request.president?.toString()] || '', role: "Président", month: "" },
                { name: userMap[request.vicePresident?.toString()] || '', role: "Vice-Président", month: "" },
                { name: userMap[request.secretary?.toString()] || '', role: "Secrétaire Général", month: "" },
                { name: userMap[request.hr?.toString()] || '', role: "Responsable RH", month: "" },
                { name: userMap[request.events?.toString()] || '', role: "Responsable des Événements", month: "" },
                { name: userMap[request.communication?.toString()] || '', role: "Responsable Média", month: "" }
            ].filter(m => m.name);

            // 4. Update existing club (Reactivation) OR Create new club
            const isReactivation = !!targetClub;

            if (targetClub) {
                if (rawLocation) targetClub.address = rawLocation;
                targetClub.chief = request.president;
                targetClub.clubAccountId = clubUser._id;
                if (activeMembers.length > 0) {
                    targetClub.activeMembers = activeMembers;
                }
                targetClub.isActive = true;
                targetClub.isVisible = true;
                await targetClub.save();

                if (!clubUser.club || clubUser.club.toString() !== targetClub._id.toString()) {
                    clubUser.club = targetClub._id;
                    await clubUser.save();
                }

                // Reactivate club members who were not individually deactivated by admin
                await User.updateMany(
                    {
                        $or: [{ club: targetClub._id }, { preferredClub: targetClub._id }],
                        role: { $ne: 'club' },
                        deactivatedByAdmin: { $ne: true }
                    },
                    { $set: { isActive: true } }
                );
            } else {
                targetClub = new Club({
                    name: rawClubName,
                    slug: clubSlug,
                    description: `Club d'activité situé à ${rawLocation}.`,
                    address: rawLocation,
                    chief: request.president,
                    clubAccountId: clubUser._id,
                    activeMembers: activeMembers,
                    isActive: true,
                    isVisible: true,
                    approvedEventsCount: 5,
                });
                await targetClub.save();

                clubUser.club = targetClub._id;
                await clubUser.save();
            }

            // 5. Update board members roles & link them to this club
            const roleMap = {
                [request.president?.toString()]: "Président",
                [request.vicePresident?.toString()]: "Vice-Président",
                [request.secretary?.toString()]: "Secrétaire Général",
                [request.hr?.toString()]: "Responsable RH",
                [request.events?.toString()]: "Responsable des Événements",
                [request.communication?.toString()]: "Responsable Média",
            };

            for (const u of boardDocs) {
                await User.findByIdAndUpdate(u._id, {
                    $set: {
                        club: targetClub._id,
                        preferredClub: targetClub._id,
                        clubRole: roleMap[u._id.toString()] || '',
                        isActive: true
                    }
                });
            }

            // 6. Mark request as approved
            request.status = 'approved';
            if (!request.clubId && targetClub) {
                request.clubId = targetClub._id;
            }
            await request.save();

            const message = isReactivation
                ? `Le club "${targetClub.name}" a été réactivé avec succès et son bureau a été mis à jour.`
                : `Demande approuvée et club "${targetClub.name}" créé avec succès.`;

            return NextResponse.json({
                success: true,
                message,
                isReactivation
            }, { status: 200 });
        }

        return NextResponse.json({ error: 'Action invalide.' }, { status: 400 });
    } catch (error) {
        console.error('Club request processing error:', error);
        let userMessage = error.message;
        if (error.code === 11000 || error.message?.includes('E11000')) {
            userMessage = "Un club ou un compte avec ce nom ou cet email existe déjà. Le club a été mis à jour ou vérifiez les coordonnées.";
        }
        return NextResponse.json({ error: userMessage }, { status: 500 });
    }
}
