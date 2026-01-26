import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { getUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    await dbConnect();
    const logo = await Settings.findOne({ key: 'site_logo' });
    const footer = await Settings.findOne({ key: 'site_footer' });
    return NextResponse.json(
        {
            logo: logo?.value || null,
            footer: footer?.value || null
        },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

        const { logoUrl, footer } = await req.json();
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

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }
}
