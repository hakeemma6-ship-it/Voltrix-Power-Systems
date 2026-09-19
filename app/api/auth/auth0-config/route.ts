/**
 * GET /api/auth/auth0-config — Dynamic check of Auth0 setup status
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
    const configured = !!(domain && clientId && process.env.AUTH0_CLIENT_SECRET);
    const origin = req.nextUrl.origin;

    return NextResponse.json({
        configured,
        authUrl: configured
            ? `https://${domain}/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(origin + '/api/auth/auth0-callback')}&connection=google-oauth2&scope=openid%20profile%20email`
            : null
    });
}
