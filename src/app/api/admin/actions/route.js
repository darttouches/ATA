import dbConnect from '@/lib/db';
import Action from '@/models/Action';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        await dbConnect();
        const actions = await Action.find({})
            .populate('club', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json(actions);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { id, status } = await req.json();
        await dbConnect();

        // 1. Update the action
        const updatedAction = await Action.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('club');

        if (!updatedAction) return NextResponse.json({ error: 'Action introuvable' }, { status: 404 });

        // 2. Eval user consecutive attendance and club caching
        if (updatedAction.club && status === 'approved') {
            const clubId = updatedAction.club._id || updatedAction.club;
            const Club = (await import('@/models/Club')).default;
            const User = (await import('@/models/User')).default;

            const approvedActions = await Action.find({ club: clubId, status: 'approved' }).sort({ startDate: 1 });
            const members = await User.find({ club: clubId, isActive: { $ne: false }, role: { $in: ['membre', 'president'] } });

            // Reward members (+1 for every 3 consecutive presences)
            for (const member of members) {
                let streak = 0;
                let deservedPoints = 0;
                
                for (const action of approvedActions) {
                    const att = action.attendees.find(a => a.member && a.member.toString() === member._id.toString());
                    if (att && att.present) {
                        streak += 1;
                        if (streak === 3) {
                            deservedPoints += 1;
                            streak = 0;
                        }
                    } else {
                        streak = 0;
                    }
                }
                
                const awardedPoints = member.scoreHistory
                    ? member.scoreHistory.filter(h => h.reason === 'Bonus 3 Actions Consécutives').reduce((sum, h) => sum + (h.points || 0), 0)
                    : 0;
                
                const diff = deservedPoints - awardedPoints;
                if (diff > 0) {
                    await User.findByIdAndUpdate(member._id, {
                        $inc: { bonusPoints: diff },
                        $push: {
                            scoreHistory: {
                                points: diff,
                                reason: 'Bonus 3 Actions Consécutives',
                                addedBy: 'Système Administrateur',
                                date: new Date()
                            }
                        }
                    });
                }
            }

            // Sync approvedEventsCount cache on Club (though ranking computes it dynamically)
            const count = await Action.countDocuments({ club: clubId, status: 'approved' });
            await Club.findByIdAndUpdate(clubId, { approvedEventsCount: count });
        }

        // 3. Notify the President (Club Chief)
        if (updatedAction.club && updatedAction.club.chief) {
            const Notification = (await import('@/models/Notification')).default;

            const statusLabel = status === 'approved' ? 'approuvée' : 'rejetée';
            const title = `Action ${statusLabel}`;
            const message = `Votre action "${updatedAction.title}" a été ${statusLabel} par le Bureau National.`;

            await Notification.create({
                recipient: updatedAction.club.chief,
                type: 'action_status',
                title,
                message,
                link: '/dashboard/my-club/actions'
            });
        }

        return NextResponse.json(updatedAction);
    } catch (error) {
        console.error('Error updating action status:', error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const user = await getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'national')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        await dbConnect();
        await Action.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Action supprimée' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
