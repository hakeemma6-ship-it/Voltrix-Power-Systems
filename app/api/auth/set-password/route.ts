import { NextRequest, NextResponse } from 'next/server';
import { db, syncDatabaseOnBoot, persistWrite } from '@/lib/db';
import { hashToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// In-memory rate limiting to prevent token enumeration & brute-force attacks
const rateLimits: Record<string, { count: number; resetAt: number }> = {};

function checkRateLimit(ip: string, maxAttempts = 15, windowMs = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const record = rateLimits[ip];
    if (!record || now > record.resetAt) {
        rateLimits[ip] = { count: 1, resetAt: now + windowMs };
        return true;
    }
    if (record.count >= maxAttempts) {
        return false;
    }
    record.count++;
    return true;
}

/**
 * GET /api/auth/set-password?token=...
 * Validates the one-time activation token, expiration, and account status before displaying the form.
 */
export async function GET(req: NextRequest) {
    await syncDatabaseOnBoot();

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`get_${ip}`, 25, 10 * 60 * 1000)) {
        return NextResponse.json({ error: 'Too many verification requests. Please try again later.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token || typeof token !== 'string') {
        return NextResponse.json({ error: 'Missing or malformed activation token.' }, { status: 400 });
    }

    const tokenHash = hashToken(token);

    if (!db.customers) db.customers = [];

    // Look up customer by SHA-256 hashed activation token (or legacy resetToken)
    const customer = db.customers.find((c: any) =>
        c.activationTokenHash === tokenHash ||
        c.resetToken === token
    );

    if (!customer) {
        return NextResponse.json({ error: 'Invalid activation link. Please check the link or request a new one.' }, { status: 400 });
    }

    // Expiration check (1-week token validity)
    const expiry = customer.activationTokenExpiry || customer.resetTokenExpiry;
    if (expiry && Date.now() > expiry) {
        return NextResponse.json({
            error: 'This activation link has expired (1-week validity period exceeded). Please contact your administrator for a new link.',
            expired: true
        }, { status: 400 });
    }

    // Account status check
    if (customer.hasLogin && customer.password && customer.status !== 'PENDING') {
        return NextResponse.json({
            error: 'This account has already been activated. Please proceed to the login page.',
            alreadyActive: true
        }, { status: 400 });
    }

    return NextResponse.json({
        valid: true,
        name: customer.name || 'Customer',
        email: customer.email || '',
        status: customer.status || 'PENDING'
    });
}

/**
 * POST /api/auth/set-password
 * Validates the token and sets the customer password using bcrypt. Invalidate token immediately.
 */
export async function POST(req: NextRequest) {
    await syncDatabaseOnBoot();

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`post_${ip}`, 10, 10 * 60 * 1000)) {
        return NextResponse.json({ error: 'Too many attempts. Please wait 10 minutes before retrying.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { token, newPassword, password } = body;
    const chosenPassword = (newPassword || password || '').trim();

    if (!token || typeof token !== 'string') {
        return NextResponse.json({ error: 'Activation token is required.' }, { status: 400 });
    }

    if (!chosenPassword) {
        return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    // OWASP Password Complexity Validation
    if (chosenPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    if (!/[A-Z]/.test(chosenPassword)) {
        return NextResponse.json({ error: 'Password must contain at least one uppercase letter (A-Z).' }, { status: 400 });
    }

    if (!/[a-z]/.test(chosenPassword)) {
        return NextResponse.json({ error: 'Password must contain at least one lowercase letter (a-z).' }, { status: 400 });
    }

    if (!/[0-9]/.test(chosenPassword)) {
        return NextResponse.json({ error: 'Password must contain at least one number (0-9).' }, { status: 400 });
    }

    if (!/[^A-Za-z0-9]/.test(chosenPassword)) {
        return NextResponse.json({ error: 'Password must contain at least one special symbol (!@#$%^&*).' }, { status: 400 });
    }

    const tokenHash = hashToken(token);

    if (!db.customers) db.customers = [];

    // Find customer by hashed activation token or legacy resetToken
    const customer = db.customers.find((c: any) =>
        c.activationTokenHash === tokenHash ||
        c.resetToken === token
    );

    if (!customer) {
        return NextResponse.json({ error: 'Invalid or expired activation link.' }, { status: 400 });
    }

    const expiry = customer.activationTokenExpiry || customer.resetTokenExpiry;
    if (expiry && Date.now() > expiry) {
        return NextResponse.json({ error: 'This activation link has expired. Please contact support or your administrator.' }, { status: 400 });
    }

    try {
        // Hash the password using bcrypt with cost factor 12 (OWASP recommended)
        const hashedPassword = bcrypt.hashSync(chosenPassword, 12);

        // Update customer: set password, activate account, and immediately invalidate the one-time token
        customer.password = hashedPassword;
        customer.hasLogin = true;
        customer.status = 'active'; // Activated from PENDING to active
        customer.activationTokenHash = undefined;
        customer.activationTokenExpiry = undefined;
        customer.resetToken = undefined;
        customer.resetTokenExpiry = undefined;
        customer.activatedAt = new Date().toISOString();
        customer.updatedAt = new Date().toISOString();

        await persistWrite('customers', customer.id, customer);

        // Synchronize corresponding user in db.users if exists
        if (db.users) {
            const userIdx = db.users.findIndex((u: any) =>
                (u.email && customer.email && u.email.toLowerCase() === customer.email.toLowerCase()) ||
                u.customerId === customer.id ||
                u.id === customer.id
            );
            if (userIdx !== -1) {
                db.users[userIdx].password = hashedPassword;
                db.users[userIdx].status = 'active';
                db.users[userIdx].updatedAt = new Date().toISOString();
                await persistWrite('users', db.users[userIdx].id, db.users[userIdx]);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Password created and account activated successfully. You can now log in.'
        });
    } catch (error) {
        console.error('Failed to set password and activate customer:', error);
        return NextResponse.json({ error: 'An error occurred while setting the password. Please try again.' }, { status: 500 });
    }
}
