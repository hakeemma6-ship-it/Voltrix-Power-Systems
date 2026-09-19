import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, syncDatabaseOnBoot, persistWrite, deduplicateCustomers } from '@/lib/db';
import type { Customer } from '@/types';
import { signToken, sanitizeUser } from '@/lib/auth';
import { verifyOtp } from '@/lib/otp';

export async function POST(req: NextRequest) {
    await syncDatabaseOnBoot();
    const body = await req.json();
    const { email, name, phone, otp } = body;

    if (!email || !name || !phone) {
        return NextResponse.json({ error: 'Email, Name, and Phone Number are required.' }, { status: 400 });
    }

    if (!otp) {
        return NextResponse.json({ error: 'Mobile OTP verification code is required.' }, { status: 400 });
    }

    const formattedEmail = email.trim().toLowerCase();
    const formattedPhone = phone.trim();
    const customerName = name.trim();

    const { normalizePhoneNumber, checkPhoneUniqueness } = await import('@/lib/phone');
    const cleanPhone = normalizePhoneNumber(formattedPhone);

    // Verify OTP from memory cache
    const onboardOtps = (global as any).__voltrix_google_onboard_otps || {};
    const cacheKey = `${cleanPhone}_${formattedEmail}`;
    const otpSession = onboardOtps[cacheKey];

    if (!otpSession) {
        return NextResponse.json({ error: 'No active OTP verification session found for this mobile number. Please request a new OTP.' }, { status: 400 });
    }

    if (Date.now() > otpSession.expiry) {
        delete onboardOtps[cacheKey];
        return NextResponse.json({ error: 'Verification OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (otpSession.attempts >= 5) {
        delete onboardOtps[cacheKey];
        return NextResponse.json({ error: 'Maximum attempts exceeded. Please request a new OTP.' }, { status: 403 });
    }

    const verifyResult = await verifyOtp({
        sessionId: otpSession.sessionId,
        otp: otp.trim(),
        fallbackHash: otpSession.otpHash
    });

    if (!verifyResult.success) {
        otpSession.attempts = (otpSession.attempts || 0) + 1;
        return NextResponse.json({ error: verifyResult.error || 'Invalid verification OTP. Please check and try again.' }, { status: 400 });
    }

    // Clear OTP session once verified
    delete onboardOtps[cacheKey];

    // Enforce phone uniqueness across all existing accounts
    const phoneCheck = await checkPhoneUniqueness(cleanPhone);
    if (phoneCheck.exists) {
        return NextResponse.json({ error: 'This mobile number is already registered to another account.' }, { status: 409 });
    }

    // Check if user already exists
    const existingUser = db.customers?.find((c: any) => c.email && c.email.toLowerCase() === formattedEmail) ||
        db.dealers?.find((d: any) => d.email && d.email.toLowerCase() === formattedEmail) ||
        db.users?.find((u: any) => u.email.toLowerCase() === formattedEmail);
    if (existingUser && (existingUser.role === 'admin' || (existingUser as any).hasLogin)) {
        return NextResponse.json({ error: 'An account with this email is already registered.' }, { status: 400 });
    }

    // Create a new user with random password since they authenticate via Google
    const randomPassword = bcrypt.hashSync(Math.random().toString(36), 10);

    // Check if customer profile already exists for this email/phone
    if (!db.customers) db.customers = [];
    const existingCust = db.customers.find((c: any) =>
        (formattedEmail && c.email && c.email.toLowerCase().trim() === formattedEmail) ||
        (formattedPhone && c.phone && c.phone.trim() === formattedPhone)
    );

    let customerId = `cust_${Date.now()}`;
    let finalCustomer: any = null;

    if (existingCust) {
        // Upgrade/link to this customer
        const custIdx = db.customers.findIndex((c: any) => c.id === existingCust.id);
        if (custIdx !== -1) {
            (db.customers as any[])[custIdx] = {
                ...db.customers[custIdx],
                hasLogin: true,
                password: randomPassword,
                authSource: 'google',
                name: db.customers[custIdx].name || customerName,
                phone: db.customers[custIdx].phone || formattedPhone,
                email: db.customers[custIdx].email || formattedEmail,
                updatedAt: new Date().toISOString()
            };
            customerId = db.customers[custIdx].id;
            finalCustomer = db.customers[custIdx];
            await persistWrite('customers', customerId, db.customers[custIdx]);
        }
    } else {
        // Create new customer
        const newCustomer: any = {
            id: customerId,
            name: customerName,
            phone: formattedPhone,
            email: formattedEmail,
            password: randomPassword,
            source: 'inquiry',
            status: 'new',
            hasLogin: true,
            authSource: 'google',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        db.customers.unshift(newCustomer);
        finalCustomer = newCustomer;
        await persistWrite('customers', newCustomer.id, newCustomer);
    }

    // Force run deduplication on global memory
    db.customers = deduplicateCustomers(db.customers);

    // Prepare session user
    const sessionUser = {
        ...finalCustomer,
        role: 'customer',
        name: customerName,
        phone: formattedPhone,
        email: formattedEmail
    };

    // Sign JWT
    const token = signToken({ id: customerId, email: formattedEmail, role: 'customer' }, '24h');

    const res = NextResponse.json({ success: true, token, user: sanitizeUser(sessionUser) });
    res.cookies.set('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 86400, path: '/' });
    return res;
}

