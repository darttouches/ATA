import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';

export default async function manifest() {
    let siteLogo = '/logo/1769021673687-bva05-logo touches d\'art v3  (1).png'; // Default fallback

    try {
        await dbConnect();
        const logoSetting = await Settings.findOne({ key: 'site_logo' });
        if (logoSetting && logoSetting.value) {
            siteLogo = logoSetting.value;
        }
    } catch (error) {
        console.error('Error fetching manifest logo:', error);
    }

    // Ensure the path is properly formatted for the manifest JSON
    let finalLogoPath = siteLogo;
    if (typeof finalLogoPath === 'string' && !finalLogoPath.startsWith('/') && !finalLogoPath.startsWith('http')) {
        finalLogoPath = '/' + finalLogoPath;
    }

    // Advanced: If it's a Cloudinary URL, we can use transformations to provide exact sizes
    const isCloudinary = typeof finalLogoPath === 'string' && finalLogoPath.includes('cloudinary.com');

    const getIconUrl = (size) => {
        if (!isCloudinary) return encodeURI(finalLogoPath);

        // Split to handle potential query parameters (though Cloudinary usually doesn't need them with transformations)
        const [baseUrl, query] = finalLogoPath.split('?');
        // 1. Inject transformations
        // 2. Force .png extension for transparency
        let transformedUrl = baseUrl.replace('/upload/', `/upload/w_${size},h_${size},c_pad,b_white/r_max/`);

        // Remove old extension and add .png
        transformedUrl = transformedUrl.replace(/\.[^/.]+$/, "") + ".png";

        if (query) transformedUrl += '?' + query;
        return transformedUrl;
    };

    const icons = isCloudinary ? [
        {
            src: getIconUrl(192),
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
        },
        {
            src: getIconUrl(512),
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
        },
        {
            src: getIconUrl(192),
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
        },
        {
            src: getIconUrl(512),
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
        }
    ] : [
        {
            src: encodeURI(finalLogoPath),
            sizes: "any",
            purpose: "any",
        },
        {
            src: encodeURI(finalLogoPath),
            sizes: "any",
            purpose: "maskable",
        }
    ];

    return {
        name: "Association Touches D'Art",
        short_name: "ATA",
        description: "Association culturelle.",
        start_url: "/",
        display: "standalone",
        background_color: "#11224E",
        theme_color: "#11224E",
        icons: icons
    };
}
