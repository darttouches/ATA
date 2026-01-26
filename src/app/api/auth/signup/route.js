import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        await dbConnect();
        const { name, email, password, firstName, lastName, phone, birthDate, profileImage, preferredClub } = await req.json();

        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json(
                { error: 'Veuillez remplir tous les champs obligatoires (Nom, Prénom, Email, Mot de passe)' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: 'Cet email est déjà utilisé' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name: `${firstName} ${lastName}`,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            birthDate,
            profileImage,
            preferredClub,
            role: 'membre',
            status: 'pending', // Explicitly set pending for new signups
        });

        return NextResponse.json(
            { success: true, message: 'Compte créé avec succès' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Une erreur est survenue lors de l\'inscription' },
            { status: 500 }
        );
    }
}
