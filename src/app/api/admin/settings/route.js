import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    await dbConnect();
    const logo = await Settings.findOne({ key: 'site_logo' });
    const footer = await Settings.findOne({ key: 'site_footer' });
    const ataWaves = await Settings.findOne({ key: 'ata_waves' });
    const bgMusic = await Settings.findOne({ key: 'bg_music' });
    const meetingTA = await Settings.findOne({ key: 'meeting_ta' });
    const games = await Settings.findOne({ key: 'games' });
    const scanner = await Settings.findOne({ key: 'scanner' });

    const defaultBgMusic = {
        playlist: [{ id: 'default', name: 'Musique Par Défaut', url: '/music/background.mp3' }],
        activeTrackId: 'default',
        volume: 0.5
    };

    const defaultGames = {
        isPublished: true,
        sidebarLabel: { fr: 'Jeux de Société', en: 'Board Games', ar: 'ألعاب الطاولة' },
        authorizedRoles: ['admin', 'national', 'president', 'bureau', 'membre'],
        authorizedUsers: [],
        loupGarou: {
            isPublished: true,
            modes: 'both' // 'presence', 'online', 'both'
        },
        xo: {
            isPublished: true,
            modes: 'both' // 'presence', 'online', 'both'
        },
        barbechni: {
            isPublished: true,
            modes: 'both',
            minPlayers: 3,
            maxPlayers: 15,
            allowQuestion: true,
            allowReclamation: true,
            allowAnonymityVote: true
        },
        wasaaa3: {
            isPublished: true,
            modes: 'both', // 'presence', 'online', 'both'
            authorizedRoles: ['admin', 'national', 'president', 'bureau', 'membre'],
            authorizedUsers: []
        }
    };

    const defaultScanner = {
        isPublished: true,
        authorizedRoles: ['admin', 'president'],
        authorizedUsers: []
    };

    return NextResponse.json(
        {
            logo: logo?.value || null,
            footer: footer?.value || null,
            ataWaves: ataWaves?.value || { isPublished: false, authorizedUsers: [] },
            bgMusic: bgMusic?.value || defaultBgMusic,
            meetingTA: meetingTA?.value || { isPublished: true, authorizedRoles: ['admin', 'national', 'president'], authorizedUsers: [] },
            games: games?.value || defaultGames,
            scanner: scanner?.value || defaultScanner
        },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { logoUrl, footer, ataWaves, bgMusic, meetingTA, games, scanner } = await req.json();
        await dbConnect();

        if (logoUrl !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'site_logo' },
                { value: logoUrl, updatedAt: Date.now() },
                { upsert: true }
            );
        }

        if (footer !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'site_footer' },
                { value: footer, updatedAt: Date.now() },
                { upsert: true }
            );
        }

        if (ataWaves !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'ata_waves' },
                { value: ataWaves, updatedAt: Date.now() },
                { upsert: true }
            );
        }

        if (bgMusic !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'bg_music' },
                { value: bgMusic, updatedAt: Date.now() },
                { upsert: true }
            );
        }

        if (meetingTA !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'meeting_ta' },
                { value: meetingTA, updatedAt: Date.now() },
                { upsert: true }
            );
        }

        if (games !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'games' },
                { value: games, updatedAt: Date.now() },
                { upsert: true }
            );
        }

        if (scanner !== undefined) {
            await Settings.findOneAndUpdate(
                { key: 'scanner' },
                { value: scanner, updatedAt: Date.now() },
                { upsert: true }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }
}
