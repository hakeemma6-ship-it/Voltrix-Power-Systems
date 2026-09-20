const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const client = await MongoClient.connect(process.env.MONGOURI);
  const db = client.db();
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    const docs = await db.collection(c.name).find().toArray();
    let localCount = 0;
    const jsonStr = JSON.stringify(docs);
    const matches = jsonStr.match(/\/images\/|\/Images\/|\.png|\.jpg|\.jpeg/gi) || [];
    console.log(`${c.name}: ${docs.length} docs (image ref matches: ${matches.length})`);
    if (c.name === 'settings') {
      console.log('Settings:', docs);
    }
  }
  await client.close();
}

run().catch(console.error);
