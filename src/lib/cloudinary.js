import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary
 * @param {string} fileData - Base64 encoded file data
 * @param {string} folder - Folder name in Cloudinary (e.g., 'clubs', 'content', 'uploads')
 * @param {string} resourceType - Type of resource ('image', 'video', 'raw', 'auto')
 * @returns {Promise<{url: string, publicId: string, success: boolean}>}
 */
export async function uploadToCloudinary(fileData, folder = 'uploads', resourceType = 'auto') {
    try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(fileData, {
            folder: `siteATA/${folder}`, // Organize files by folder
            resource_type: resourceType,
            transformation: resourceType === 'image' ? [
                { quality: 'auto', fetch_format: 'auto' }, // Automatic quality and format optimization
            ] : undefined,
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
            success: true,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
    }
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @param {string} resourceType - Type of resource ('image', 'video', 'raw')
 * @returns {Promise<boolean>}
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        return result.result === 'ok';
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return false;
    }
}

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - The public ID of the image
 * @param {object} options - Transformation options (width, height, crop, etc.)
 * @returns {string} - Optimized image URL
 */
export function getOptimizedImageUrl(publicId, options = {}) {
    const {
        width,
        height,
        crop = 'fill',
        quality = 'auto',
        format = 'auto',
    } = options;

    return cloudinary.url(publicId, {
        width,
        height,
        crop,
        quality,
        fetch_format: format,
        secure: true,
    });
}

export default cloudinary;
