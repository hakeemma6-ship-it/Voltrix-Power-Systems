const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

require('dotenv').config();

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('[FATAL] Missing required Cloudinary credentials in environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).');
    process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImage() {
    const imagePath = path.join(process.cwd(), 'public', 'Images', 'customer_welcome_portal.png');
    const envPath = path.join(process.cwd(), '.env');

    if (!fs.existsSync(imagePath)) {
        console.error('Image file not found:', imagePath);
        process.exit(1);
    }

    console.log('Uploading image to Cloudinary...');
    try {
        const result = await cloudinary.uploader.upload(imagePath, {
            folder: 'voltrix_whatsapp_headers',
            public_id: 'whatsapp_header_customer_welcome_credentials_url',
            overwrite: true
        });

        const cloudinaryUrl = result.secure_url;
        console.log('Upload success! URL:', cloudinaryUrl);

        // Update or append to .env
        let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
        const envLines = envContent.split(/\r?\n/);
        const key = 'WHATSAPP_HEADER_CUSTOMER_WELCOME_CREDENTIALS_URL';
        let found = false;

        for (let i = 0; i < envLines.length; i++) {
            if (envLines[i].startsWith(`${key}=`)) {
                envLines[i] = `${key}="${cloudinaryUrl}"`;
                found = true;
                break;
            }
        }

        if (!found) {
            envLines.push(`${key}="${cloudinaryUrl}"`);
        }

        fs.writeFileSync(envPath, envLines.join('\n'), 'utf8');
        console.log('.env file updated successfully!');
    } catch (err) {
        console.error('Upload failed:', err);
    }
}

uploadImage();
