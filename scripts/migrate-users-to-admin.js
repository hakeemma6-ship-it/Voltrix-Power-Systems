const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });

async function migrate() {
    const mongoUri = process.env.MONGOURI;
    if (!mongoUri) {
        console.error('ERROR: MONGOURI not found in env!');
        process.exit(1);
    }

    console.log('Connecting to database...');
    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        const db = client.db();
        console.log('Connected to:', db.databaseName);

        const collections = await db.listCollections().toArray();
        const hasUsers = collections.some(col => col.name === 'users');

        if (!hasUsers) {
            console.log("No legacy 'users' collection found. Database is already migrated or clean.");
            return;
        }

        const usersCount = await db.collection('users').countDocuments();
        console.log(`Found legacy 'users' collection with ${usersCount} documents.`);

        // Find all admin accounts from the users collection
        const admins = await db.collection('users').find({ role: 'admin' }).toArray();
        console.log(`Found ${admins.length} administrator accounts to migrate.`);

        if (admins.length > 0) {
            // Write them to Admin collection
            for (const admin of admins) {
                const adminId = admin.id || admin._id;
                await db.collection('Admin').replaceOne({ _id: adminId }, admin, { upsert: true });
                console.log(`Migrated admin: ${admin.email}`);
            }
        } else {
            console.log('No administrator accounts found in users.');
            // Seed a default admin in Admin collection if the new Admin collection is empty
            const adminCount = await db.collection('Admin').countDocuments();
            if (adminCount === 0) {
                const bcrypt = require('bcryptjs');
                const defaultPass = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';
                const hashAdmin = bcrypt.hashSync(defaultPass, 10);
                const defaultAdmin = {
                    id: 'u_admin',
                    _id: 'u_admin',
                    name: 'Operations Head',
                    email: 'admin@voltrixpower.com',
                    phone: '+91 99999 99999',
                    password: hashAdmin,
                    role: 'admin',
                    status: 'approved',
                    createdAt: new Date().toISOString()
                };
                await db.collection('Admin').insertOne(defaultAdmin);
                console.log('Seeded default administrator account into new Admin collection.');
            }
        }

        // Drop the old users collection
        await db.collection('users').drop();
        console.log("Successfully dropped legacy 'users' collection.");
        console.log('Migration complete!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.close();
    }
}

migrate();
