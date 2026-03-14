import dbConnect from '@/lib/db';
import User from '@/models/User';
import Club from '@/models/Club';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        await dbConnect();

        // Check if id is a valid ObjectId to prevent 500 error
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return NextResponse.json({ error: 'Format de carte invalide' }, { status: 404 });
        }

        const user = await User.findById(id)
            .populate('club', 'name logo color')
            .select('name firstName lastName profileImage role status isPaid memberNumber club preferredClub facebook instagram whatsapp linkedin website phone email officialRole');

        if (!user) {
            return NextResponse.json({ error: 'Cette carte n\'existe plus ou le compte a été supprimé.' }, { status: 404 });
        }

        if (user.status !== 'approved') {
            return NextResponse.json({ error: 'Accès refusé : Cette carte de membre a été révoquée ou n\'a pas encore été approuvée.' }, { status: 403 });
        }

        if (!user.isPaid) {
            return NextResponse.json({ error: 'Accès restreint : Votre cotisation n\'est pas à jour. Veuillez contacter votre club.' }, { status: 403 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching card data:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
