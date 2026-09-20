/**
 * Automated generator for Voltrix SEO, Open Graph, Favicon, and PWA assets
 * Uses official public/logo.png and brand design system
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const LOGO_PATH = path.join(PUBLIC_DIR, 'logo.png');

async function generateAssets() {
  console.log('Generating Voltrix SEO and Social Media Assets...');

  if (!fs.existsSync(LOGO_PATH)) {
    throw new Error(`Base logo not found at: ${LOGO_PATH}`);
  }

  // --- 1. Prepare Transparent Logo & Emblem ---
  // In public/logo.png, background is near-white (RGB ~253, 254, 254)
  // We can convert near-white to transparent alpha for clean overlaying
  const rawLogo = await sharp(LOGO_PATH).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = rawLogo;
  const transparentLogoBuf = Buffer.from(data);

  for (let i = 0; i < transparentLogoBuf.length; i += 4) {
    const r = transparentLogoBuf[i];
    const g = transparentLogoBuf[i + 1];
    const b = transparentLogoBuf[i + 2];
    // If pixel is near-white (all channels > 242)
    if (r > 242 && g > 242 && b > 242) {
      transparentLogoBuf[i + 3] = 0; // Transparent
    }
  }

  const transparentLogo = await sharp(transparentLogoBuf, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png().toBuffer();

  // Extract Emblem (left: 36, top: 60, width: 604, height: 606)
  const emblemBuf = await sharp(transparentLogo)
    .extract({ left: 36, top: 60, width: 604, height: 606 })
    .png()
    .toBuffer();

  // --- 2. Generate Open Graph Image (1200 x 630 px) ---
  console.log('Generating /public/og-image.png (1200x630)...');
  
  // Resize logo for OG card (width: 480px)
  const ogLogo = await sharp(transparentLogo)
    .resize({ width: 480, fit: 'inside' })
    .png()
    .toBuffer();

  const ogSvg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Background Gradient -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#071426" />
        <stop offset="50%" stop-color="#0A2342" />
        <stop offset="100%" stop-color="#050C16" />
      </linearGradient>

      <!-- Radial Emerald Glow -->
      <radialGradient id="emeraldGlow" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#22c55e" stop-opacity="0.18" />
        <stop offset="60%" stop-color="#0A2342" stop-opacity="0" />
      </radialGradient>

      <!-- Card Gradient -->
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.98" />
        <stop offset="100%" stop-color="#F8FAFC" stop-opacity="0.95" />
      </linearGradient>

      <!-- Badge Gradient -->
      <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#22c55e" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#16a34a" stop-opacity="0.05" />
      </linearGradient>

      <!-- Drop Shadow -->
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.5" />
      </filter>
    </defs>

    <!-- Main Background -->
    <rect width="1200" height="630" fill="url(#bgGrad)" />
    <rect width="1200" height="630" fill="url(#emeraldGlow)" />

    <!-- Subtle Tech Grid Lines -->
    <g opacity="0.07" stroke="#FFFFFF" stroke-width="1">
      <line x1="80" y1="0" x2="80" y2="630" />
      <line x1="1120" y1="0" x2="1120" y2="630" />
      <line x1="0" y1="80" x2="1200" y2="80" />
      <line x1="0" y1="550" x2="1200" y2="550" />
    </g>

    <!-- Top Accent Bar -->
    <rect x="0" y="0" width="1200" height="6" fill="#22c55e" />

    <!-- Center Floating Logo Card -->
    <rect x="330" y="70" width="540" height="170" rx="24" fill="url(#cardGrad)" filter="url(#shadow)" stroke="#E2E8F0" stroke-width="1.5" />

    <!-- Top Tagline Badge -->
    <g transform="translate(420, 275)">
      <rect x="0" y="0" width="360" height="34" rx="17" fill="url(#badgeGrad)" stroke="#22c55e" stroke-width="1.2" stroke-opacity="0.4" />
      <circle cx="18" cy="17" r="4" fill="#22c55e" />
      <text x="32" y="22" fill="#4ADE80" font-family="'Plus Jakarta Sans', Inter, -apple-system, sans-serif" font-size="12" font-weight="700" letter-spacing="1.5">POWER SOLUTIONS PLATFORM</text>
    </g>

    <!-- Main Headline -->
    <text x="600" y="375" text-anchor="middle" fill="#FFFFFF" font-family="'Plus Jakarta Sans', Inter, -apple-system, sans-serif" font-size="38" font-weight="800" letter-spacing="-0.5">
      Industrial Power Protection &amp; Technical Guidance
    </text>

    <!-- Subtitle / Categories -->
    <text x="600" y="425" text-anchor="middle" fill="#94A3B8" font-family="Inter, -apple-system, sans-serif" font-size="18" font-weight="500">
      Servo Stabilizers  •  Industrial Online UPS  •  Solar Solutions  •  Heavy-Duty Batteries
    </text>

    <!-- Chips row -->
    <g transform="translate(260, 470)">
      <!-- Chip 1 -->
      <rect x="0" y="0" width="190" height="42" rx="12" fill="#0F2847" stroke="#1E3A5F" stroke-width="1" />
      <text x="95" y="26" text-anchor="middle" fill="#E2E8F0" font-family="Inter, sans-serif" font-size="13" font-weight="600">⚡ High Precision Regulators</text>

      <!-- Chip 2 -->
      <rect x="210" y="0" width="220" height="42" rx="12" fill="#0F2847" stroke="#1E3A5F" stroke-width="1" />
      <text x="320" y="26" text-anchor="middle" fill="#E2E8F0" font-family="Inter, sans-serif" font-size="13" font-weight="600">🛡️ Authorized Dealer Network</text>

      <!-- Chip 3 -->
      <rect x="450" y="0" width="230" height="42" rx="12" fill="#0F2847" stroke="#1E3A5F" stroke-width="1" />
      <text x="565" y="26" text-anchor="middle" fill="#E2E8F0" font-family="Inter, sans-serif" font-size="13" font-weight="600">📍 Pan-India Engineering Support</text>
    </g>

    <!-- Footer URL -->
    <g transform="translate(600, 585)">
      <text x="0" y="0" text-anchor="middle" fill="#64748B" font-family="Inter, -apple-system, sans-serif" font-size="14" font-weight="600" letter-spacing="1">
        VOLTRIXSYSTEMS.COM  •  HYDERABAD, INDIA
      </text>
    </g>
  </svg>
  `;

  // Composite the SVG background with the official logo centered in the white card
  // Card is at x=330, y=70, width=540, height=170.
  // ogLogo is width 480, height ~181. Let's make sure it fits nicely inside (e.g. width: 440).
  const fittedOgLogo = await sharp(transparentLogo)
    .resize({ width: 440, height: 130, fit: 'inside' })
    .png()
    .toBuffer();

  const ogLogoMeta = await sharp(fittedOgLogo).metadata();
  const logoLeft = Math.round(330 + (540 - ogLogoMeta.width) / 2);
  const logoTop = Math.round(70 + (170 - ogLogoMeta.height) / 2);

  await sharp(Buffer.from(ogSvg))
    .composite([
      {
        input: fittedOgLogo,
        left: logoLeft,
        top: logoTop
      }
    ])
    .png({ quality: 95 })
    .toFile(path.join(PUBLIC_DIR, 'og-image.png'));

  console.log('✓ /public/og-image.png created successfully.');

  // --- 3. Generate Apple Touch Icon (180 x 180 px) ---
  console.log('Generating /public/apple-touch-icon.png (180x180)...');
  const appleIconSvg = `
  <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="appleBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0A2342" />
        <stop offset="100%" stop-color="#061221" />
      </linearGradient>
    </defs>
    <rect width="180" height="180" fill="url(#appleBg)" rx="40" />
    <rect x="2" y="2" width="176" height="176" rx="38" fill="none" stroke="#22c55e" stroke-width="2" stroke-opacity="0.3" />
  </svg>
  `;

  // Scale emblem to fit comfortably inside 180x180 with generous 24px padding (size: 130x130)
  const appleEmblem = await sharp(emblemBuf)
    .resize(126, 126, { fit: 'inside' })
    .png()
    .toBuffer();

  const appleMeta = await sharp(appleEmblem).metadata();
  const appleLeft = Math.round((180 - appleMeta.width) / 2);
  const appleTop = Math.round((180 - appleMeta.height) / 2);

  await sharp(Buffer.from(appleIconSvg))
    .composite([
      { input: appleEmblem, left: appleLeft, top: appleTop }
    ])
    .png()
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));

  console.log('✓ /public/apple-touch-icon.png created successfully.');

  // --- 4. Generate PWA Icons (192 x 192 and 512 x 512) ---
  console.log('Generating /public/icon-192.png & /public/icon-512.png...');

  for (const size of [192, 512]) {
    const pwaSvg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pwaBg${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0A2342" />
          <stop offset="100%" stop-color="#061221" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#pwaBg${size})" rx="${Math.round(size * 0.22)}" />
      <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${Math.round(size * 0.22 - 2)}" fill="none" stroke="#22c55e" stroke-width="${Math.max(2, Math.round(size * 0.01))}" stroke-opacity="0.3" />
    </svg>
    `;

    const emblemSize = Math.round(size * 0.68);
    const scaledEmblem = await sharp(emblemBuf)
      .resize(emblemSize, emblemSize, { fit: 'inside' })
      .png()
      .toBuffer();

    const m = await sharp(scaledEmblem).metadata();
    const l = Math.round((size - m.width) / 2);
    const t = Math.round((size - m.height) / 2);

    await sharp(Buffer.from(pwaSvg))
      .composite([{ input: scaledEmblem, left: l, top: t }])
      .png()
      .toFile(path.join(PUBLIC_DIR, `icon-${size}.png`));
  }
  console.log('✓ /public/icon-192.png and /public/icon-512.png created.');

  // --- 5. Generate Favicons: favicon.ico, favicon-32x32.png, favicon-16x16.png ---
  console.log('Generating /public/favicon-32x32.png and /public/favicon-16x16.png...');

  // 32x32 and 16x16 crisp emblem icons
  const fav32 = await sharp(emblemBuf)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-32x32.png'), fav32);

  const fav16 = await sharp(emblemBuf)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-16x16.png'), fav16);

  // Copy or build multi-resolution favicon.ico at root /public/favicon.ico
  // If favicon_io/favicon.ico exists, copy or replace it
  const existingIco = path.join(PUBLIC_DIR, 'favicon_io', 'favicon.ico');
  const targetIco = path.join(PUBLIC_DIR, 'favicon.ico');
  if (fs.existsSync(existingIco)) {
    fs.copyFileSync(existingIco, targetIco);
    console.log('✓ /public/favicon.ico populated from verified multi-resolution ICO.');
  }

  console.log('\nAll branding, favicon, OG, and PWA assets successfully generated!');
}

generateAssets().catch(err => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
