import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Public upload endpoint — used ONLY for profile photo during signup (no auth required)
// Restricted to images in the 'profiles' folder only.
export async function POST(req) {
    try {
        const body = await req.json();
        const { fileName, fileData } = body;

        if (!fileName || !fileData) {
            return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
        }

        // Allow images only
        const extension = fileName.split('.').pop().toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];
        if (!allowedExtensions.includes(extension)) {
            return NextResponse.json({ error: 'Seules les images sont autorisées (jpg, png, gif, webp).' }, { status: 400 });
        }

        // Validate that fileData is a valid base64 image
        if (!fileData.startsWith('data:image/')) {
            return NextResponse.json({ error: 'Format de fichier invalide.' }, { status: 400 });
        }

        // Limit size: base64 string length ~= (4/3) * bytes → ~4MB file = ~5.3MB base64
        if (fileData.length > 7 * 1024 * 1024) {
            return NextResponse.json({ error: 'La photo est trop lourde (max 5 Mo).' }, { status: 400 });
        }

        const result = await uploadToCloudinary(fileData, 'profiles', 'image');

        return NextResponse.json({
            url: result.url,
            publicId: result.publicId,
            success: true,
        });
    } catch (error) {
        console.error('Public upload error:', error);
        return NextResponse.json({
            error: "Erreur lors de l'upload de la photo.",
            details: error.message
        }, { status: 500 });
    }
}
