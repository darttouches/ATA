import dbConnect from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { token, password } = await req.json();
        await dbConnect();

        const resetTokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return NextResponse.json({ error: 'Le lien est invalide ou a expiré' }, { status: 400 });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return NextResponse.json({ message: 'Votre mot de passe a été réinitialisé avec succès.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
    }
}
