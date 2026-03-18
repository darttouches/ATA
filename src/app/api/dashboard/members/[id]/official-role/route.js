import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Club from '@/models/Club';
import { getUser } from '@/lib/auth';

export async function POST(req, { params }) {
    try {
        const { id } = await params;
        const { officialRole } = await req.json();

        const sessionUser = await getUser();
        if (!sessionUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        // The one doing the editing
        const editor = await User.findById(sessionUser.userId);
        // The one being edited
        const targetMember = await User.findById(id);

        if (!editor || !targetMember) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Permission Check
        let hasPermission = false;

        // Admins and National Board members can edit anyone
        if (editor.role === 'admin' || editor.role === 'national') {
            hasPermission = true;
        }
        // Presidents can only edit members of their own club
        else if (editor.role === 'president') {
            let editorClubId = editor.club;
            if (!editorClubId) {
                const ownedClub = await Club.findOne({ chief: editor._id });
                if (ownedClub) editorClubId = ownedClub._id;
            }

            if (editorClubId) {
                const memberClubId = targetMember.club?.toString() || targetMember.preferredClub?.toString();
                if (memberClubId === editorClubId.toString()) {
                    hasPermission = true;
                }
            }
        }

        if (!hasPermission) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        targetMember.officialRole = officialRole;
        await targetMember.save();

        return NextResponse.json({ success: true, officialRole: targetMember.officialRole });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
