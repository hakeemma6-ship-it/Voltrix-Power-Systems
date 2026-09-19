/**
 * POST /api/auth/google-login — Direct Google-authenticated email validation (Simulation / Dev mode)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, syncDatabaseOnBoot } from '@/lib/db';
import { signToken, sanitizeUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    // 1. Guardrail: Disallow unverified simulated login in production environments
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Simulated Google login is disabled in production. Please authenticate via Auth0 / Google OAuth.' },
            { status: 403 }
        );
    }

    await syncDatabaseOnBoot();
    const body = await req.json();
    const { email, name } = body;

    if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Valid email parameter is required.' }, { status: 400 });
    }

    const formattedEmail = email.trim().toLowerCase();

    // Check if user already exists
    let matchedUser = db.users.find((u: any) => u.email && u.email.toLowerCase() === formattedEmail);
    if (!matchedUser) {
        const custAcc = db.customers?.find((c: any) => c.email && c.email.toLowerCase() === formattedEmail);
        if (custAcc && custAcc.hasLogin) {
            matchedUser = {
                ...custAcc,
                role: 'customer'
            };
        }
    }
    if (!matchedUser) {
        const dealerAcc = db.dealers?.find((d: any) => d.email && d.email.toLowerCase() === formattedEmail);
        if (dealerAcc) {
            matchedUser = {
                ...dealerAcc,
                role: 'dealer'
            };
        }
    }

    // 2. Strict Security Guard: Never allow administrative privilege acquisition via simulated login
    if (matchedUser && matchedUser.role === 'admin') {
        return NextResponse.json(
            { error: 'Administrator accounts cannot log in via simulated Google login. Please use standard administrator credentials.' },
            { status: 403 }
        );
    }

    if (matchedUser && matchedUser.phone && matchedUser.phone.trim().length >= 10) {
        // Authenticated Google user already exists with mobile number
        const token = signToken({ id: matchedUser.id || matchedUser._id, email: matchedUser.email, role: matchedUser.role }, '24h');

        // Fetch additional info if they are customer
        let sessionUser = matchedUser;
        if (matchedUser.role === 'customer') {
            const detailInq = db.inquiries.find((i: any) => i.email && i.email.toLowerCase() === formattedEmail);
            const detailCust = db.customers.find((c: any) => c.email && c.email.toLowerCase() === formattedEmail);
            sessionUser = {
                ...detailInq,
                ...detailCust,
                ...matchedUser,
                name: matchedUser.name || detailCust?.name || detailInq?.name,
                phone: matchedUser.phone || detailCust?.phone || detailInq?.phone,
                email: matchedUser.email
            };
        }

        const sanitized = sanitizeUser(sessionUser);
        const res = NextResponse.json({ success: true, token, user: sanitized, onboarded: true });
        res.cookies.set('token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 86400, path: '/' });
        return res;
    }

    // User is new — requires name and phone number onboarding!
    return NextResponse.json({ success: true, email: formattedEmail, name: typeof name === 'string' ? name.trim() : '', onboarded: false });
}

