import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({
        error: 'OTP verification is no longer required or supported. Please use direct login with your password.'
    }, { status: 410 });
}
