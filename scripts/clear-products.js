const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });

async function clearProducts() {
  const uri = process.env.MONGOURI;
  if (!uri) {
    console.log('No MONGOURI in .env');
    return;
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('voltrix_db');
    await db.collection('products').drop();
    console.log('Products collection dropped successfully!');
  } catch (e) {
    if (e.code === 26) {
      console.log('Collection does not exist, nothing to drop.');
    } else {
      console.error(e);
    }
  } finally {
    await client.close();
  }
}

clearProducts();
