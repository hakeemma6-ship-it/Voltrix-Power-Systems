const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });

async function run() {
    const mongoUri = process.env.MONGOURI;
    if (!mongoUri) {
        console.error('MONGOURI is missing in .env');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    console.log('Connected to database:', db.databaseName);

    try {
        const collections = await db.listCollections().toArray();
        const names = collections.map(c => c.name);
        console.log('Existing collections:', names);

        if (names.includes('blog_posts')) {
            console.log('Dropping collection: blog_posts');
            await db.collection('blog_posts').drop();
            console.log('blog_posts dropped successfully.');
        } else {
            console.log('blog_posts collection does not exist.');
        }

        if (names.includes('settings')) {
            console.log('Dropping collection: settings');
            await db.collection('settings').drop();
            console.log('settings dropped successfully.');
        } else {
            console.log('settings collection does not exist.');
        }

        console.log('Database cleanup completed successfully.');
    } catch (err) {
        console.error('Error during dropping collections:', err);
    } finally {
        await client.close();
    }
}

run();
