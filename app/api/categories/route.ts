/**
 * GET /api/categories — Fetch all categories with their products directly from MongoDB
 */
import { NextResponse } from 'next/server';
import { db, ensureDb, isMongoReady, getMongoDb } from '@/lib/db';

export async function GET() {
    await ensureDb();

    let categories: any[] = [];
    let products: any[] = [];

    if (isMongoReady()) {
        const mongoDb = getMongoDb();
        try {
            const [dbCats, dbProds] = await Promise.all([
                mongoDb.collection('categories').find({}).toArray(),
                mongoDb.collection('products').find({}).toArray()
            ]);

            categories = dbCats.map((c: any) => {
                const doc = { ...c };
                if (doc._id && typeof doc._id !== 'string') doc._id = doc._id.toString();
                if (!doc.id) doc.id = doc._id;
                return doc;
            });

            products = dbProds.map((p: any) => {
                const doc = { ...p };
                if (doc._id && typeof doc._id !== 'string') doc._id = doc._id.toString();
                if (!doc.id) doc.id = doc._id;
                return doc;
            });

            // Update in-memory sync cache
            db.categories = categories;
            db.products = products;
        } catch (err) {
            console.error('[Categories API] MongoDB query error:', err);
            categories = db.categories || [];
            products = db.products || [];
        }
    } else {
        categories = db.categories || [];
        products = db.products || [];
    }

    // Merge products into categories dynamically ONLY from the products collection
    const categoriesWithProducts = categories.map((cat: any) => {
        const matchingProducts = products.filter(
            p => p.categoryId === cat.id || 
                 p.categoryId === cat._id || 
                 (p.category && cat.name && p.category.trim().toLowerCase() === cat.name.trim().toLowerCase()) ||
                 (p.category && cat.slug && p.category.trim().toLowerCase() === cat.slug.trim().toLowerCase())
        );
        return {
            ...cat,
            products: matchingProducts
        };
    });

    return NextResponse.json(categoriesWithProducts);
}
