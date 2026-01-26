import dbConnect from '@/lib/db';
import User from '@/models/User';
import { sendEmail } from '@/lib/mail';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { email } = await req.json();
        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            // For security reasons, don't reveal if the user exists or not
            return NextResponse.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set token and expiry on user
        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

        const message = `
      <h1>Réinitialisation de votre mot de passe</h1>
      <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Touches D'Art.</p>
      <p>Veuillez cliquer sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #11224E; color: white; text-decoration: none; border-radius: 5px;">Réinitialiser le mot de passe</a>
      <p>Ce lien expirera dans 1 heure.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
    `;

        await sendEmail({
            to: user.email,
            subject: 'Réinitialisation de mot de passe - Touches D\'Art',
            html: message,
        });

        return NextResponse.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        if (!process.env.EMAIL_HOST) {
            console.error('MISSING EMAIL CONFIGURATION: Please check your .env file for EMAIL_HOST, EMAIL_USER, etc.');
        }
        return NextResponse.json({ error: 'Une erreur est survenue lors de l\'envoi de l\'email. Veuillez contacter l\'administrateur.' }, { status: 500 });
    }
}
