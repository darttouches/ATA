
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Club from '@/models/Club';
import Notification from '@/models/Notification';
import Settings from '@/models/Settings';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        await dbConnect();

        const today = new Date();
        const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

        // Check if we already ran this today
        const lastCheck = await Settings.findOne({ key: 'lastBirthdayCheck' });
        if (lastCheck && lastCheck.value === dateKey) {
            return NextResponse.json({ message: 'Birthdays already processed for today' });
        }

        const m = today.getMonth() + 1;
        const d = today.getDate();

        // 1. Find all users having birthday today
        // Note: MongoDB doesn't have an easy way to compare month/day without aggregation or storing them separately
        // For simplicity with reasonable number of users, we fetch all and filter
        const users = await User.find({ birthDate: { $exists: true } }).select('firstName lastName name role birthDate club preferredClub profileImage').lean();
        
        const birthdayMembers = users.filter(user => {
            const birth = new Date(user.birthDate);
            return (birth.getMonth() + 1) === m && birth.getDate() === d;
        });

        if (birthdayMembers.length === 0) {
            await Settings.findOneAndUpdate(
                { key: 'lastBirthdayCheck' },
                { value: dateKey },
                { upsert: true }
            );
            return NextResponse.json({ message: 'No birthdays today' });
        }

        // 2. Create notification for ALL users
        const allUsers = await User.find({ status: 'approved' }).select('_id').lean();
        
        const names = birthdayMembers.map(u => `${u.firstName} ${u.lastName}`).join(', ');
        const title = "🎉 Anniversaire !";
        const message = birthdayMembers.length > 1 
            ? `Aujourd'hui, nous fêtons les anniversaires de : ${names} !`
            : `Aujourd'hui, c'est l'anniversaire de ${names} !`;

        // We use insertMany for bulk notification creation (careful with memory if huge number of users)
        // But Notification model has a post-save hook for push notifications. 
        // insertMany doesn't trigger post-save hooks usually. 
        // So we might want to use a loop or a smarter way if push is needed for everyone.
        // Given push notifications might be expensive/slow for all users at once, 
        // let's do it in a way that at least creates the DB records.
        
        const notificationsToCreate = allUsers.map(u => ({
            recipient: u._id,
            type: 'birthday',
            title,
            message,
            link: '/dashboard/birthdays',
            isRead: false
        }));

        // Use bulkWrite or insertMany. insertMany is easier.
        await Notification.insertMany(notificationsToCreate);

        // Update last check
        await Settings.findOneAndUpdate(
            { key: 'lastBirthdayCheck' },
            { value: dateKey },
            { upsert: true }
        );

        return NextResponse.json({ 
            success: true, 
            count: birthdayMembers.length,
            notified: allUsers.length
        });

    } catch (error) {
        console.error('Birthday Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
