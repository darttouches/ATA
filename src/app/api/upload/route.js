import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const formData = await req.json();
        const { fileName, fileData, folder = 'uploads' } = formData;

        if (!fileName || !fileData) {
            return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
        }

        // Determine resource type based on file extension
        const extension = fileName.split('.').pop().toLowerCase();
        const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
        const resourceType = videoExtensions.includes(extension) ? 'video' : 'image';

        console.log(`Uploading ${resourceType} to Cloudinary: ${fileName}`);

        // Upload to Cloudinary
        const result = await uploadToCloudinary(fileData, folder, resourceType);

        console.log('Upload successful:', result.url);

        return NextResponse.json({
            url: result.url,
            publicId: result.publicId,
            success: true,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
            error: 'Erreur lors de l\'upload',
            details: error.message
        }, { status: 500 });
    }
}

