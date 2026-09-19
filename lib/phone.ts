/**
 * lib/phone.ts — Phone normalization and cross-role uniqueness utilities.
 */
import { db, ensureDb, isMongoReady, getMongoDb, escapeRegExp } from '@/lib/db';

/**
 * Normalizes a phone string into a clean digit string.
 * For standard 10-digit Indian numbers, returns the 10 digits.
 * If 12 digits starting with '91', strips '91' to return the canonical 10-digit number.
 * If international, keeps all digits.
 */
export function normalizePhoneNumber(phone: string | undefined | null): string {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
    }
    return digits;
}

/**
 * Checks if a given identifier looks like a phone number (e.g. contains mostly digits).
 */
export function isPhoneNumber(identifier: string): boolean {
    if (!identifier) return false;
    const clean = identifier.trim().replace(/[\s\-\+\(\)]/g, '');
    // If it contains '@', it's an email
    if (clean.includes('@')) return false;
    // If after stripping phone symbols it's purely digits and length >= 7, treat as phone
    return /^\d{7,15}$/.test(clean);
}

/**
 * Searches users, customers, and dealers for any record matching the normalized phone number.
 */
export async function findAccountByPhone(rawPhone: string): Promise<{
    account: any;
    accountType: 'admin' | 'user' | 'dealer' | 'customer';
} | null> {
    await ensureDb();
    const cleanPhone = normalizePhoneNumber(rawPhone);
    if (!cleanPhone) return null;

    // 1. Check Admin / Users in db.users
    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE || '919032372136';
    if (normalizePhoneNumber(adminPhone) === cleanPhone) {
        let adminUser = db.users.find((u: any) => u.email === (process.env.ADMIN_EMAIL || 'admin@voltrixpower.com').toLowerCase());
        if (!adminUser) {
            adminUser = { id: 'admin', email: (process.env.ADMIN_EMAIL || 'admin@voltrixpower.com').toLowerCase(), role: 'admin', phone: adminPhone };
            db.users.push(adminUser);
        }
        return { account: adminUser, accountType: 'admin' };
    }

    const matchedUser = db.users.find((u: any) => u.phone && normalizePhoneNumber(u.phone) === cleanPhone);
    if (matchedUser) {
        return { account: matchedUser, accountType: matchedUser.role === 'admin' ? 'admin' : 'user' };
    }

    // 2. Check Dealers
    let matchedDealer = db.dealers.find((d: any) => d.phone && normalizePhoneNumber(d.phone) === cleanPhone);
    if (matchedDealer) {
        return { account: matchedDealer, accountType: 'dealer' };
    }

    // 3. Check Customers
    let matchedCustomer = db.customers.find((c: any) => c.phone && normalizePhoneNumber(c.phone) === cleanPhone);
    if (matchedCustomer) {
        return { account: matchedCustomer, accountType: 'customer' };
    }

    // Check MongoDB if ready
    if (isMongoReady()) {
        const mongoDb = getMongoDb();
        try {
            // Regex to match phone containing the clean digits
            const regex = new RegExp(escapeRegExp(cleanPhone));
            
            // Check Admin collection
            const remAdmin = await mongoDb.collection('Admin').findOne({ phone: regex });
            if (remAdmin) {
                const u = { ...remAdmin, id: remAdmin._id?.toString() || remAdmin.id };
                return { account: u, accountType: 'admin' };
            }

            // Check dealers
            const remDealer = await mongoDb.collection('dealers').findOne({ phone: regex });
            if (remDealer) {
                const d = { ...remDealer, id: remDealer._id?.toString() || remDealer.id };
                return { account: d, accountType: 'dealer' };
            }

            // Check customers
            const remCustomer = await mongoDb.collection('customers').findOne({ phone: regex });
            if (remCustomer) {
                const c = { ...remCustomer, id: remCustomer._id?.toString() || remCustomer.id };
                return { account: c, accountType: 'customer' };
            }
        } catch (err) {
            console.error('[findAccountByPhone] MongoDB lookup error:', err);
        }
    }

    return null;
}

/**
 * Checks if a mobile number is already taken across all roles (excluding a specific user ID if updating).
 */
export async function checkPhoneUniqueness(
    rawPhone: string,
    excludeUserId?: string
): Promise<{ exists: boolean; accountType?: string }> {
    const cleanPhone = normalizePhoneNumber(rawPhone);
    if (!cleanPhone) return { exists: false };

    const found = await findAccountByPhone(cleanPhone);
    if (found) {
        const foundId = (found.account.id || found.account._id || '').toString();
        if (excludeUserId && foundId === excludeUserId.toString()) {
            return { exists: false };
        }
        return { exists: true, accountType: found.accountType };
    }

    return { exists: false };
}
