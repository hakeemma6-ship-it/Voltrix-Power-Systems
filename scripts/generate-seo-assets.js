/**
 * Automated generator for Voltrix SEO, Open Graph, Favicon, and PWA assets
 * Uses official public/favicon_io/ assets and brand design system
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
require('dotenv').config();

const cloudinary = require('cloudinary').v2;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const FAVICON_IO_DIR = path.join(PUBLIC_DIR, 'favicon_io');
const NEW_ICON_512 = path.join(FAVICON_IO_DIR, 'android-chrome-512x512.png');
const BASE_LOGO = path.join(PUBLIC_DIR, 'logo.png');

async function generateAssets() {
  console.log('Generating Voltrix SEO, Social Media, and Favicon Assets...');

  // --- 1. Propagate user\'s new favicon_io images to root public/ ---
  console.log('Syncing new favicon_io files to public root...');
  const filesToCopy = [
    { src: 'favicon.ico', dest: 'favicon.ico' },
    { src: 'apple-touch-icon.png', dest: 'apple-touch-icon.png' },
    { src: 'favicon-32x32.png', dest: 'favicon-32x32.png' },
    { src: 'favicon-16x16.png', dest: 'favicon-16x16.png' },
    { src: 'android-chrome-192x192.png', dest: 'icon-192.png' },
    { src: 'android-chrome-192x192.png', dest: 'android-chrome-192x192.png' },
    { src: 'android-chrome-512x512.png', dest: 'icon-512.png' },
    { src: 'android-chrome-512x512.png', dest: 'android-chrome-512x512.png' },
  ];

  for (const f of filesToCopy) {
    const srcPath = path.join(FAVICON_IO_DIR, f.src);
    const destPath = path.join(PUBLIC_DIR, f.dest);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ ${f.dest}`);
    }
  }

  // --- 2. Generate Brand-Centered Open Graph Image (1200 x 630 px) ---
  console.log('Generating /public/og-image.png (1200x630)...');

  // Load user\'s new emblem
  const emblemMeta = await sharp(NEW_ICON_512).metadata();
  console.log('Using new brand emblem with dimensions:', emblemMeta.width, 'x', emblemMeta.height);

  // Resize emblem to fit prominently in center (200 x 200 px)
  const centerEmblem = await sharp(NEW_ICON_512)
    .resize(200, 200, { fit: 'inside' })
    .png()
    .toBuffer();

  const ogSvg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Background Gradient -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#040D1A" />
        <stop offset="50%" stop-color="#0A2342" />
        <stop offset="100%" stop-color="#020812" />
      </linearGradient>

      <!-- Radial Emerald Glow -->
      <radialGradient id="emeraldGlow" cx="50%" cy="32%" r="55%">
        <stop offset="0%" stop-color="#22c55e" stop-opacity="0.25" />
        <stop offset="65%" stop-color="#0A2342" stop-opacity="0" />
      </radialGradient>

      <!-- Emblem Container Backdrop -->
      <linearGradient id="emblemBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0F284A" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#07182E" stop-opacity="0.95" />
      </linearGradient>

      <!-- Badge Gradient -->
      <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#22c55e" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#16a34a" stop-opacity="0.08" />
      </linearGradient>

      <!-- Drop Shadow Filter -->
      <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6" />
      </filter>
      <filter id="glowShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="30" flood-color="#22c55e" flood-opacity="0.35" />
      </filter>
    </defs>

    <!-- Background Canvas -->
    <rect width="1200" height="630" fill="url(#bgGrad)" />
    <rect width="1200" height="630" fill="url(#emeraldGlow)" />

    <!-- Subtle Tech Grid Lines -->
    <g opacity="0.06" stroke="#FFFFFF" stroke-width="1">
      <line x1="120" y1="0" x2="120" y2="630" />
      <line x1="1080" y1="0" x2="1080" y2="630" />
      <line x1="0" y1="80" x2="1200" y2="80" />
      <line x1="0" y1="550" x2="1200" y2="550" />
    </g>

    <!-- Top Accent Bar -->
    <rect x="0" y="0" width="1200" height="6" fill="#22c55e" />

    <!-- Center Emblem Container Circle -->
    <circle cx="600" cy="175" r="115" fill="url(#emblemBg)" filter="url(#glowShadow)" stroke="#22c55e" stroke-width="2.5" stroke-opacity="0.6" />
    <circle cx="600" cy="175" r="122" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.2" stroke-dasharray="8 6" />

    <!-- Brand Name (Large & Crisp) -->
    <text x="600" y="340" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', Inter, -apple-system, sans-serif" font-size="44" font-weight="900" letter-spacing="4">
      VOLTRIX
    </text>
    <text x="600" y="375" text-anchor="middle" fill="#22c55e" font-family="'Plus Jakarta Sans', Inter, -apple-system, sans-serif" font-size="16" font-weight="700" letter-spacing="6">
      POWER SYSTEMS
    </text>

    <!-- Subtitle / Platform Mission -->
    <text x="600" y="425" text-anchor="middle" fill="#E2E8F0" font-family="Inter, -apple-system, sans-serif" font-size="20" font-weight="600">
      Industrial Power Protection &amp; Technical Guidance Portal
    </text>

    <!-- Products & Solutions Pills -->
    <g transform="translate(185, 465)">
      <!-- Pill 1 -->
      <rect x="0" y="0" width="195" height="38" rx="19" fill="#0A1E35" stroke="#1E3A5F" stroke-width="1.2" />
      <text x="97" y="24" text-anchor="middle" fill="#93C5FD" font-family="Inter, sans-serif" font-size="13" font-weight="600">⚡ Servo Stabilizers</text>

      <!-- Pill 2 -->
      <rect x="210" y="0" width="195" height="38" rx="19" fill="#0A1E35" stroke="#1E3A5F" stroke-width="1.2" />
      <text x="307" y="24" text-anchor="middle" fill="#86EFAC" font-family="Inter, sans-serif" font-size="13" font-weight="600">🔋 Industrial Online UPS</text>

      <!-- Pill 3 -->
      <rect x="420" y="0" width="195" height="38" rx="19" fill="#0A1E35" stroke="#1E3A5F" stroke-width="1.2" />
      <text x="517" y="24" text-anchor="middle" fill="#FDE047" font-family="Inter, sans-serif" font-size="13" font-weight="600">☀️ Solar Power Plants</text>

      <!-- Pill 4 -->
      <rect x="630" y="0" width="200" height="38" rx="19" fill="#0A1E35" stroke="#1E3A5F" stroke-width="1.2" />
      <text x="730" y="24" text-anchor="middle" fill="#C4B5FD" font-family="Inter, sans-serif" font-size="13" font-weight="600">🛡️ Certified Dealers</text>
    </g>

    <!-- Verified Domain Footer -->
    <g transform="translate(600, 570)">
      <rect x="-170" y="-18" width="340" height="32" rx="16" fill="url(#badgeGrad)" stroke="#22c55e" stroke-width="1" stroke-opacity="0.3" />
      <circle cx="-145" cy="-2" r="3.5" fill="#22c55e" />
      <text x="10" y="3" text-anchor="middle" fill="#F1F5F9" font-family="Inter, sans-serif" font-size="12" font-weight="700" letter-spacing="1.5">
        VOLTRIXSYSTEMS.COM
      </text>
    </g>
  </svg>
  `;

  // Place the new 200x200 emblem at cx=600, cy=175 -> left=500, top=75
  const ogImagePath = path.join(PUBLIC_DIR, 'og-image.png');
  await sharp(Buffer.from(ogSvg))
    .composite([
      { input: centerEmblem, left: 500, top: 75 }
    ])
    .png({ quality: 95 })
    .toFile(ogImagePath);

  console.log('✓ /public/og-image.png created successfully (with new brand emblem).');

  // --- 3. Upload to Cloudinary for instant, globally guaranteed preview delivery ---
  console.log('Uploading assets to Cloudinary CDN for 24/7 global preview delivery...');
  let ogCloudUrl = '';
  let iconCloudUrl = '';

  try {
    const ogUpload = await cloudinary.uploader.upload(ogImagePath, {
      folder: 'voltrix_power_systems',
      public_id: 'voltrix_og_image',
      overwrite: true,
      invalidate: true
    });
    ogCloudUrl = ogUpload.secure_url;
    console.log('✓ Cloudinary OG Image URL:', ogCloudUrl);

    const iconUpload = await cloudinary.uploader.upload(NEW_ICON_512, {
      folder: 'voltrix_power_systems',
      public_id: 'voltrix_brand_icon_512',
      overwrite: true,
      invalidate: true
    });
    iconCloudUrl = iconUpload.secure_url;
    console.log('✓ Cloudinary Brand Icon URL:', iconCloudUrl);
  } catch (cloudErr) {
    console.warn('Cloudinary upload warning:', cloudErr.message);
  }

  console.log('\nAsset generation & deployment complete!');
  return { ogCloudUrl, iconCloudUrl };
}

generateAssets()
  .then(res => {
    console.log('Result:', res);
    process.exit(0);
  })
  .catch(err => {
    console.error('Asset generation failed:', err);
    process.exit(1);
  });
