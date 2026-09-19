import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, ensureDb, persistWrite, escapeRegExp, isMongoReady, getMongoDb } from '@/lib/db';
import { isPhoneNumber, normalizePhoneNumber } from '@/lib/phone';
import { signToken, sanitizeUser } from '@/lib/auth';
import { verifyOtp } from '@/lib/otp';

export async function POST(req: NextRequest) {
    await ensureDb();
    const body = await req.json();
    const { email, identifier, password, otp, rememberMe } = body;
    const loginIdentifier = (identifier || email || '').trim();

    if (!loginIdentifier || !password || !otp) {
        return NextResponse.json({ error: 'Identifier, password, and OTP are required.' }, { status: 400 });
    }

    const formattedIdentifier = loginIdentifier.toLowerCase();
    const formattedPass = password.trim();
    const formattedOtp = otp.trim();

    const isPhone = isPhoneNumber(loginIdentifier);
    const cleanPhone = normalizePhoneNumber(loginIdentifier);

    const isProd = process.env.NODE_ENV === 'production';
    const adminEmail = (process.env.ADMIN_EMAIL || (isProd ? '' : 'admin@voltrixpower.com')).trim().toLowerCase();
    const adminPassword = (process.env.ADMIN_PASSWORD || (isProd ? '' : 'admin123')).trim();
    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE || (isProd ? '' : '919032372136');
    const isAdminIdentifier = !!(adminEmail && adminPassword && (formattedIdentifier === adminEmail || (isPhone && cleanPhone === normalizePhoneNumber(adminPhone))));

    let sessionUser: any = null;
    let collectionName = '';

    if (isAdminIdentifier) {
        if (formattedPass !== adminPassword) {
            return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
        }

        // Fetch fresh Admin document if MongoDB is ready
        if (isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                const remAdmin = await mongoDb.collection('Admin').findOne({
                    $or: [
                        { email: new RegExp(`^${escapeRegExp(adminEmail)}$`, 'i') },
                        { role: 'admin' }
                    ]
                });
                if (remAdmin) {
                    const u = { ...remAdmin };
                    if (u._id && typeof u._id !== 'string') u._id = u._id.toString();
                    if (!u.id) u.id = u._id;
                    const memAdmin = db.users.find((x: any) => x.email && x.email.toLowerCase() === adminEmail);
                    if (memAdmin) {
                        Object.assign(memAdmin, u);
                        sessionUser = memAdmin;
                    } else {
                        db.users.push(u);
                        sessionUser = u;
                    }
                }
            } catch (err) {
                console.error('[Verify OTP API] MongoDB Admin fetch error:', err);
            }
        }

        if (!sessionUser) {
            sessionUser = db.users.find((u: any) => u.email && u.email.toLowerCase() === adminEmail);
        }
        collectionName = 'users';

        if (!sessionUser) {
            return NextResponse.json({ error: 'Admin user not found. Please initiate login again.' }, { status: 404 });
        }
    } else {
        // Dealer lookup - check MongoDB first for the freshest state
        let matchedUser: any = null;

        if (isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                const query = isPhone && cleanPhone
                    ? { phone: new RegExp(escapeRegExp(cleanPhone)) }
                    : { email: new RegExp(`^${escapeRegExp(formattedIdentifier)}$`, 'i') };
                const remDealer = await mongoDb.collection('dealers').findOne(query);
                if (remDealer) {
                    const d = { ...remDealer };
                    if (d._id && typeof d._id !== 'string') d._id = d._id.toString();
                    if (!d.id) d.id = d._id;
                    const idx = db.dealers.findIndex((x: any) =>
                        (x.id && d.id && x.id === d.id) ||
                        (x.email && d.email && x.email.toLowerCase() === d.email.toLowerCase()) ||
                        (x.phone && d.phone && normalizePhoneNumber(x.phone) === normalizePhoneNumber(d.phone))
                    );
                    if (idx !== -1) {
                        Object.assign(db.dealers[idx], d);
                        matchedUser = db.dealers[idx];
                    } else {
                        db.dealers.push(d);
                        matchedUser = d;
                    }
                }
            } catch (err) {
                console.error('[Verify OTP API] MongoDB dealer fetch error:', err);
            }
        }

        if (!matchedUser) {
            matchedUser = db.dealers.find((d: any) => 
                (d.email && d.email.toLowerCase() === formattedIdentifier) ||
                (d.phone && cleanPhone && normalizePhoneNumber(d.phone) === cleanPhone)
            );
        }

        if (!matchedUser) {
            return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
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
            return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
        }

        sessionUser = matchedUser;
        sessionUser.role = 'dealer';
        collectionName = 'dealers';
    }

    // OTP Validation via 2Factor
    const sessionId = sessionUser.twoFactorSessionId || sessionUser.otpSessionId;
    if ((!sessionId && !sessionUser.otpHash) || !sessionUser.otpExpiry) {
        return NextResponse.json({ error: 'No OTP session found. Please request a new OTP.' }, { status: 400 });
    }

    if (Date.now() > sessionUser.otpExpiry) {
        return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (sessionUser.otpAttempts && sessionUser.otpAttempts >= 5) {
        return NextResponse.json({ error: 'Maximum OTP attempts exceeded. Please login again.' }, { status: 403 });
    }

    const verifyRes = await verifyOtp({
        sessionId,
        otp: formattedOtp,
        fallbackHash: sessionUser.otpHash
    });

    if (!verifyRes.success) {
        sessionUser.otpAttempts = (sessionUser.otpAttempts || 0) + 1;
        const targetId = sessionUser.id || sessionUser._id;
        await persistWrite(collectionName, targetId, sessionUser);
        if (isMongoReady()) {
            const mongoDb = getMongoDb();
            const targetCollection = collectionName === 'users' ? 'Admin' : collectionName;
            try {
                await mongoDb.collection(targetCollection).updateOne(
                    { $or: [{ _id: targetId }, { id: targetId }, ...(sessionUser.email ? [{ email: sessionUser.email }] : [])] },
                    { $inc: { otpAttempts: 1 } }
                );
            } catch { }
        }
        return NextResponse.json({ error: verifyRes.error || 'Invalid OTP.' }, { status: 401 });
    }

    // Clear OTP data upon successful verification
    sessionUser.twoFactorSessionId = null;
    sessionUser.otpHash = null;
    sessionUser.otpExpiry = null;
    sessionUser.otpAttempts = 0;
    const targetId = sessionUser.id || sessionUser._id;
    await persistWrite(collectionName, targetId, sessionUser);
    if (isMongoReady()) {
        const mongoDb = getMongoDb();
        const targetCollection = collectionName === 'users' ? 'Admin' : collectionName;
        try {
            await mongoDb.collection(targetCollection).updateOne(
                { $or: [{ _id: targetId }, { id: targetId }, ...(sessionUser.email ? [{ email: sessionUser.email }] : [])] },
                { $set: { twoFactorSessionId: null, otpHash: null, otpExpiry: null, otpAttempts: 0 } }
            );
        } catch { }
    }

    // Generate final token
    const tokenPayload = {
        id: sessionUser.id || sessionUser._id || (sessionUser.role === 'admin' ? 'admin' : 'dealer'),
        email: sessionUser.email,
        role: sessionUser.role || 'admin'
    };

    const token = signToken(tokenPayload, rememberMe ? '30d' : '24h');

    // Prepare response user object
    const returnUser = sessionUser.role === 'admin' ? {
        id: 'admin', _id: 'admin', role: 'admin', email: adminEmail, name: 'Executive Operations Head', status: 'approved'
    } : sessionUser;

    const res = NextResponse.json({ success: true, token, user: sanitizeUser(returnUser) });
    res.cookies.set('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: rememberMe ? 2592000 : 86400, path: '/' });
    
    return res;
}
