/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * lib/cloudinary.ts — Cloudinary Upload Helper
 */

import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured = !!(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });
}

export { isCloudinaryConfigured, cloudinary };

/**
 * Uploads an image to Cloudinary (from HTTPS URL, local path, or base64 string)
 * and returns the secure URL.
 */
export async function uploadToCloudinary(imageSource: string, publicId?: string, options?: any): Promise<string> {
    if (!imageSource) return '';

    if (!isCloudinaryConfigured) {
        return imageSource;
    }

    // If it's already a Cloudinary URL from this cloud, don't re-upload
    if (cloudName && imageSource.includes(`res.cloudinary.com/${cloudName}`)) {
        return imageSource;
    }

    try {
        let resolvedSource = imageSource;
        // Resolve absolute path for local files starting with /src/ or src/
        if (imageSource.startsWith('/src/')) {
            resolvedSource = path.join(process.cwd(), imageSource.substring(1));
        } else if (imageSource.startsWith('src/')) {
            resolvedSource = path.join(process.cwd(), imageSource);
        }

        const isRawDoc = options?.resourceType === 'raw' ||
            imageSource.startsWith('data:application/vnd') ||
            imageSource.startsWith('data:application/msword') ||
            imageSource.startsWith('data:application/zip');

        const uploadOptions: any = {
            folder: options?.folder || 'voltrix_power_systems',
            resource_type: isRawDoc ? 'raw' : (options?.resourceType || 'auto')
        };

        if (publicId) {
            uploadOptions.public_id = publicId;
            uploadOptions.overwrite = true;
        }

        const result = await cloudinary.uploader.upload(resolvedSource, uploadOptions);
        return result.secure_url;
    } catch (error: any) {
        console.error('[Cloudinary] Upload failed for source:', imageSource.substring(0, 100), error.message || error);
        return imageSource;
    }
}

/** Preset for uploading product catalog images */
export async function uploadProductImage(imageSource: string, productId: string): Promise<string> {
    return uploadToCloudinary(imageSource, `product_${productId}`, { folder: 'voltrix_power_systems/products' });
}

/** Preset for uploading category banner images */
export async function uploadCategoryImage(imageSource: string, categorySlug: string): Promise<string> {
    return uploadToCloudinary(imageSource, `category_${categorySlug}`, { folder: 'voltrix_power_systems/categories' });
}

/** Preset for uploading company branding/logos */
export async function uploadBranding(imageSource: string, assetName: string): Promise<string> {
    return uploadToCloudinary(imageSource, `branding_${assetName}`, { folder: 'voltrix_power_systems/branding' });
}

/** Preset for uploading customer documents/PDFs */
export async function uploadDocument(docSource: string, docId: string): Promise<string> {
    return uploadToCloudinary(docSource, `doc_${docId}`, { folder: 'voltrix_power_systems/documents', resourceType: 'raw' });
}
