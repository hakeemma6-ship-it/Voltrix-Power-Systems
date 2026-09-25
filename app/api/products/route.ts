import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDb, persistWrite, isMongoReady, getMongoDb } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET() {
    await ensureDb();

    if (isMongoReady()) {
        const mongoDb = getMongoDb();
        try {
            const dbProds = await mongoDb.collection('products').find({}).toArray();
            const products = dbProds.map((p: any) => {
                const doc = { ...p };
                if (doc._id && typeof doc._id !== 'string') doc._id = doc._id.toString();
                if (!doc.id) doc.id = doc._id;
                return doc;
            });
            db.products = products;
            return NextResponse.json(products);
        } catch (e) {
            console.error('[Products API] MongoDB query error:', e);
            return NextResponse.json([]);
        }
    }

    return NextResponse.json(db.products || []);
}

export async function POST(req: NextRequest) {
    await ensureDb();
    const authResult = requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const body = await req.json();
        
        if (!body.name || !body.id) {
            return NextResponse.json({ error: 'Product name and id are required' }, { status: 400 });
        }

        const existing = db.products.find(p => p.id === body.id);
        if (existing) {
            return NextResponse.json({ error: 'Product with this ID already exists' }, { status: 400 });
        }

        const newProduct = {
            ...body,
            createdAt: new Date().toISOString()
        };

        db.products.push(newProduct);
        await persistWrite('products', newProduct.id, newProduct);

        return NextResponse.json(newProduct, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
