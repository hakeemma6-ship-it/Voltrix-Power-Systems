/**
 * POST /api/auth/logout — Clear session cookie
 */
import { NextResponse } from 'next/server';

export async function POST() {
    const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
    res.cookies.set('token', '', { httpOnly: true, maxAge: 0, path: '/' });
    return res;
}
