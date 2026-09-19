/**
 * POST /api/auth/login — Unified login for all roles
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { db, ensureDb, persistWrite, escapeRegExp, isMongoReady, getMongoDb } from '@/lib/db';
import { sendOtp } from '@/lib/otp';
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
    const body = await req.json();
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

    if (isAdminIdentifier) {
        if (formattedPass === adminPassword) {
            delete loginAttempts[rateLimitKey];

            // 2FA Logic for Admin via 2Factor
            let adminUser = db.users.find((u: any) => u.email && u.email.toLowerCase() === adminEmail);
            if (!adminUser) {
                adminUser = { id: 'admin', email: adminEmail, role: 'admin', phone: adminPhone };
                db.users.push(adminUser);
            }
            const targetAdminPhone = isPhone ? identifier : (adminUser.phone || adminPhone);

            const otpRes = await sendOtp({
                phone: targetAdminPhone,
                purpose: 'login'
            });

            if (!otpRes.success) {
                return NextResponse.json({ error: otpRes.error || 'Failed to dispatch 2FA OTP.' }, { status: 400 });
            }

            const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
            const sessionId = otpRes.sessionId;

            adminUser.twoFactorSessionId = sessionId;
            adminUser.otpExpiry = otpExpiry;
            adminUser.otpAttempts = 0;
            adminUser.phone = targetAdminPhone;
            const adminDocId = adminUser.id || adminUser._id || 'admin';
            await persistWrite('users', adminDocId, adminUser);

            if (isMongoReady()) {
                const mongoDb = getMongoDb();
                try {
                    await mongoDb.collection('Admin').updateOne(
                        { $or: [{ email: new RegExp(`^${escapeRegExp(adminEmail)}$`, 'i') }, { _id: adminDocId }, { id: adminDocId }] },
                        { $set: { twoFactorSessionId: sessionId, otpExpiry, otpAttempts: 0 } },
                        { upsert: false }
                    );
                } catch (mongoErr) {
                    console.error('[Login API] Direct MongoDB Admin update error:', mongoErr);
                }
            }

            return NextResponse.json({
                success: true,
                requiresOtp: true,
                email: adminEmail,
                role: 'admin'
            });
        } else {
            if (!loginAttempts[rateLimitKey]) loginAttempts[rateLimitKey] = { count: 0, lockUntil: 0 };
            loginAttempts[rateLimitKey].count += 1;
            if (loginAttempts[rateLimitKey].count >= 5) loginAttempts[rateLimitKey].lockUntil = now + 60000;
            return NextResponse.json({ error: 'Invalid administrator clearance or passkey credentials.' }, { status: 401 });
        }
    }

    let matchedUser: any = null;

    if (isPhone) {
        const found = await findAccountByPhone(cleanPhone);
        if (found) {
            matchedUser = found.account;
            if (!matchedUser.role && found.accountType) {
                matchedUser.role = found.accountType;
            }
            if (matchedUser.role === 'customer') {
                if (matchedUser.status === 'PENDING' || !matchedUser.hasLogin || !matchedUser.password) {
                    return NextResponse.json({
                        error: 'Your account is pending activation. Please use the activation link sent to your WhatsApp to set your password.',
                        isPendingActivation: true
                    }, { status: 403 });
                }
            }
        }
    }

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

    // Fallback: search customers collection if not found in Admin
    if (!matchedUser) {
        let customerAcc = db.customers.find((c: any) => (c.email && c.email.toLowerCase() === formattedEmail) || (c.phone && normalizePhoneNumber(c.phone) === cleanPhone));
        if (!customerAcc && isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                const query = isPhone ? { phone: new RegExp(escapeRegExp(cleanPhone)) } : { email: new RegExp(`^${escapeRegExp(formattedEmail)}$`, 'i') };
                const remCustomer = await mongoDb.collection('customers').findOne(query);
                if (remCustomer) {
                    const c = { ...remCustomer };
                    if (c._id && typeof c._id !== 'string') c._id = c._id.toString();
                    if (!c.id) c.id = c._id;
                    customerAcc = c;
                }
            } catch (err) {
                console.error('[Login API] MongoDB customer fetch error:', err);
            }
        }

        if (customerAcc) {
            if (customerAcc.status === 'PENDING' || !customerAcc.hasLogin || !customerAcc.password) {
                return NextResponse.json({
                    error: 'Your account is pending activation. Please use the activation link sent to your WhatsApp/Email to set your password.',
                    isPendingActivation: true
                }, { status: 403 });
            }
            matchedUser = {
                ...customerAcc,
                role: 'customer',
            };
        }
    }

    // Fallback: search dealers collection if not found in Admin or customers
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

    if (!matchedUser) {
        if (!loginAttempts[rateLimitKey]) loginAttempts[rateLimitKey] = { count: 0, lockUntil: 0 };
        loginAttempts[rateLimitKey].count += 1;
        if (loginAttempts[rateLimitKey].count >= 5) loginAttempts[rateLimitKey].lockUntil = now + 60000;
        return NextResponse.json({ error: isPhone ? 'No registered account found matching that mobile number.' : 'No registered customer or partner account matches that email address.' }, { status: 404 });
    }

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
    } else if (matchedUser.role === 'customer') {
        let detailInq = db.inquiries.find((i: any) => (i.email && i.email.toLowerCase() === userEmail) || (i.phone && normalizePhoneNumber(i.phone) === cleanPhone));
        if (isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                const remInq = await mongoDb.collection('inquiries').findOne(userEmail ? { email: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') } : { phone: new RegExp(escapeRegExp(cleanPhone)) });
                if (remInq) {
                    const i = { ...remInq };
                    if (i._id && typeof i._id !== 'string') i._id = i._id.toString();
                    if (!i.id) i.id = i._id;
                    if (detailInq) {
                        Object.assign(detailInq, i);
                    } else {
                        db.inquiries.push(i);
                        detailInq = i;
                    }
                }
            } catch (err) {
                console.error('[Login API] MongoDB inquiry fetch error:', err);
            }
        }
        if (detailInq) {
            sessionUser = {
                ...detailInq,
                ...matchedUser,
                name: matchedUser.name || detailInq.name,
                phone: matchedUser.phone || detailInq.phone,
                email: matchedUser.email || detailInq.email
            };
        }
    }

    delete loginAttempts[rateLimitKey];

    // 2FA Logic for Dealer via 2Factor
    if (sessionUser.role === 'dealer') {
        const targetDealerPhone = isPhone ? identifier : (sessionUser.phone || matchedUser.phone);
        const otpRes = await sendOtp({
            phone: targetDealerPhone,
            purpose: 'login'
        });

        if (!otpRes.success) {
            return NextResponse.json({ error: otpRes.error || 'Failed to dispatch 2FA OTP.' }, { status: 400 });
        }

        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        const sessionId = otpRes.sessionId;

        sessionUser.twoFactorSessionId = sessionId;
        sessionUser.otpExpiry = otpExpiry;
        sessionUser.otpAttempts = 0;

        const targetId = sessionUser.id || sessionUser._id;
        const dealerIdx = db.dealers.findIndex((d: any) => 
            (d.id && targetId && d.id === targetId) ||
            (d._id && targetId && d._id === targetId) ||
            (d.email && sessionUser.email && d.email.toLowerCase() === sessionUser.email.toLowerCase()) ||
            (d.phone && sessionUser.phone && normalizePhoneNumber(d.phone) === normalizePhoneNumber(sessionUser.phone))
        );

        if (dealerIdx !== -1) {
            Object.assign(db.dealers[dealerIdx], {
                twoFactorSessionId: sessionId,
                otpExpiry,
                otpAttempts: 0
            });
            sessionUser = db.dealers[dealerIdx];
        } else {
            db.dealers.push(sessionUser);
        }

        await persistWrite('dealers', targetId, sessionUser);

        if (isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                await mongoDb.collection('dealers').updateOne(
                    {
                        $or: [
                            { _id: targetId },
                            { id: targetId },
                            ...(sessionUser.email ? [{ email: new RegExp(`^${escapeRegExp(sessionUser.email)}$`, 'i') }] : []),
                            ...(sessionUser.phone ? [{ phone: new RegExp(escapeRegExp(normalizePhoneNumber(sessionUser.phone))) }] : [])
                        ]
                    },
                    { $set: { twoFactorSessionId: sessionId, otpExpiry, otpAttempts: 0 } },
                    { upsert: false }
                );
            } catch (err) {
                console.error('[Login API] Direct MongoDB dealer OTP update error:', err);
            }
        }

        return NextResponse.json({
            success: true,
            requiresOtp: true,
            email: sessionUser.email,
            phone: sessionUser.phone,
            role: 'dealer'
        });
    }

    const token = signToken({ id: sessionUser.id || sessionUser._id, email: sessionUser.email, role: sessionUser.role }, rememberMe ? '30d' : '24h');

    const res = NextResponse.json({ success: true, token, user: sanitizeUser(sessionUser) });
    res.cookies.set('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: rememberMe ? 2592000 : 86400, path: '/' });
    return res;
}
