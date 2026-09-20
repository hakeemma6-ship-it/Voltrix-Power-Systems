const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Verify Cloudinary credentials
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('[FATAL] Missing required Cloudinary credentials in .env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function getImagesFromDir(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const images = [];
  for (const entry of entries) {
    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        images.push({
          dir: dirPath,
          filename: entry.name,
          fullPath: path.join(dirPath, entry.name)
        });
      }
    }
  }
  return images;
}

async function uploadFile(img) {
  const parsed = path.parse(img.filename);
  const cleanId = parsed.name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
  const folder = 'voltrix_power_systems';

  console.log(`Uploading: ${img.filename} -> ${folder}/${cleanId}...`);
  try {
    const result = await cloudinary.uploader.upload(img.fullPath, {
      folder: folder,
      public_id: cleanId,
      overwrite: true,
      resource_type: 'image'
    });
    console.log(`  ✓ Uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.error(`  ✗ Error uploading ${img.filename}:`, err.message || err);
    return null;
  }
}

async function main() {
  const rootDir = path.join(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const publicImagesDir = path.join(publicDir, 'Images');
  const srcAssetsImagesDir = path.join(rootDir, 'src', 'assets', 'images');

  const allImages = [
    ...getImagesFromDir(publicImagesDir),
    ...getImagesFromDir(publicDir),
    ...getImagesFromDir(srcAssetsImagesDir)
  ];

  console.log(`Found total ${allImages.length} image files to process.`);

  // Load existing map if present to avoid redundant uploads or resume
  const mapFilePath = path.join(__dirname, 'uploaded-images-map.json');
  let urlMap = {};
  if (fs.existsSync(mapFilePath)) {
    try {
      urlMap = JSON.parse(fs.readFileSync(mapFilePath, 'utf8'));
    } catch (e) {}
  }

  // Upload each image
  for (const img of allImages) {
    // If already uploaded and URL valid, skip
    if (urlMap[img.filename]) {
      console.log(`Skipping already uploaded: ${img.filename}`);
      continue;
    }

    const secureUrl = await uploadFile(img);
    if (secureUrl) {
      urlMap[img.filename] = secureUrl;
      // Also register various variations for easy lookup
      urlMap[img.filename.toLowerCase()] = secureUrl;
      urlMap[`/Images/${img.filename}`] = secureUrl;
      urlMap[`/images/${img.filename}`] = secureUrl;
      urlMap[`Images/${img.filename}`] = secureUrl;
      urlMap[`images/${img.filename}`] = secureUrl;
      urlMap[`/${img.filename}`] = secureUrl;
      urlMap[img.filename] = secureUrl;

      // Persist incrementally
      fs.writeFileSync(mapFilePath, JSON.stringify(urlMap, null, 2), 'utf8');
    }
  }

  console.log('\nAll uploads finished. Generated map with', Object.keys(urlMap).length, 'entries.');
  console.log('Saved to:', mapFilePath);

  // Synchronize MongoDB collections
  if (process.env.MONGOURI) {
    console.log('\n[MongoDB] Updating database records with Cloudinary URLs...');
    try {
      const client = await MongoClient.connect(process.env.MONGOURI);
      const db = client.db();

      // 1. Settings logo & email
      const logoUrl = urlMap['logo.png'] || urlMap['Voltrix Logo.png'];
      if (logoUrl) {
        console.log(`[MongoDB] Updating company_settings logo -> ${logoUrl}`);
        await db.collection('settings').updateOne(
          { _id: 'company_settings' },
          { 
            $set: { 
              logo: logoUrl,
              email: 'voltrixpowersystems@gmail.com'
            } 
          },
          { upsert: false }
        );
      }

      // 2. Categories
      const categories = await db.collection('categories').find().toArray();
      for (const cat of categories) {
        let catModified = false;
        if (cat.products && Array.isArray(cat.products)) {
          for (const prod of cat.products) {
            if (prod.image) {
              const matchedUrl = findCloudinaryMatch(prod.image, prod.name, urlMap);
              if (matchedUrl && matchedUrl !== prod.image) {
                console.log(`[MongoDB] Updating category [${cat.name}] product [${prod.name}]: ${prod.image} -> ${matchedUrl}`);
                prod.image = matchedUrl;
                catModified = true;
              }
            }
          }
        }
        if (catModified) {
          await db.collection('categories').updateOne(
            { _id: cat._id },
            { $set: { products: cat.products } }
          );
        }
      }

      // 3. Products
      const products = await db.collection('products').find().toArray();
      for (const prod of products) {
        let prodModified = false;
        if (prod.image) {
          const matchedUrl = findCloudinaryMatch(prod.image, prod.name, urlMap);
          if (matchedUrl && matchedUrl !== prod.image) {
            console.log(`[MongoDB] Updating root product [${prod.name}]: ${prod.image} -> ${matchedUrl}`);
            prod.image = matchedUrl;
            prodModified = true;
          }
        }
        if (prod.subcategories && Array.isArray(prod.subcategories)) {
          for (const sub of prod.subcategories) {
            if (sub.image) {
              const matchedUrl = findCloudinaryMatch(sub.image, sub.name, urlMap);
              if (matchedUrl && matchedUrl !== sub.image) {
                console.log(`[MongoDB] Updating product [${prod.name}] subcategory [${sub.name}]: ${sub.image} -> ${matchedUrl}`);
                sub.image = matchedUrl;
                prodModified = true;
              }
            }
          }
        }
        if (prodModified) {
          await db.collection('products').updateOne(
            { _id: prod._id },
            { $set: { image: prod.image, subcategories: prod.subcategories } }
          );
        }
      }

      await client.close();
      console.log('[MongoDB] Database sync complete!');
    } catch (dbErr) {
      console.error('[MongoDB] Error updating database:', dbErr);
    }
  }
}

function findCloudinaryMatch(imagePath, name, urlMap) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://res.cloudinary.com') || imagePath.startsWith('https://res.cloudinary.com')) {
    return imagePath;
  }

  // Exact or normalized lookup
  const cleanPath = imagePath.trim();
  if (urlMap[cleanPath]) return urlMap[cleanPath];
  if (urlMap[cleanPath.toLowerCase()]) return urlMap[cleanPath.toLowerCase()];

  const base = path.basename(cleanPath);
  if (urlMap[base]) return urlMap[base];
  if (urlMap[base.toLowerCase()]) return urlMap[base.toLowerCase()];

  // Try matching by product name
  if (name) {
    const normName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, url] of Object.entries(urlMap)) {
      const normKey = path.parse(key).name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normKey && (normName.includes(normKey) || normKey.includes(normName))) {
        return url;
      }
    }
  }

  return null;
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
