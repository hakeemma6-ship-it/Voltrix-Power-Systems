require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from env credentials
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('[FATAL] Missing required Cloudinary credentials in environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).');
    process.exit(1);
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Normalization function to align database product names with filenames
function normalize(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '') // remove spaces, dashes, special chars
        .replace(/s$/, ''); // singularize trailing 's'
}

async function main() {
    const mongoUri = process.env.MONGOURI;
    if (!mongoUri) {
        console.error('MONGOURI environment variable not found in .env file!');
        process.exit(1);
    }

    console.log('[Upload Script] Connecting to MongoDB...');
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    console.log('[Upload Script] MongoDB connected.');

    // Read all image files in public/images
    const imagesDir = path.join(__dirname, '..', 'public', 'images');
    if (!fs.existsSync(imagesDir)) {
        console.error(`Folder "${imagesDir}" does not exist!`);
        process.exit(1);
    }

    const imageFiles = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
    console.log(`[Upload Script] Found ${imageFiles.length} image files in public/images.`);

    // 1. Process "categories" collection
    const categories = await db.collection('categories').find({}).toArray();
    console.log(`\n[Upload Script] Syncing categories collection (${categories.length} categories)...`);

    for (const cat of categories) {
        // Skip AMC services as requested
        if (cat.slug === 'amc-services' || cat.name.toLowerCase().includes('amc')) {
            console.log(`Skipping AMC category "${cat.name}"`);
            continue;
        }

        if (!cat.products || !Array.isArray(cat.products)) continue;
        console.log(`Processing category "${cat.name}"...`);

        let categoryUpdated = false;
        for (const prod of cat.products) {
            const normProd = normalize(prod.name);
            let matchedFile = null;

            for (const file of imageFiles) {
                const normFile = normalize(path.parse(file).name);
                if (normProd === normFile) {
                    matchedFile = file;
                    break;
                }
            }

            if (matchedFile) {
                const filePath = path.join(imagesDir, matchedFile);
                console.log(`  -> Match found: "${prod.name}" (id: ${prod.id}) matches "${matchedFile}". Uploading to Cloudinary...`);

                try {
                    const result = await cloudinary.uploader.upload(filePath, {
                        folder: 'voltrix_power_systems',
                        public_id: `product_${prod.id}`,
                        overwrite: true
                    });

                    console.log(`  -> Completed: ${result.secure_url}`);
                    prod.image = result.secure_url;
                    categoryUpdated = true;
                } catch (uploadErr) {
                    console.error(`  -> Failed to upload file "${matchedFile}":`, uploadErr.message || uploadErr);
                }
            } else {
                console.warn(`  -> WARNING: No matching image file found for product "${prod.name}"`);
            }
        }

        if (categoryUpdated) {
            await db.collection('categories').updateOne(
                { _id: cat._id },
                { $set: { products: cat.products } }
            );
            console.log(`Category "${cat.name}" updated in MongoDB Database.`);
        }
    }

    // 2. Process "products" collection (under subcategories array)
    const products = await db.collection('products').find({}).toArray();
    console.log(`\n[Upload Script] Syncing products collection (${products.length} products)...`);

    for (const rootProd of products) {
        if (rootProd.slug === 'amc-services' || rootProd.name.toLowerCase().includes('amc')) {
            console.log(`Skipping AMC products "${rootProd.name}"`);
            continue;
        }

        if (!rootProd.subcategories || !Array.isArray(rootProd.subcategories)) continue;
        console.log(`Processing product category "${rootProd.name}"...`);

        let productUpdated = false;
        for (const sub of rootProd.subcategories) {
            const normSub = normalize(sub.name);
            let matchedFile = null;

            for (const file of imageFiles) {
                const normFile = normalize(path.parse(file).name);
                if (normSub === normFile) {
                    matchedFile = file;
                    break;
                }
            }

            if (matchedFile) {
                const filePath = path.join(imagesDir, matchedFile);
                console.log(`  -> Match found: "${sub.name}" (id: ${sub.id}) matches "${matchedFile}". Uploading to Cloudinary...`);

                try {
                    const result = await cloudinary.uploader.upload(filePath, {
                        folder: 'voltrix_power_systems',
                        public_id: `sub_${sub.id}`,
                        overwrite: true
                    });

                    console.log(`  -> Completed: ${result.secure_url}`);
                    sub.image = result.secure_url;
                    productUpdated = true;
                } catch (uploadErr) {
                    console.error(`  -> Failed to upload file "${matchedFile}":`, uploadErr.message || uploadErr);
                }
            } else {
                console.warn(`  -> WARNING: No matching image file found for subcategory "${sub.name}"`);
            }
        }

        if (productUpdated) {
            await db.collection('products').updateOne(
                { _id: rootProd._id },
                { $set: { subcategories: rootProd.subcategories } }
            );
            console.log(`Product category "${rootProd.name}" updated in MongoDB Database.`);
        }
    }

    console.log('\n[Upload Script] All matches processed and synchronized successfully.');
    await client.close();
}

main().catch(error => {
    console.error('[Upload Script] Fatal execution error:', error);
});
