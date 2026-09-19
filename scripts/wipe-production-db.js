const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });

async function wipeDatabase() {
    const mongoUri = process.env.MONGOURI;
    if (!mongoUri) {
        console.error('ERROR: MONGOURI not found in .env file!');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        const db = client.db();
        console.log('Connected to database:', db.databaseName);

        // Collections to fully wipe (active data)
        const collectionsToClear = [
            'customers',
            'dealers',
            'inquiries',
            'notifications',
            'chat_sessions',
            'visitor_stats',
            'assignment_history',
            'service_bookings',
            'deal_closures',
        ];

        for (const collName of collectionsToClear) {
            try {
                const res = await db.collection(collName).deleteMany({});
                console.log(`[WIPED] Collection '${collName}': deleted ${res.deletedCount} documents.`);
            } catch (e) {
                console.log(`[SKIP] Collection '${collName}' may not exist.`);
            }
        }

        // Drop obsolete collections entirely (quotations, invoices, orders, payments)
        const collectionsToDrop = ['quotations', 'invoices', 'orders', 'payments'];
        for (const collName of collectionsToDrop) {
            try {
                const collections = await db.listCollections({ name: collName }).toArray();
                if (collections.length > 0) {
                    await db.collection(collName).drop();
                    console.log(`[DROPPED] Collection '${collName}' dropped from MongoDB.`);
                } else {
                    console.log(`[SKIP] Collection '${collName}' does not exist.`);
                }
            } catch (e) {
                console.log(`[SKIP] Could not drop '${collName}': ${e.message}`);
            }
        }

        // Clean Admin collection except admin
        const userRes = await db.collection('Admin').deleteMany({ role: { $ne: 'admin' } });
        console.log(`[WIPED] Collection 'Admin' (non-admin accounts): deleted ${userRes.deletedCount} documents.`);

        console.log('\n✅ ALL DATABASE DATA SUCCESSFULLY WIPED FOR PRODUCTION DEPLOYMENT.');
        console.log('✅ Obsolete collections (quotations, invoices, orders, payments) DROPPED.');
    } catch (err) {
        console.error('Wipe database failed:', err);
    } finally {
        await client.close();
        process.exit(0);
    }
}

wipeDatabase();
