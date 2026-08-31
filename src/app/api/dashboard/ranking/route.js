import dbConnect from '@/lib/db';
import User from '@/models/User';
import Club from '@/models/Club';
import Action from '@/models/Action';
import Content from '@/models/Content';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const season = searchParams.get('season'); // e.g. '2025/2026', '2026/2027', 'all'

        if (type === 'clubs') {
            const clubs = await Club.find({}).lean();
            
            // Build action date filter if season is specified
            let actionDateFilter = null;
            if (season && season !== 'all') {
                const parts = season.split('/');
                const startYear = parseInt(parts[0]);
                if (!isNaN(startYear)) {
                    actionDateFilter = {
                        $gte: new Date(Date.UTC(startYear, 8, 1)), // Sep 1 of start year
                        $lt: new Date(Date.UTC(startYear + 1, 8, 1)) // Sep 1 of end year
                    };
                }
            }

            const clubRankings = await Promise.all(
                clubs.map(async (club) => {
                    const actionQuery = { club: club._id, status: 'approved' };
                    if (actionDateFilter) {
                        actionQuery.$or = [
                            { startDate: actionDateFilter },
                            { createdAt: actionDateFilter }
                        ];
                    }

                    const approvedActions = await Action.find(actionQuery, 'title startDate endDate description contentRef createdAt').lean();

                    // Also query Content model for all shared content types (events, formations, photos, videos, news)
                    const contentQuery = { club: club._id, status: 'approved' };
                    if (actionDateFilter) {
                        contentQuery.createdAt = actionDateFilter;
                    }
                    const approvedContents = await Content.find(contentQuery, 'title type description date createdAt').lean();

                    // Map & deduplicate shared items
                    const itemsMap = new Map();

                    approvedActions.forEach(a => {
                        const key = a.contentRef ? a.contentRef.toString() : a._id.toString();
                        itemsMap.set(key, {
                            _id: a._id,
                            title: a.title,
                            type: 'event',
                            startDate: a.startDate || a.createdAt,
                            description: a.description
                        });
                    });

                    approvedContents.forEach(c => {
                        const key = c._id.toString();
                        if (!itemsMap.has(key)) {
                            itemsMap.set(key, {
                                _id: c._id,
                                title: c.title,
                                type: c.type || 'news',
                                startDate: c.date ? new Date(c.date) : c.createdAt,
                                description: c.description
                            });
                        } else {
                            // Enrich type if contentRef existed
                            const existing = itemsMap.get(key);
                            if (c.type) existing.type = c.type;
                        }
                    });

                    const allApprovedItems = Array.from(itemsMap.values()).sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
                    const approvedEventsCount = allApprovedItems.length;
                    const clubScore = approvedEventsCount + 5;

                    // Build member query for this club
                    const memberQuery = {
                        $or: [{ club: club._id }, { preferredClub: club._id }],
                        status: 'approved',
                        role: { $ne: 'club' }
                    };

                    if (season && season !== 'all') {
                        if (season === '2025/2026') {
                            memberQuery.$and = [
                                { $or: [{ season: '2025/2026' }, { season: { $exists: false } }, { season: '' }] }
                            ];
                        } else {
                            memberQuery.season = season;
                        }
                    }

                    const members = await User.find(memberQuery, 'bonusPoints isActive').lean();

                    const totalMembers = members.length;
                    const activeMembersCount = members.filter(m => (m.bonusPoints || 0) > 0 && m.isActive !== false).length;
                    const activeMembersPercent = totalMembers > 0 ? Math.round((activeMembersCount / totalMembers) * 100) : 0;

                    return {
                        _id: club._id,
                        name: club.name,
                        logo: club.logo,
                        coverImage: club.coverImage,
                        approvedEventsCount,
                        clubScore,
                        approvedEvents: allApprovedItems,
                        activeMembersCount,
                        totalMembers,
                        activeMembersPercent,
                        isActive: club.isActive !== false
                    };
                })
            );

            // Sort: nb events approved desc, then % active members desc, then total members desc
            clubRankings.sort((a, b) => {
                if (b.clubScore !== a.clubScore) {
                    return b.clubScore - a.clubScore;
                }
                if (b.activeMembersPercent !== a.activeMembersPercent) {
                    return b.activeMembersPercent - a.activeMembersPercent;
                }
                return b.totalMembers - a.totalMembers;
            });

            return NextResponse.json({ success: true, type: 'clubs', data: clubRankings });
        } else {
            // Fetch members
            // No isActive filter — historical rankings show all approved members even if deactivated
            const memberQuery = { status: 'approved', role: { $ne: 'club' } };
            if (season && season !== 'all') {
                if (season === '2025/2026') {
                    memberQuery.$or = [{ season: '2025/2026' }, { season: { $exists: false } }, { season: '' }];
                } else {
                    memberQuery.season = season;
                }
            }

            const users = await User.find(
                memberQuery,
                'name firstName lastName profileImage club preferredClub season bonusPoints status isActive scoreHistory'
            )
            .populate('club', 'name')
            .populate('preferredClub', 'name')
            .lean();

            return NextResponse.json({ success: true, type: 'members', data: users });
        }
    } catch (error) {
        console.error("Erreur api ranking:", error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}
