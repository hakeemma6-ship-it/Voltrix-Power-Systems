/**
 * POST /api/auth/login — Direct credential login for Admin and Dealer (No OTP)
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, ensureDb, escapeRegExp, isMongoReady, getMongoDb } from '@/lib/db';
import { signToken, sanitizeUser } from '@/lib/auth';
import { isPhoneNumber, normalizePhoneNumber, findAccountByPhone } from '@/lib/phone';

// Simple in-memory rate limiter with periodic cleanup
const loginAttempts: Record<string, { count: number; lockUntil: number }> = {};
let lastLoginAttemptsCleanup = Date.now();

function cleanupLoginAttempts() {
    const now = Date.now();
    if (now - lastLoginAttemptsCleanup < 10 * 60 * 1000) return;
    lastLoginAttemptsCleanup = now;
    for (const k in loginAttempts) {
        if (loginAttempts[k].lockUntil < now) {
            delete loginAttempts[k];
        }
    }
}

export async function POST(req: NextRequest) {
    cleanupLoginAttempts();
    await ensureDb();
    const body = await req.json().catch(() => ({}));
    const { email, identifier: rawIdentifier, password, rememberMe } = body;
    const identifier = (rawIdentifier || email || '').trim();

    if (!identifier || !password) {
        return NextResponse.json({ error: 'Both mobile number/email and password parameters are required.' }, { status: 400 });
    }

    if (typeof identifier !== 'string' || typeof password !== 'string') {
        return NextResponse.json({ error: 'Mobile number/email and password parameters must be strings.' }, { status: 400 });
    }

    const isPhone = isPhoneNumber(identifier);
    const cleanPhone = isPhone ? normalizePhoneNumber(identifier) : '';
    const formattedEmail = identifier.toLowerCase();
    const formattedPass = password.trim();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `${ip}_${isPhone ? cleanPhone : formattedEmail}`;
    const now = Date.now();

    if (loginAttempts[rateLimitKey] && loginAttempts[rateLimitKey].lockUntil > now) {
        const secLeft = Math.ceil((loginAttempts[rateLimitKey].lockUntil - now) / 1000);
        return NextResponse.json({ error: `Too many login failures. Try again in ${secLeft} seconds.` }, { status: 429 });
    }

    const isProd = process.env.NODE_ENV === 'production';
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
    const adminPhone = (process.env.WHATSAPP_ADMIN_PHONE || '').trim();
    const isAdminIdentifier = !!(adminEmail && adminPassword && (formattedEmail === adminEmail || (isPhone && adminPhone && cleanPhone === normalizePhoneNumber(adminPhone))));

    // ── ADMIN LOGIN (Direct - No OTP) ──────────────────────────────────────────
    if (isAdminIdentifier) {
        if (formattedPass === adminPassword) {
            delete loginAttempts[rateLimitKey];

            let adminUser = db.users.find((u: any) => u.email && u.email.toLowerCase() === adminEmail);
            if (!adminUser) {
                adminUser = { id: 'admin', email: adminEmail, role: 'admin', name: 'Executive Operations Head', phone: adminPhone };
                db.users.push(adminUser);
            }

            const token = signToken(
                { id: 'admin', email: adminEmail, role: 'admin' },
                rememberMe ? '30d' : '24h'
            );

            const res = NextResponse.json({
                success: true,
                token,
                user: sanitizeUser({
                    id: 'admin',
                    role: 'admin',
                    email: adminEmail,
                    name: adminUser.name || 'Executive Operations Head'
                })
            });

            res.cookies.set('token', token, {
                httpOnly: true,
                sameSite: 'lax',
                secure: isProd,
                maxAge: rememberMe ? 2592000 : 86400,
                path: '/'
            });

            return res;
        } else {
            if (!loginAttempts[rateLimitKey]) loginAttempts[rateLimitKey] = { count: 0, lockUntil: 0 };
            loginAttempts[rateLimitKey].count += 1;
            if (loginAttempts[rateLimitKey].count >= 5) loginAttempts[rateLimitKey].lockUntil = now + 60000;
            return NextResponse.json({ error: 'Invalid administrator credentials.' }, { status: 401 });
        }
    }

    // ── LOOKUP ACCOUNT ─────────────────────────────────────────────────────────
    let matchedUser: any = null;

    if (isPhone) {
        const found = await findAccountByPhone(cleanPhone);
        if (found) {
            matchedUser = found.account;
            if (!matchedUser.role && found.accountType) {
                matchedUser.role = found.accountType;
            }
        }
    }

    // Check Admin user table by email
    if (!matchedUser) {
        matchedUser = db.users.find((u: any) => u.email && u.email.toLowerCase() === formattedEmail);
        if (isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                const remUser = await mongoDb.collection('Admin').findOne({ email: new RegExp(`^${escapeRegExp(formattedEmail)}$`, 'i') });
                if (remUser) {
                    const u = { ...remUser };
                    if (u._id && typeof u._id !== 'string') u._id = u._id.toString();
                    if (!u.id) u.id = u._id;
                    if (matchedUser) {
                        Object.assign(matchedUser, u);
                    } else {
                        db.users.push(u);
                        matchedUser = u;
                    }
                }
            } catch (err) {
                console.error('[Login API] MongoDB admin fetch error:', err);
            }
        }
    }

    // Search dealers collection
    if (!matchedUser) {
        let dealerAcc = db.dealers.find((d: any) => (d.email && d.email.toLowerCase() === formattedEmail) || (d.phone && normalizePhoneNumber(d.phone) === cleanPhone));
        if (!dealerAcc && isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                const query = isPhone ? { phone: new RegExp(escapeRegExp(cleanPhone)) } : { email: new RegExp(`^${escapeRegExp(formattedEmail)}$`, 'i') };
                const remDealer = await mongoDb.collection('dealers').findOne(query);
                if (remDealer) {
                    const d = { ...remDealer };
                    if (d._id && typeof d._id !== 'string') d._id = d._id.toString();
                    if (!d.id) d.id = d._id;
                    dealerAcc = d;
                }
            } catch (err) {
                console.error('[Login API] MongoDB dealer fetch error:', err);
            }
        }

        if (dealerAcc) {
            matchedUser = {
                ...dealerAcc,
                role: 'dealer',
            };
        }
    }

    // If an account is customer, explicitly deny login
    if (matchedUser && matchedUser.role === 'customer') {
        return NextResponse.json({
            error: 'Customer login has been discontinued. Portal access is reserved exclusively for authorized dealers and administrators.'
        }, { status: 403 });
    }

    // Fallback: check if identifier matches any customer in DB just to return friendly message
    if (!matchedUser) {
        const isCustomer = db.customers?.some((c: any) =>
            (c.email && c.email.toLowerCase() === formattedEmail) ||
            (c.phone && normalizePhoneNumber(c.phone) === cleanPhone)
        );
        if (isCustomer) {
            return NextResponse.json({
                error: 'Customer login has been discontinued. Portal access is reserved exclusively for authorized dealers and administrators.'
            }, { status: 403 });
        }
    }

    if (!matchedUser) {
        if (!loginAttempts[rateLimitKey]) loginAttempts[rateLimitKey] = { count: 0, lockUntil: 0 };
        loginAttempts[rateLimitKey].count += 1;
        if (loginAttempts[rateLimitKey].count >= 5) loginAttempts[rateLimitKey].lockUntil = now + 60000;
        return NextResponse.json({ error: isPhone ? 'No registered dealer account found matching that mobile number.' : 'No registered dealer account matches that email address.' }, { status: 404 });
    }

    // ── VERIFY PASSWORD ────────────────────────────────────────────────────────
    let isCorrectPassword = false;
    if (matchedUser.password) {
        if (matchedUser.password.startsWith('$2a$') || matchedUser.password.startsWith('$2b$')) {
            try {
                isCorrectPassword = bcrypt.compareSync(formattedPass, matchedUser.password);
            } catch {
                isCorrectPassword = false;
            }
        } else {
            isCorrectPassword = matchedUser.password === formattedPass;
        }
    }

    if (!isCorrectPassword) {
        if (!loginAttempts[rateLimitKey]) loginAttempts[rateLimitKey] = { count: 0, lockUntil: 0 };
        loginAttempts[rateLimitKey].count += 1;
        if (loginAttempts[rateLimitKey].count >= 5) loginAttempts[rateLimitKey].lockUntil = now + 60000;
        return NextResponse.json({ error: 'Invalid account access password.' }, { status: 401 });
    }

    // ── DEALER VALIDATION & LOGIN (Direct - No OTP) ────────────────────────────
    let sessionUser = matchedUser;
    const userEmail = (matchedUser.email || '').toLowerCase();

    if (matchedUser.role === 'dealer') {
        let detailDealer = db.dealers.find((d: any) => (d.email && d.email.toLowerCase() === userEmail) || (d.phone && normalizePhoneNumber(d.phone) === cleanPhone)) as any;
        if (isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                const remDealer = await mongoDb.collection('dealers').findOne(userEmail ? { email: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') } : { phone: new RegExp(escapeRegExp(cleanPhone)) });
                if (remDealer) {
                    const c = { ...remDealer };
                    if (c._id && typeof c._id !== 'string') c._id = c._id.toString();
                    if (!c.id) c.id = c._id;
                    if (detailDealer) {
                        Object.assign(detailDealer, c);
                    } else {
                        db.dealers.push(c);
                        detailDealer = c;
                    }
                }
            } catch (err) {
                console.error('[Login API] MongoDB dealer fetch error:', err);
            }
        }
        if (detailDealer) {
            sessionUser = detailDealer;
        }

        if (sessionUser.status === 'pending') {
            if (!loginAttempts[rateLimitKey]) loginAttempts[rateLimitKey] = { count: 0, lockUntil: 0 };
            loginAttempts[rateLimitKey].count += 1;
            return NextResponse.json({ error: 'Your dealer account is awaiting administrative approval.' }, { status: 403 });
        }
        if (sessionUser.status === 'rejected' || sessionUser.status === 'suspended') {
            if (!loginAttempts[rateLimitKey]) loginAttempts[rateLimitKey] = { count: 0, lockUntil: 0 };
            loginAttempts[rateLimitKey].count += 1;
            return NextResponse.json({ error: 'Your dealer account application has been rejected or suspended by administration.' }, { status: 403 });
        }
        if (sessionUser.status !== 'approved' && !['approved', 'stage2_pending', 'stage3_review'].includes(sessionUser.status)) {
            if (!loginAttempts[rateLimitKey]) loginAttempts[rateLimitKey] = { count: 0, lockUntil: 0 };
            loginAttempts[rateLimitKey].count += 1;
            return NextResponse.json({ error: 'Your dealer account is currently inactive.' }, { status: 403 });
        }
    }

    delete loginAttempts[rateLimitKey];

    const token = signToken(
        { id: sessionUser.id || sessionUser._id, email: sessionUser.email, role: sessionUser.role || 'dealer' },
        rememberMe ? '30d' : '24h'
    );

    const res = NextResponse.json({ success: true, token, user: sanitizeUser(sessionUser) });
    res.cookies.set('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        maxAge: rememberMe ? 2592000 : 86400,
        path: '/'
    });
    return res;
}
