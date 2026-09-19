const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });

async function dropLogs() {
    const mongoUri = process.env.MONGOURI;
    if (!mongoUri) {
        console.error('MONGOURI not set.');
        process.exit(1);
    }
    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const db = client.db();
        const collections = await db.listCollections().toArray();
        if (collections.some(c => c.name === 'whatsapp_logs')) {
            await db.collection('whatsapp_logs').drop();
            console.log("Dropped legacy 'whatsapp_logs' collection from database.");
        } else {
            console.log("'whatsapp_logs' collection does not exist.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
dropLogs();
