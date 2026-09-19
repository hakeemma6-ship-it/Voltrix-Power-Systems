/**
 * POST /api/reset-db — Reset all runtime testing data (Customers, Dealers, Inquiries, Notifications, Deal Closures, Chat Sessions)
 * Also drops obsolete collections (quotations, invoices, orders, payments) from MongoDB.
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db, getMongoDb, isMongoReady, syncDatabaseOnBoot } from '@/lib/db';

import { requireRole } from '@/lib/auth';

export async function POST(req: NextRequest) {
    // Disable in production for deployment safety
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Development APIs and reset endpoints are disabled in production environment.' },
            { status: 403 }
        );
    }

    // Require admin authentication
    const authResult = requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) {
        return authResult;
    }

    const confirmHeader = req.headers.get('x-reset-confirmation');
    if (confirmHeader !== 'CONFIRM_RESET_ALL_DATA') {
        return NextResponse.json(
            { error: 'Missing or invalid confirmation header. Required: X-Reset-Confirmation: CONFIRM_RESET_ALL_DATA' },
            { status: 400 }
        );
    }

    return handleReset(req);
}

async function handleReset(req: NextRequest) {
    try {
        await syncDatabaseOnBoot();

        // 1. Reset in-memory database singletons
        db.customers = [];
        db.dealers = [];
        db.inquiries = [];
        db.notifications = [];
        db.chatSessions = [];
        db.deal_closures = [];
        if (db.users && Array.isArray(db.users)) {
            db.users = db.users.filter((u: any) => u.role === 'admin');
        }

        // 2. Clear uploaded invoice files from disk
        try {
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'invoices');
            if (fs.existsSync(uploadsDir)) {
                const files = fs.readdirSync(uploadsDir);
                for (const file of files) {
                    try {
                        fs.unlinkSync(path.join(uploadsDir, file));
                    } catch { }
                }
            }
        } catch { }

        // 3. Clear MongoDB collections if connected
        const mongoDb = getMongoDb();
        if (isMongoReady() && mongoDb) {
            await Promise.all([
                mongoDb.collection('customers').deleteMany({}),
                mongoDb.collection('dealers').deleteMany({}),
                mongoDb.collection('inquiries').deleteMany({}),
                mongoDb.collection('notifications').deleteMany({}),
                mongoDb.collection('chat_sessions').deleteMany({}),
                mongoDb.collection('visitor_stats').deleteMany({}),
                mongoDb.collection('assignment_history').deleteMany({}),
                mongoDb.collection('service_bookings').deleteMany({}),
                mongoDb.collection('deal_closures').deleteMany({}),
                mongoDb.collection('Admin').deleteMany({ role: { $ne: 'admin' } }),
            ]);

            // Drop obsolete collections entirely
            const obsolete = ['quotations', 'invoices', 'orders', 'payments'];
            for (const collName of obsolete) {
                try {
                    const exists = await mongoDb.listCollections({ name: collName }).toArray();
                    if (exists.length > 0) {
                        await mongoDb.collection(collName).drop();
                        console.log(`[RESET-DB] Dropped obsolete collection: '${collName}'`);
                    }
                } catch { /* collection may not exist */ }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'All Customers, Dealers, Inquiries, Deal Closures, Notifications, Orders, and Invoices have been cleared. Products and categories data kept intact.',
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[RESET DB ERROR]:', error);
        return NextResponse.json({ error: error.message || 'Failed to reset database.' }, { status: 500 });
    }
}
