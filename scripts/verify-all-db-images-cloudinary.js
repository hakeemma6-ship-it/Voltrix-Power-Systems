const { MongoClient } = require('mongodb');
require('dotenv').config();

async function check() {
  const client = await MongoClient.connect(process.env.MONGOURI);
  const db = client.db();

  let nonCloudinaryCount = 0;
  const cats = await db.collection('categories').find().toArray();
  for (const c of cats) {
    if (c.image && !c.image.includes('cloudinary')) {
      console.log('Non-cloudinary cat image:', c.name, c.image);
      nonCloudinaryCount++;
    }
    for (const p of c.products || []) {
      if (p.image && !p.image.includes('cloudinary')) {
        console.log('Non-cloudinary cat product image:', c.name, p.name, p.image);
        nonCloudinaryCount++;
      }
    }
  }

  const prods = await db.collection('products').find().toArray();
  for (const p of prods) {
    if (p.image && !p.image.includes('cloudinary')) {
      console.log('Non-cloudinary product image:', p.name, p.image);
      nonCloudinaryCount++;
    }
    for (const s of p.subcategories || []) {
      if (s.image && !s.image.includes('cloudinary')) {
        console.log('Non-cloudinary subcategory image:', p.name, s.name, s.image);
        nonCloudinaryCount++;
      }
    }
  }

  const settings = await db.collection('settings').findOne({ _id: 'company_settings' });
  if (settings.logo && !settings.logo.includes('cloudinary')) {
    console.log('Non-cloudinary settings logo:', settings.logo);
    nonCloudinaryCount++;
  }

  console.log(`\nTotal non-cloudinary images in MongoDB: ${nonCloudinaryCount}`);
  await client.close();
}

check().catch(console.error);
