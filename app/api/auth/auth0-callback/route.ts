import { NextRequest, NextResponse } from 'next/server';
import { db, syncDatabaseOnBoot } from '@/lib/db';
import { signToken } from '@/lib/auth';


export async function GET(req: NextRequest) {
    await syncDatabaseOnBoot();
    const { searchParams, origin } = req.nextUrl;
    const code = searchParams.get('code');

    const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;

    if (!code) {
        return NextResponse.redirect(`${origin}/#login?error=No+authorization+code+received`);
    }

    if (!domain || !clientId || !clientSecret) {
        console.error('Auth0 credentials are not fully configured in environment variables.');
        return NextResponse.redirect(`${origin}/#login?error=Auth0+credentials+not+configured`);
    }

    try {
        // 1. Exchange auth code for token
        const tokenUrl = `https://${domain}/oauth/token`;
        const tokenResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: `${origin}/api/auth/auth0-callback`,
            }),
        });

        if (!tokenResponse.ok) {
            const errBody = await tokenResponse.text();
            throw new Error(`Token exchange failed: ${errBody}`);
        }

        const tokenData = await tokenResponse.json();
        const { access_token } = tokenData;

        // 2. Fetch user profile info
        const userInfoUrl = `https://${domain}/userinfo`;
        const userInfoResponse = await fetch(userInfoUrl, {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!userInfoResponse.ok) {
            throw new Error('Failed to retrieve userinfo from Auth0.');
        }

        const profile = await userInfoResponse.json();
        const email = profile.email?.trim().toLowerCase();
        const nickname = profile.name || profile.nickname || '';

        if (!email) {
            return NextResponse.redirect(`${origin}/#login?error=No+email+returned+from+identity+provider`);
        }

        let matchedUser = db.users.find((u: any) => u.email.toLowerCase() === email);
        if (!matchedUser) {
            const dealerAcc = db.dealers?.find((d: any) => d.email && d.email.toLowerCase() === email);
            if (dealerAcc) {
                matchedUser = {
                    ...dealerAcc,
                    role: 'dealer'
                };
            }
        }

        if (matchedUser && (matchedUser.role === 'admin' || matchedUser.role === 'dealer')) {
            const token = signToken({ id: matchedUser.id || matchedUser._id, email: matchedUser.email, role: matchedUser.role }, '24h');
            const redirectTarget = matchedUser.role === 'admin' ? '/#admin' : '/#dealer-portal';
            const response = NextResponse.redirect(`${origin}${redirectTarget}?auth0_token=${token}`);
            response.cookies.set('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 86400, path: '/' });
            return response;
        }

        return NextResponse.redirect(`${origin}/#login?error=No+authorized+dealer+or+admin+account+found+for+this+email`);

    } catch (e: any) {
        console.error('[Auth0 Callback Error]:', e);
        return NextResponse.redirect(`${origin}/#login?error=${encodeURIComponent(e.message || 'Auth0 login failed')}`);
    }
}
