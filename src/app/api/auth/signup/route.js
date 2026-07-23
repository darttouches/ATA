import dbConnect from '@/lib/db';
import User from '@/models/User';
import Settings from '@/models/Settings';
import InterviewCandidate from '@/models/InterviewCandidate';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        await dbConnect();

        // Check registration period & status settings
        const recruitmentSettingsDoc = await Settings.findOne({ key: 'recruitment' });
        const recruitment = recruitmentSettingsDoc?.value;
        if (recruitment) {
            if (recruitment.isOpen === false) {
                return NextResponse.json(
                    { error: 'Les inscriptions sont actuellement fermées par l\'administration.' },
                    { status: 403 }
                );
            }
            const now = new Date();
            if (recruitment.startDate) {
                const start = new Date(recruitment.startDate);
                start.setHours(0, 0, 0, 0);
                if (now < start) {
                    return NextResponse.json(
                        { error: `Les inscriptions ne sont pas encore ouvertes. Ouverture prévue le ${start.toLocaleDateString('fr-FR')}.` },
                        { status: 403 }
                    );
                }
            }
            if (recruitment.endDate) {
                const end = new Date(recruitment.endDate);
                end.setHours(23, 59, 59, 999);
                if (now > end) {
                    return NextResponse.json(
                        { error: `La période d'inscription est clôturée depuis le ${end.toLocaleDateString('fr-FR')}.` },
                        { status: 403 }
                    );
                }
            }
        }

        const { name, email, password, firstName, lastName, phone, birthDate, profileImage, preferredClub, interviewCode } = await req.json();

        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json(
                { error: 'Veuillez remplir tous les champs obligatoires (Nom, Prénom, Email, Mot de passe)' },
                { status: 400 }
            );
        }

        if (!interviewCode) {
            return NextResponse.json(
                { error: 'Le code d\'entretien obligatoire n\'a pas été fourni (Obligatoire pour 2026/2027)' },
                { status: 400 }
            );
        }

        // Verify interview code & status
        const candidate = await InterviewCandidate.findOne({ code: interviewCode.trim().toUpperCase() });
        if (!candidate) {
            return NextResponse.json(
                { error: 'Code d\'entretien invalide' },
                { status: 400 }
            );
        }

        if (candidate.decision !== 'accepted') {
            return NextResponse.json(
                { error: 'Votre code d\'entretien doit être accepté par l\'administration pour finaliser l\'inscription' },
                { status: 400 }
            );
        }

        const targetSeason = '2026/2027';

        // Check if user already exists for current season
        const existingUserInSeason = await User.findOne({ email, season: targetSeason });
        if (existingUserInSeason) {
            return NextResponse.json(
                { error: 'Un compte membre existe déjà avec cet email pour la saison 2026/2027' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user for 2026/2027 season
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
            interviewCode: candidate.code,
            season: targetSeason,
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
