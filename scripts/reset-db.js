const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });

async function resetDb() {
  const uri = process.env.MONGOURI;
  if (!uri) {
    console.log('No MONGOURI found in .env');
    return;
  }
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    
    // Connect to the default db specified in the URI (e.g. "Voltrix")
    const db = client.db();
    
    console.log(`Connected to database: ${db.databaseName}`);
    
    // Drop the entire database
    await db.dropDatabase();
    
    console.log(`Database '${db.databaseName}' has been completely dropped and reset.`);
  } catch (e) {
    console.error('Failed to reset database:', e);
  } finally {
    await client.close();
  }
}

resetDb();
