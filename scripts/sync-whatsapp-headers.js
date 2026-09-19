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

async function syncHeaders() {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        console.error('.env file not found.');
        return;
    }

    let envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split(/\r?\n/);
    let modified = false;

    console.log('Scanning env file for temporary URLs...');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('WHATSAPP_HEADER_') || line.startsWith('WHATSAPP_DEFAULT_HEADER_IMAGE_URL')) {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                let value = parts.slice(1).join('=').trim();
                // strip quotes
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                } else if (value.startsWith("'") && value.endsWith("'")) {
                    value = value.substring(1, value.length - 1);
                }

                if (value && (value.includes('scontent.whatsapp.net') || value.includes('images.unsplash.com')) && !value.includes('res.cloudinary.com')) {
                    console.log(`Syncing image for ${key}...`);
                    try {
                        const result = await cloudinary.uploader.upload(value, {
                            folder: 'voltrix_whatsapp_headers',
                            public_id: key.toLowerCase(),
                            overwrite: true
                        });
                        const newUrl = result.secure_url;
                        console.log(`Successfully uploaded to Cloudinary: ${newUrl}`);

                        // Replace in the original line array
                        lines[i] = `${key}="${newUrl}"`;
                        modified = true;
                    } catch (err) {
                        console.error(`Failed to upload ${key} to Cloudinary:`, err.message);
                    }
                }
            }
        }
    }

    if (modified) {
        fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
        console.log('.env file successfully updated with permanent Cloudinary URLs!');
    } else {
        console.log('No WhatsApp header URL changes required.');
    }
}

syncHeaders();
