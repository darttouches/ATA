import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import Content from '@/models/Content';
import Testimonial from '@/models/Testimonial';
import User from '@/models/User';
import Action from '@/models/Action';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    try {
        const { slug } = await params;
        await dbConnect();

        const club = await Club.findOne({ slug }).populate('chief', 'name email').lean();
        if (!club) {
            return NextResponse.json({ error: 'Club not found' }, { status: 404 });
        }

        const contents = await Content.find({ club: club._id, status: 'approved' }).sort({ date: 1, createdAt: -1 }).lean();
        const testimonials = await Testimonial.find({ club: club._id, approved: true }).sort({ createdAt: -1 }).limit(10).lean();

        const actions = await Action.find({ club: club._id }).populate('attendees.member').lean();

        const today = new Date();
        const m = today.getMonth() + 1;
        const d = today.getDate();

        const clubMembers = await User.find({
            $or: [
                { club: club._id },
                { preferredClub: club._id }
            ]
        }).select('firstName lastName name profileImage role birthDate bonusPoints').lean();

        const memberStats = clubMembers.map(member => {
            const actionCount = actions.filter(a =>
                a.attendees?.some(att => att.present && att.member?._id?.toString() === member._id.toString())
            ).length;

            return {
                ...member,
                totalPoints: actionCount + (member.bonusPoints || 0)
            };
        });

        const birthdayMembers = memberStats.filter(user => {
            if (!user.birthDate) return false;
            const birth = new Date(user.birthDate);
            return (birth.getMonth() + 1) === m && birth.getDate() === d;
        });

        const automaticallyActiveMembers = [...memberStats]
            .filter(m => m.totalPoints > 0)
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, 5);

        return NextResponse.json({
            club,
            events: contents.filter(c => c.type === 'event' || c.type === 'formation'),
            gallery: contents.filter(c => c.type === 'photo'),
            videos: contents.filter(c => c.type === 'video'),
            testimonials,
            birthdayMembers,
            automaticallyActiveMembers
        });
    } catch (error) {
        console.error('Club API Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
