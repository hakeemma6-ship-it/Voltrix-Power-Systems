import { NextRequest, NextResponse } from 'next/server';
import { db, syncDatabaseOnBoot, persistWrite, persistDelete } from '@/lib/db';
import { requireRole } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    await syncDatabaseOnBoot();
    const { id } = await params;
    const product = db.products.find(p => p.id === id);
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: Params) {
    await syncDatabaseOnBoot();
    const authResult = requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    try {
        const body = await req.json();
        const index = db.products.findIndex(p => p.id === id);
        
        if (index === -1) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const updatedProduct = {
            ...db.products[index],
            ...body,
            id // Ensure ID cannot be changed
        };

        db.products[index] = updatedProduct;
        await persistWrite('products', id, updatedProduct);

        return NextResponse.json(updatedProduct);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    await syncDatabaseOnBoot();
    const authResult = requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    
    const index = db.products.findIndex(p => p.id === id);
    if (index === -1) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    db.products.splice(index, 1);
    if (persistDelete) {
        await persistDelete('products', id);
    }

    return NextResponse.json({ success: true });
}
