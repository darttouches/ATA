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
        const user = await User.findOne({ email }).select('+password');

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

        // Check user status (Admins are always allowed)
        if (user.role !== 'admin' && user.status !== 'approved') {
            if (user.status === 'pending') {
                return NextResponse.json(
                    { error: 'Votre compte est en attente d\'approbation par un administrateur.' },
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

        // Create Token
        const token = jwt.sign(
            { userId: user._id, role: user.role, name: user.name },
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
