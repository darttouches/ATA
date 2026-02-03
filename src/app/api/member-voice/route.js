import dbConnect from '@/lib/db';
import MemberVoice from '@/models/MemberVoice';
import Notification from '@/models/Notification';
import User from '@/models/User';
import Club from '@/models/Club';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Vous devez être connecté' }, { status: 401 });
        }

        const { message, isAnonymous, name, email, phone } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Le message est obligatoire' }, { status: 400 });
        }

        await dbConnect();

        // Defensive ID extraction
        const getValidId = (val) => {
            if (!val) return null;
            const id = val._id || val;
            return (typeof id === 'string' && id.length === 24) ? id : null;
        };

        const userId = getValidId(user.userId) || getValidId(user.id) || getValidId(user._id);

        if (!userId) {
            return NextResponse.json({ error: 'ID utilisateur manquant dans le token' }, { status: 400 });
        }

        // Fetch full user from DB to get club info (JWT only has userId/role/name)
        const dbUser = await User.findById(userId).populate('club').populate('preferredClub');
        if (!dbUser) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        console.log('DEBUG MemberVoice - User found:', {
            id: dbUser._id,
            name: dbUser.name,
            club: dbUser.club?._id || dbUser.club,
            preferredClub: dbUser.preferredClub?._id || dbUser.preferredClub
        });

        const userClubId = getValidId(dbUser.club?._id || dbUser.club) || getValidId(dbUser.preferredClub?._id || dbUser.preferredClub);

        const voiceData = {
            message,
            isAnonymous: !!isAnonymous,
            user: userId,
            club: userClubId,
            status: 'nouveau'
        };

        if (!isAnonymous) {
            voiceData.name = name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name;
            voiceData.email = email || user.email;
            voiceData.phone = phone || user.phone;
        }

        const newVoice = await MemberVoice.create(voiceData);

        // --- Notifications ---
        try {
            const notifications = [];

            // 1. Notify Admins and National Board
            const admins = await User.find({ role: { $in: ['admin', 'national'] } });
            admins.forEach(admin => {
                notifications.push({
                    recipient: admin._id,
                    sender: userId,
                    type: 'new_voice',
                    title: 'Nouveau message Voix des Membres',
                    message: isAnonymous ? 'Un membre a envoyé un message anonyme.' : `${voiceData.name} a envoyé un message.`,
                    link: '/dashboard/voice-management'
                });
            });

            // 2. Notify Club President (if applicable)
            if (userClubId) {
                const president = await User.findOne({ role: 'president', club: userClubId });
                if (president && president._id.toString() !== userId.toString()) {
                    notifications.push({
                        recipient: president._id,
                        sender: userId,
                        type: 'new_voice',
                        title: 'Nouveau message Voix des Membres (Club)',
                        message: isAnonymous ? 'Un membre de votre club a envoyé un message anonyme.' : `${voiceData.name} a envoyé un message.`,
                        link: '/dashboard/voice-management'
                    });
                }
            }

            if (notifications.length > 0) {
                console.log(`Sending ${notifications.length} notifications for new voice message`);
                await Notification.insertMany(notifications);
            }
        } catch (notifError) {
            console.error('Notification Error (MemberVoice):', notifError);
        }

        return NextResponse.json(newVoice, { status: 201 });
    } catch (error) {
        console.error('MemberVoice POST Error:', error);
        return NextResponse.json({
            error: 'Erreur lors de l\'envoi',
            details: error.message
        }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 401 });
        }

        await dbConnect();

        let query = {};
        if (user.role === 'admin' || user.role === 'national') {
            query = {};
        } else if (user.role === 'president') {
            if (!user.club) return NextResponse.json([]);
            query = { club: user.club };
        } else {
            query = { user: user._id };
        }

        const voices = await MemberVoice.find(query)
            .populate('club', 'name')
            .populate({
                path: 'user',
                select: 'firstName lastName name club preferredClub',
                populate: [
                    { path: 'club', select: 'name' },
                    { path: 'preferredClub', select: 'name' }
                ]
            })
            .sort({ createdAt: -1 });

        return NextResponse.json(voices);
    } catch (error) {
        console.error('MemberVoice GET Error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
