
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Action from '@/models/Action';
import User from '@/models/User';
import Club from '@/models/Club';
import Content from '@/models/Content';

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const clubId = searchParams.get('clubId');

        let matchStage = {};
        if (clubId) {
            matchStage.club = clubId; // Assuming we filter by club
            // Note: In a real app, we need to convert string ID to ObjectId for aggregation if using $match on _id, 
            // but for 'club' field which is Ref, it usually matches string in Mongoose find, but aggregation is stricter.
            // I'll keep it simple: fetch all actions then process in JS if aggregation is too complex for this context 
            // without `mongoose.Types.ObjectId`.
        }

        // 1. Fetch Actions
        const actions = await Action.find(clubId ? { club: clubId } : {})
            .populate({
                path: 'attendees.member',
                select: 'name firstName lastName profileImage club preferredClub bonusPoints',
                populate: [
                    { path: 'club', select: 'name' },
                    { path: 'preferredClub', select: 'name' }
                ]
            });

        // 2. Calculate Most Active Members
        const attendanceMap = {};
        actions.forEach(action => {
            action.attendees.forEach(att => {
                if (att.present && att.member) {
                    const memberId = att.member._id.toString();
                    if (!attendanceMap[memberId]) {
                        // Use either 'club' (assigned) or 'preferredClub' (chosen at signup)
                        const memberClub = att.member.club || att.member.preferredClub;

                        attendanceMap[memberId] = {
                            _id: memberId,
                            name: att.member.name,
                            firstName: att.member.firstName,
                            lastName: att.member.lastName,
                            profileImage: att.member.profileImage,
                            clubName: memberClub?.name || 'Inconnu',
                            actionCount: 0,
                            bonusPoints: att.member.bonusPoints || 0
                        };
                    }
                    attendanceMap[memberId].actionCount++;
                }
            });
        });

        // 2.5 Add members with bonusPoints who might not have attended actions
        const usersWithBonus = await User.find({ bonusPoints: { $gt: 0 } })
            .select('name firstName lastName profileImage club preferredClub bonusPoints')
            .populate([
                { path: 'club', select: 'name' },
                { path: 'preferredClub', select: 'name' }
            ]);

        usersWithBonus.forEach(u => {
            const memberId = u._id.toString();
            if (!attendanceMap[memberId]) {
                const memberClub = u.club || u.preferredClub;
                attendanceMap[memberId] = {
                    _id: memberId,
                    name: u.name,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    profileImage: u.profileImage,
                    clubName: memberClub?.name || 'Inconnu',
                    actionCount: 0,
                    bonusPoints: u.bonusPoints || 0
                };
            } else {
                attendanceMap[memberId].bonusPoints = u.bonusPoints || 0;
            }
        });

        const sortedMembers = Object.values(attendanceMap)
            .map(m => ({
                ...m,
                count: m.actionCount + m.bonusPoints // Total score combines actions and bonus
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Get more members for the curve

        // 3. Activity Diagram Data (Actions per month)
        const last6Months = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString('default', { month: 'short' });
            last6Months[key] = 0;
        }

        actions.forEach(action => {
            const date = new Date(action.startDate);
            const key = date.toLocaleString('default', { month: 'short' });
            if (last6Months[key] !== undefined) {
                last6Months[key]++;
            }
        });

        const activityData = Object.keys(last6Months).map(key => ({
            month: key,
            actions: last6Months[key]
        }));

        // 4. Upcoming News (from Content)
        const now = new Date();
        const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const tenDaysStr = tenDaysFromNow.toISOString().split('T')[0];
        const oneDayAgoStr = oneDayAgo.toISOString().split('T')[0];

        const upcomingNews = await Content.find({
            status: 'approved',
            type: { $in: ['event', 'formation', 'news'] },
            date: { $gte: oneDayAgoStr, $lte: tenDaysStr }
        })
            .populate('club', 'name slug')
            .sort({ date: 1 })
            .limit(5)
            .lean();

        return NextResponse.json({
            success: true,
            data: {
                topMembers: sortedMembers,
                activityStats: activityData,
                totalActions: actions.length,
                upcomingNews
            }
        }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
