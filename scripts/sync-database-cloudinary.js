const { MongoClient } = require('mongodb');
require('dotenv').config();
const map = require('./uploaded-images-map.json');

async function sync() {
  const client = await MongoClient.connect(process.env.MONGOURI);
  const db = client.db();

  const imgMapping = {
    '/images/oil_cooled.jpeg': map['oil_cooled.jpeg'],
    'images/oil_cooled.jpeg': map['oil_cooled.jpeg'],
    '/images/3_0.png': map['3_0.png'],
    'images/3_0.png': map['3_0.png'],
    '/images/1_1.png': map['1_1.png'],
    'images/1_1.png': map['1_1.png'],
    '/images/cvt.png': map['cvt.png'],
    'images/cvt.png': map['cvt.png'],
    '/images/oil_3.png': map['oil_3.png'],
    'images/oil_3.png': map['oil_3.png'],
    '/Images/Oil Cooled Stabilizer.png': map['Oil Cooled Stabilizer.png'],
    'Images/Oil Cooled Stabilizer.png': map['Oil Cooled Stabilizer.png']
  };

  console.log('Mapping keys:', Object.keys(imgMapping));

  // 1. Categories
  const categories = await db.collection('categories').find({}).toArray();
  for (const cat of categories) {
    let changed = false;
    if (imgMapping[cat.image]) {
      console.log(`Updating cat ${cat.name} image: ${cat.image} -> ${imgMapping[cat.image]}`);
      cat.image = imgMapping[cat.image];
      changed = true;
    }
    if (cat.products && Array.isArray(cat.products)) {
      for (const p of cat.products) {
        if (imgMapping[p.image]) {
          console.log(`Updating cat ${cat.name} product ${p.name}: ${p.image} -> ${imgMapping[p.image]}`);
          p.image = imgMapping[p.image];
          changed = true;
        }
      }
    }
    if (changed) {
      const res = await db.collection('categories').updateOne(
        { _id: cat._id },
        { $set: { image: cat.image, products: cat.products } }
      );
      console.log(`Cat [${cat.name}] updated. Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);
    }
  }

  // 2. Products
  const prods = await db.collection('products').find({}).toArray();
  for (const prod of prods) {
    let changed = false;
    if (imgMapping[prod.image]) {
      console.log(`Updating prod ${prod.name} image: ${prod.image} -> ${imgMapping[prod.image]}`);
      prod.image = imgMapping[prod.image];
      changed = true;
    }
    if (prod.subcategories && Array.isArray(prod.subcategories)) {
      for (const s of prod.subcategories) {
        if (imgMapping[s.image]) {
          console.log(`Updating prod ${prod.name} sub ${s.name}: ${s.image} -> ${imgMapping[s.image]}`);
          s.image = imgMapping[s.image];
          changed = true;
        }
      }
    }
    if (changed) {
      const res = await db.collection('products').updateOne(
        { _id: prod._id },
        { $set: { image: prod.image, subcategories: prod.subcategories } }
      );
      console.log(`Prod [${prod.name}] updated. Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);
    }
  }

  // 3. Settings
  const logoUrl = map['logo.png'];
  if (logoUrl) {
    const sRes = await db.collection('settings').updateOne(
      { _id: 'company_settings' },
      { 
        $set: { 
          logo: logoUrl,
          email: 'voltrixpowersystems@gmail.com'
        } 
      }
    );
    console.log(`Settings updated. Matched: ${sRes.matchedCount}, Modified: ${sRes.modifiedCount}`);
  }

  await client.close();
  console.log('MongoDB sync completed successfully!');
}

sync().catch(console.error);
