import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export async function POST(req) {
    try {
        await dbConnect();
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Veuillez saisir votre email et mot de passe' },
                { status: 400 }
            );
        }

        // Explicitly select password because it is set to select: false in schema
        // If same email exists in multiple seasons (re-registration), pick the most recent active account first
        const candidates = await User.find({ email }).select('+password').lean();
        if (!candidates || candidates.length === 0) {
            return NextResponse.json(
                { error: 'Email ou mot de passe incorrect' },
                { status: 401 }
            );
        }

        // Sort: prefer active accounts, then most recent season, then most recent createdAt
        candidates.sort((a, b) => {
            const aActive = a.isActive !== false ? 1 : 0;
            const bActive = b.isActive !== false ? 1 : 0;
            if (bActive !== aActive) return bActive - aActive; // active first
            // Then sort by season descending (e.g. '2026/2027' > '2025/2026')
            const aSeason = a.season || '2025/2026';
            const bSeason = b.season || '2025/2026';
            if (bSeason !== aSeason) return bSeason.localeCompare(aSeason);
            // Then by most recent creation
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Re-fetch the chosen user with a proper mongoose document (needed for .save())
        const chosenId = candidates[0]._id;
        const user = await User.findById(chosenId).select('+password');

        if (!user) {
            return NextResponse.json(
                { error: 'Email ou mot de passe incorrect' },
                { status: 401 }
            );
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { error: 'Email ou mot de passe incorrect' },
                { status: 401 }
            );
        }

        // Check user active status (Admins are always allowed)
        if (user.role !== 'admin' && user.isActive === false) {
            return NextResponse.json(
                { error: 'Votre compte a été désactivé pour cette saison. Veuillez vous réinscrire pour la nouvelle année.' },
                { status: 403 }
            );
        }

        // Check user status (Admins are always allowed)
        if (user.role !== 'admin' && user.status !== 'approved') {
            if (user.status === 'pending') {
                return NextResponse.json(
                    { error: 'PAYMENT_PENDING', errorCode: 'PAYMENT_PENDING' },
                    { status: 403 }
                );
            }
            if (user.status === 'rejected') {
                return NextResponse.json(
                    { error: 'Votre demande d\'inscription a été refusée.' },
                    { status: 403 }
                );
            }
        }

        // Even if approved, member must have paid to access the platform
        if (user.role !== 'admin' && user.status === 'approved' && user.isPaid === false) {
            return NextResponse.json(
                { error: 'PAYMENT_PENDING', errorCode: 'PAYMENT_PENDING' },
                { status: 403 }
            );
        }


        // Generate a new Session ID
        const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        user.sessionId = sessionId;
        await user.save();

        // Create Token
        const token = jwt.sign(
            { userId: user._id, role: user.role, name: user.name, sessionId: sessionId },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Create response and set cookie
        const response = NextResponse.json(
            { success: true, role: user.role },
            { status: 200 }
        );

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
            sameSite: 'strict',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la connexion' },
            { status: 500 }
        );
    }
}
