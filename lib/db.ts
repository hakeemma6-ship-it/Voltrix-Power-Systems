/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * lib/db.ts — Shared in-memory database singleton for Next.js API routes.
 * This file replaces the in-process `db` object from the old Express server.ts.
 * It is imported by all API route handlers. The global singleton pattern
 * ensures the same object reference survives hot-reloads in dev mode.
 */

import { MongoClient, ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { BLOG_POSTS, GENERAL_FAQS } from '@/data';
import type { Dealer, Inquiry, Customer } from '@/types';
import { uploadToCloudinary } from './cloudinary';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DbShape = {
    dealers: Dealer[];
    customers: Customer[];
    inquiries: Inquiry[];
    users: any[];
    notifications: any[];
    products: any[];
    categories: any[];
    blogPosts: any[];
    faqs: any[];
    chatSessions: any[];
    deal_closures: any[];
    settings: any[];
};

export interface VoltrixDbState {
    promise: Promise<void> | null;
    ready: boolean;
    lastError: string | null;
    lastConnectedAt: number | null;
}

// ─── Global singleton (survives Next.js hot reloads) ─────────────────────────

declare global {
    // eslint-disable-next-line no-var
    var __voltrix_db: DbShape | undefined;
    var __voltrix_mongoClient: MongoClient | null;
    var __voltrix_mongoDb: any;
    var __voltrix_useMongo: boolean;
    var __voltrix_dbReady: boolean;
    var __voltrix_dbState: VoltrixDbState | undefined;
    var __voltrixVisitorStats: Record<string, { path: string; views: number; lastVisitedAt: string }>;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_DB: DbShape = {
    chatSessions: [],
    dealers: [],
    customers: [],
    inquiries: [],
    users: [],
    notifications: [],
    products: [],
    categories: [],
    blogPosts: BLOG_POSTS,
    faqs: GENERAL_FAQS,
    deal_closures: [],
    settings: [{
        id: 'company_settings',
        companyName: 'Voltrix Power Systems',
        logo: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866628/voltrix_power_systems/logo.png',
        address: '4-15 Shop No. 5, X Road, Opp. Bata, Gandi Maisamma, Hyderabad - 500043',
        phone: '+91 90323 72136 | +91 73867 10160',
        email: 'voltrixpowersystems@gmail.com',
        gstin: '36AEPPI5022R1ZY',
        state: 'Telangana',
        stateCode: '36',
        bankName: 'HDFC Bank',
        accountNumber: '50200088998811',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Voltrix Power Systems',
        branch: 'Gandi Maisamma Branch',
        upiId: 'voltrix@hdfcbank'
    }],
};

// ─── Initialise singleton ─────────────────────────────────────────────────────

if (!global.__voltrix_db) {
    global.__voltrix_db = JSON.parse(JSON.stringify(SEED_DB)); // deep clone seed
    global.__voltrix_mongoClient = null;
    global.__voltrix_mongoDb = null;
    global.__voltrix_useMongo = false;
    global.__voltrix_dbReady = false;
    global.__voltrix_dbState = {
        promise: null,
        ready: false,
        lastError: null,
        lastConnectedAt: null,
    };
    global.__voltrixVisitorStats = {};
}
if (!global.__voltrix_dbState) {
    global.__voltrix_dbState = {
        promise: null,
        ready: false,
        lastError: null,
        lastConnectedAt: null,
    };
}

export const db: DbShape = global.__voltrix_db!;
if (db) {
    if (!db.categories) {
        db.categories = [];
    }
    if (!db.products) {
        db.products = [];
    }
    if (!db.deal_closures) {
        db.deal_closures = [];
    }
    if (!db.settings || db.settings.length === 0) {
        db.settings = [{
            id: 'company_settings',
            companyName: 'Voltrix Power Systems',
            logo: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866628/voltrix_power_systems/logo.png',
            address: '4-15 Shop No. 5, X Road, Opp. Bata, Gandi Maisamma, Hyderabad - 500043',
            phone: '+91 90323 72136 | +91 73867 10160',
            email: 'voltrixpowersystems@gmail.com',
            gstin: '36AEPPI5022R1ZY',
            state: 'Telangana',
            stateCode: '36',
            bankName: 'HDFC Bank',
            accountNumber: '50200088998811',
            ifscCode: 'HDFC0001234',
            accountHolderName: 'Voltrix Power Systems',
            branch: 'Gandi Maisamma Branch',
            upiId: 'voltrix@hdfcbank'
        }];
    }
}
export const visitorStatsCache: Record<string, { path: string; views: number; lastVisitedAt: string }> = global.__voltrixVisitorStats;
export const getMongoDb = () => global.__voltrix_mongoDb;
export const isMongoReady = () => global.__voltrix_useMongo && !!global.__voltrix_mongoDb;

/**
 * Safely escapes regular expression special characters to prevent NoSQL/RegExp injection.
 */
export function escapeRegExp(str: any): string {
    if (typeof str !== 'string') return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Deduplication helper ─────────────────────────────────────────────────────

export function deduplicateDealers(dealersList: any[]): any[] {
    if (!dealersList || !Array.isArray(dealersList)) return [];
    const groups: Record<string, any[]> = {};
    for (const dealer of dealersList) {
        if (!dealer) continue;
        const key = (dealer.email || '').toLowerCase().trim();
        if (!key) continue;
        if (!groups[key]) groups[key] = [];
        groups[key].push(dealer);
    }
    const result: any[] = [];
    for (const key in groups) {
        const list = groups[key];
        if (list.length === 1) { result.push(list[0]); continue; }
        list.sort((a, b) => {
            const order: any = { approved: 3, pending: 2, rejected: 1 };
            return (order[b.status] || 0) - (order[a.status] || 0);
        });
        const primary = { ...list[0] };
        for (let i = 1; i < list.length; i++) {
            const dup = list[i];
            if (dup.notes) primary.notes = [...(primary.notes || []), ...dup.notes];
            if (dup.whatsappLogs) primary.whatsappLogs = [...(primary.whatsappLogs || []), ...dup.whatsappLogs];
            primary.phone = primary.phone || dup.phone;
            primary.gstin = primary.gstin || dup.gstin;
            if (primary.commissionPercentage === undefined || primary.commissionPercentage === null || primary.commissionPercentage === 0) {
                if (dup.commissionPercentage !== undefined && dup.commissionPercentage !== null && dup.commissionPercentage > 0) {
                    primary.commissionPercentage = dup.commissionPercentage;
                }
            }
            if (primary.perCustomerAssignmentFee === undefined || primary.perCustomerAssignmentFee === null || primary.perCustomerAssignmentFee === 0) {
                if (dup.perCustomerAssignmentFee !== undefined && dup.perCustomerAssignmentFee !== null && dup.perCustomerAssignmentFee > 0) {
                    primary.perCustomerAssignmentFee = dup.perCustomerAssignmentFee;
                }
            }
        }
        result.push(primary);
    }
    return result;
}
export function deduplicateCustomers(customersList: any[]): any[] {
    if (!customersList || !Array.isArray(customersList)) return [];
    const uniqueCustomers: any[] = [];
    for (const c of customersList) {
        if (!c) continue;
        const emailKey = c.email ? c.email.toLowerCase().trim() : '';
        const phoneKey = c.phone ? c.phone.trim() : '';

        // If email or phone is already seen, merge them
        let existing = uniqueCustomers.find(existing =>
            (emailKey && existing.email && existing.email.toLowerCase().trim() === emailKey) ||
            (phoneKey && existing.phone && existing.phone.trim() === phoneKey)
        );

        if (existing) {
            if (c.hasLogin) existing.hasLogin = true;
            if (c.linkedInquiryId && !existing.linkedInquiryId) existing.linkedInquiryId = c.linkedInquiryId;
            if (c.assignedDealerId && !existing.assignedDealerId) {
                existing.assignedDealerId = c.assignedDealerId;
                existing.assignedDealerName = c.assignedDealerName;
            }
            if (c.status !== 'new' && existing.status === 'new') {
                existing.status = c.status;
            }
            if (c.assignedDealers && Array.isArray(c.assignedDealers)) {
                if (!existing.assignedDealers) {
                    existing.assignedDealers = c.assignedDealers;
                } else {
                    const existingDealersMap = new Map(existing.assignedDealers.map((d: any) => [d.id, d]));
                    c.assignedDealers.forEach((d: any) => {
                        if (!existingDealersMap.has(d.id)) {
                            existing.assignedDealers.push(d);
                        }
                    });
                }
            }
            if (c.notes && c.notes.length > (existing.notes || '').length) {
                existing.notes = c.notes;
            }
            if (c.invoiceNumber && !existing.invoiceNumber) {
                existing.invoiceNumber = c.invoiceNumber;
            }
            if (c.purchaseDate && !existing.purchaseDate) {
                existing.purchaseDate = c.purchaseDate;
            }
            if (c.createdAt && new Date(c.createdAt) < new Date(existing.createdAt)) {
                existing.createdAt = c.createdAt;
            }
        } else {
            uniqueCustomers.push({ ...c });
        }
    }
    return uniqueCustomers;
}

// ─── Persist write to MongoDB ─────────────────────────────────────────────────

export async function persistWrite(collectionName: string, docId: string, data: any) {
    const mongoDb = getMongoDb();
    if (!isMongoReady() || !mongoDb) return;
    const targetCollection = collectionName === 'users' ? 'Admin' : collectionName;
    const writeData = { ...data, id: docId, _id: docId };
    try {
        const idFilter: any[] = [{ _id: docId }, { id: docId }];
        if (typeof docId === 'string' && /^[0-9a-fA-F]{24}$/.test(docId)) {
            try {
                idFilter.push({ _id: new ObjectId(docId) });
            } catch { }
        }
        if (data.email) {
            idFilter.push({ email: data.email.toLowerCase() });
        }
        await mongoDb.collection(targetCollection).updateOne(
            { $or: idFilter },
            { $set: writeData },
            { upsert: true }
        );
    } catch (e) {
        console.error(`[persistWrite] Failed for collection '${targetCollection}':`, e);
    }
}

/**
 * Non-blocking asynchronous database write for high-throughput or non-critical records
 * (e.g., visitor telemetry, activity logs, notification state) to prevent blocking user requests.
 */
export function persistWriteAsync(collectionName: string, docId: string, data: any): void {
    persistWrite(collectionName, docId, data).catch((e) => {
        console.error(`[persistWriteAsync] Background write failed for collection '${collectionName}':`, e);
    });
}

export async function persistDelete(collectionName: string, docId: string) {
    const mongoDb = getMongoDb();
    if (!isMongoReady() || !mongoDb) return;
    const targetCollection = collectionName === 'users' ? 'Admin' : collectionName;
    try {
        await mongoDb.collection(targetCollection).deleteOne({ _id: docId });
    } catch (e) {
        console.error(`[persistDelete] Failed for collection '${targetCollection}':`, e);
    }
}

// ─── (Invoice/Quotation functions removed) ────────────────────────────────────

// Quotations and invoices have been removed from this platform.
// Keeping this stub to avoid breaking any stale imports during transition.
export async function ensurePersistentInvoice(_invoiceId: string): Promise<null> {
    return null;
}


// ─── Refactored Database Lifecycle & Connection Management ────────────────────

/**
 * 1. initDbConnection()
 * Pure MongoDB / Mongoose connection pooling.
 * Reuses active connections, sets connection limits. Zero collection scans or migrations.
 */
export async function initDbConnection(): Promise<void> {
    const mongoUri = process.env.MONGOURI;
    if (!mongoUri) {
        console.warn('[DB] No MONGOURI provided. Running in memory-only mode.');
        return;
    }

    if (global.__voltrix_mongoClient && global.__voltrix_mongoDb && isMongoReady()) {
        return;
    }

    try {
        console.log('[DB] Connecting to MongoDB pool...');
        const client = await MongoClient.connect(mongoUri, {
            connectTimeoutMS: 5000,
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 20,
            minPoolSize: 2,
        });

        global.__voltrix_mongoClient = client;
        global.__voltrix_mongoDb = client.db();
        global.__voltrix_useMongo = true;
        console.log('[DB] MongoDB client connected successfully.');

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(mongoUri);
            console.log('[DB] Mongoose connected successfully.');
        }
    } catch (err: any) {
        console.error('[DB] MongoDB connection failed:', err.message);
        global.__voltrix_useMongo = false;
        throw err;
    }
}

/**
 * 2. ensureAdminUser()
 * Targeted, idempotent admin seeding. Uses findOne() instead of scanning tables.
 */
export async function ensureAdminUser(): Promise<void> {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@voltrixpower.com').trim().toLowerCase();
    const isProd = process.env.NODE_ENV === 'production';
    const adminPass = process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

    if (!adminPass) {
        console.warn('[DB] ADMIN_PASSWORD environment variable is not defined; skipping automatic admin creation.');
        return;
    }

    const hashAdmin = bcrypt.hashSync(adminPass, 10);
    const adminUser = {
        id: 'u_admin',
        _id: 'u_admin',
        name: 'Operations Head',
        email: adminEmail,
        phone: process.env.WHATSAPP_ADMIN_PHONE || '+91 90323 72136',
        password: hashAdmin,
        role: 'admin',
        status: 'approved',
        createdAt: new Date().toISOString()
    };

    if (!db.users || db.users.length === 0) {
        db.users = [adminUser];
    } else {
        const found = db.users.find((u: any) => u.email?.toLowerCase() === adminEmail);
        if (!found) db.users.push(adminUser);
    }

    const mongoDb = getMongoDb();
    if (isMongoReady() && mongoDb) {
        try {
            const existing = await mongoDb.collection('Admin').findOne({ email: adminEmail });
            if (!existing) {
                await mongoDb.collection('Admin').insertOne(adminUser);
                console.log('[DB] Admin user seeded in MongoDB.');
            }
        } catch (err: any) {
            console.warn('[DB] Non-blocking warn: Admin seeding check:', err.message);
        }
    }
}

/**
 * 3. ensureIndexes()
 * Background index management. Executed once during maintenance, never during request handling.
 */
export async function ensureIndexes(): Promise<void> {
    const mongoDb = getMongoDb();
    if (!isMongoReady() || !mongoDb) return;

    try {
        console.log('[DB] Verifying query indexes in background...');
        await Promise.allSettled([
            mongoDb.collection('Admin').createIndex({ email: 1 }, { unique: true, sparse: true }),
            mongoDb.collection('dealers').createIndex({ email: 1 }, { unique: true, sparse: true }),
            mongoDb.collection('dealers').createIndex({ phone: 1 }),
            mongoDb.collection('inquiries').createIndex({ email: 1 }),
            mongoDb.collection('inquiries').createIndex({ phone: 1 }),
            mongoDb.collection('inquiries').createIndex({ assignedDealerId: 1 }),
            mongoDb.collection('inquiries').createIndex({ status: 1 }),
            mongoDb.collection('chat_sessions').createIndex({ id: 1 }),
            mongoDb.collection('chat_sessions').createIndex({ userEmail: 1 }),
            mongoDb.collection('customers').createIndex({ email: 1 }),
            mongoDb.collection('customers').createIndex({ phone: 1 }),
            mongoDb.collection('deal_closures').createIndex({ dealerId: 1 }),
            mongoDb.collection('deal_closures').createIndex({ customerId: 1 }),
            mongoDb.collection('visitor_stats').createIndex({ path: 1 }),
            mongoDb.collection('notifications').createIndex({ createdAt: 1 })
        ]);
        console.log('[DB] Query indexes verified.');
    } catch (idxErr: any) {
        console.warn('[DB] Non-blocking warn: Index verification:', idxErr.message);
    }
}

/**
 * 4. runMigrations()
 * Idempotent, safe database migrations.
 * Verifies current state before mutating data; avoids destructive delete/reinsert passes.
 */
export async function runMigrations(): Promise<void> {
    const mongoDb = getMongoDb();
    if (!isMongoReady() || !mongoDb) return;

    try {
        // Migration 1: Pre-load visitor stats into cache
        try {
            const stats = await mongoDb.collection('visitor_stats').find({}).toArray();
            stats.forEach((doc: any) => {
                if (doc.path) visitorStatsCache[doc.path] = doc;
            });
        } catch { }

    } catch (migErr: any) {
        console.warn('[DB Migration] Non-blocking migration warning:', migErr.message);
    }
}

/**
 * 5. runBackgroundMaintenance()
 * Non-critical background maintenance tasks (indexes, migrations, image repairs, cleanup).
 * Completely isolated from user HTTP traffic.
 */
export async function runBackgroundMaintenance(): Promise<void> {
    try {
        await ensureIndexes();
        await runMigrations();
        await cleanupOldNotifications().catch(err => console.warn('[DB] Cleanup warning:', err.message));
        await syncImagesToCloudinaryInBackground().catch(err => console.warn('[Cloudinary] Sync warning:', err.message));
        console.log('[DB] Background maintenance routine complete.');
    } catch (err: any) {
        console.error('[DB] Background maintenance error:', err.message);
    }
}

/**
 * 6. bootstrapDatabase()
 * Executed once at server startup (via instrumentation.ts).
 * Establishes connections, ensures admin user, and triggers async maintenance.
 * Does NOT perform full collection scans or block API requests.
 */
export async function bootstrapDatabase(): Promise<void> {
    if (!global.__voltrix_dbState) {
        global.__voltrix_dbState = {
            promise: null,
            ready: false,
            lastError: null,
            lastConnectedAt: null,
        };
    }
    const state = global.__voltrix_dbState;
    if (state.ready) return;

    if (state.promise) return state.promise;

    state.promise = (async () => {
        try {
            await initDbConnection();
            await ensureAdminUser();

            // Load categories and products directly from MongoDB collections (Single Source of Truth)
            const mongoDb = getMongoDb();
            if (isMongoReady() && mongoDb) {
                const [dbCats, dbProds] = await Promise.all([
                    mongoDb.collection('categories').find({}).toArray(),
                    mongoDb.collection('products').find({}).toArray()
                ]);
                db.categories = dbCats.map((c: any) => {
                    const doc = { ...c };
                    if (doc._id && typeof doc._id !== 'string') doc._id = doc._id.toString();
                    if (!doc.id) doc.id = doc._id;
                    return doc;
                });
                db.products = dbProds.map((p: any) => {
                    const doc = { ...p };
                    if (doc._id && typeof doc._id !== 'string') doc._id = doc._id.toString();
                    if (!doc.id) doc.id = doc._id;
                    return doc;
                });
                console.log(`[DB] Loaded ${db.categories.length} categories and ${db.products.length} products directly from MongoDB.`);
            }

            state.ready = true;
            global.__voltrix_dbReady = true;
            state.lastConnectedAt = Date.now();
            state.lastError = null;
            console.log('[DB] Database bootstrap complete. Ready for API requests.');

            // Schedule non-blocking background maintenance tasks
            setTimeout(() => {
                runBackgroundMaintenance().catch(err => {
                    console.error('[DB] Scheduled maintenance failed:', err.message);
                });
            }, 1000);
        } catch (err: any) {
            state.ready = false;
            global.__voltrix_dbReady = false;
            state.lastError = err.message || String(err);
            console.error('[DB] Database bootstrap failed:', state.lastError);
            throw err;
        } finally {
            state.promise = null; // Clear so subsequent retries can run if failed
        }
    })();

    return state.promise;
}

/**
 * 7. ensureDb()
 * Ultra-lightweight request-level connection guard.
 * Returns in 0ms if the database is already ready.
 * Deduplicates concurrent connection attempts across all requests.
 */
export async function ensureDb(): Promise<void> {
    if (!global.__voltrix_dbState) {
        global.__voltrix_dbState = {
            promise: null,
            ready: false,
            lastError: null,
            lastConnectedAt: null,
        };
    }
    const state = global.__voltrix_dbState;
    // Fast-path: 0ms overhead for all normal API requests
    if (state.ready || global.__voltrix_dbReady) return;

    // Await ongoing connection if in-flight
    if (state.promise) return state.promise;

    // If not ready and not connecting, trigger bootstrap
    return bootstrapDatabase();
}

/**
 * Backward-compatibility alias for all existing API routes.
 * Simply routes to ensureDb().
 */
export async function syncDatabaseOnBoot(): Promise<void> {
    return ensureDb();
}

/**
 * Ensures the database connection and in-memory caches are initialized.
 * Reuses the existing promise/state to prevent redundant boot passes.
 */
export async function ensureDbConnected(): Promise<void> {
    return ensureDb();
}

/**
 * Asynchronous background job to synchronize category and product images to Cloudinary.
 * Runs non-blockingly after database startup so API routes respond instantly.
 */
async function syncImagesToCloudinaryInBackground(): Promise<void> {
    const mongoDb = getMongoDb();
    if (!isMongoReady() || !mongoDb) return;
    try {
        console.log('[Cloudinary] Checking and syncing category/product images in background...');

        // 1. Sync category images & their internal products
        for (let i = 0; i < db.categories.length; i++) {
            const cat = db.categories[i];

            // Main category image
            if (cat.image && !cat.image.includes('res.cloudinary.com/a6ppmzjz')) {
                console.log(`[Cloudinary] Syncing category image: ${cat.slug}`);
                const cloudUrl = await uploadToCloudinary(cat.image, `category_${cat.slug}`);
                if (cloudUrl) {
                    cat.image = cloudUrl;
                    if (isMongoReady() && mongoDb) {
                        await mongoDb.collection('categories').updateOne({ _id: cat.id }, { $set: { image: cloudUrl } });
                    }
                }
            }

            // Products inside category
            if (cat.products && Array.isArray(cat.products)) {
                let changed = false;
                for (let j = 0; j < cat.products.length; j++) {
                    const prod = cat.products[j];
                    if (prod.image && !prod.image.includes('res.cloudinary.com/a6ppmzjz')) {
                        console.log(`[Cloudinary] Syncing category product image: ${prod.id}`);
                        const cloudUrl = await uploadToCloudinary(prod.image, `product_${prod.id}`);
                        if (cloudUrl) {
                            prod.image = cloudUrl;
                            changed = true;
                        }
                    }
                }
                if (changed && isMongoReady() && mongoDb) {
                    await mongoDb.collection('categories').updateOne({ _id: cat.id }, { $set: { products: cat.products } });
                }
            }
        }

        // 2. Sync flat products database list
        for (let i = 0; i < db.products.length; i++) {
            const prod = db.products[i];
            if (prod.image && !prod.image.includes('res.cloudinary.com/a6ppmzjz')) {
                console.log(`[Cloudinary] Syncing flat product catalog image: ${prod.id}`);
                const cloudUrl = await uploadToCloudinary(prod.image, `product_${prod.id}`);
                if (cloudUrl) {
                    prod.image = cloudUrl;
                    if (isMongoReady() && mongoDb) {
                        await mongoDb.collection('products').updateOne({ _id: prod.id }, { $set: { image: cloudUrl } });
                    }
                }
            }
        }
        console.log('[Cloudinary] Background synchronization complete.');
    } catch (imageSyncErr: any) {
        console.error('[Cloudinary] Background sync on boot failed:', imageSyncErr.message || imageSyncErr);
    }
}

export async function cleanupOldNotifications(): Promise<void> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoMs = threeDaysAgo.getTime();

    // 1. Clean in-memory db.notifications
    const origNotificationsCount = db.notifications.length;
    db.notifications = db.notifications.filter((n: any) => {
        const dateStr = n.createdAt || n.timestamp;
        if (!dateStr) return true;
        const val = new Date(dateStr).getTime();
        return isNaN(val) ? true : val >= threeDaysAgoMs;
    });

    const deletedGlobalCount = origNotificationsCount - db.notifications.length;
    if (deletedGlobalCount > 0) {
        console.log(`[DB Notification Cleanup] Removed ${deletedGlobalCount} global notifications older than 3 days.`);
    }

    // 2. Clean in-memory inquiry-specific notifications
    let inquiriesUpdatedCount = 0;
    db.inquiries.forEach((inq: any) => {
        if (inq.notifications && Array.isArray(inq.notifications)) {
            const origLen = inq.notifications.length;
            inq.notifications = inq.notifications.filter((n: any) => {
                const dateStr = n.timestamp || n.createdAt;
                if (!dateStr) return true;
                const val = new Date(dateStr).getTime();
                return isNaN(val) ? true : val >= threeDaysAgoMs;
            });
            if (inq.notifications.length !== origLen) {
                inquiriesUpdatedCount++;
                persistWrite('inquiries', inq.id, inq);
            }
        }
    });

    if (inquiriesUpdatedCount > 0) {
        console.log(`[DB Notification Cleanup] Cleaned up inquiry-specific notifications for ${inquiriesUpdatedCount} inquiries.`);
    }

    // 3. Delete from MongoDB collection 'notifications'
    const mongoDb = getMongoDb();
    if (isMongoReady() && mongoDb) {
        try {
            const res = await mongoDb.collection('notifications').deleteMany({
                $or: [
                    { createdAt: { $lt: threeDaysAgo.toISOString() } },
                    { timestamp: { $lt: threeDaysAgo.toISOString() } }
                ]
            });
            if (res.deletedCount && res.deletedCount > 0) {
                console.log(`[DB Notification Cleanup] MongoDB: Deleted ${res.deletedCount} global notifications older than 3 days.`);
            }
        } catch (mongoErr: any) {
            console.error('[DB Notification Cleanup] MongoDB deletion errored:', mongoErr.message);
        }
    }
}

export function resolveCustomerCategory(customer: any): string {
    if (!customer) return 'General';
    if (customer.category && customer.category.trim() !== '' && customer.category.toLowerCase() !== 'general') {
        return customer.category;
    }

    const email = customer.email?.toLowerCase().trim();
    const phone = customer.phone?.trim();
    const customerId = customer.id;
    const linkedInquiryId = customer.linkedInquiryId;

    // 1. Check inquiries
    if (db.inquiries) {
        // Try linking by ID first (most specific)
        let inq = db.inquiries.find((i: any) =>
            (linkedInquiryId && i.id === linkedInquiryId) ||
            (i.linkedCustomerId === customerId)
        );
        if (inq && (inq.productCategory || inq.productInterest)) {
            return inq.productCategory || inq.productInterest;
        }
        // Try linking by email/phone
        inq = db.inquiries.find((i: any) =>
            (email && i.email?.toLowerCase().trim() === email) ||
            (phone && i.phone?.trim() === phone)
        );
        if (inq && (inq.productCategory || inq.productInterest)) {
            return inq.productCategory || inq.productInterest;
        }
    }

    return customer.category || 'General';
}


