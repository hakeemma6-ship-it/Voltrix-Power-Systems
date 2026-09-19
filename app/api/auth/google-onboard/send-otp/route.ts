/**
 * POST /api/auth/google-onboard/send-otp
 * Validates that the entered mobile number does not exist on any account,
 * generates a 6-digit OTP, stores it in a verification session cache,
 * and sends it to the user's mobile number via Twilio.
 */
import { NextRequest, NextResponse } from 'next/server';
import { syncDatabaseOnBoot } from '@/lib/db';
import { sendOtp } from '@/lib/otp';
import { checkPhoneUniqueness, normalizePhoneNumber } from '@/lib/phone';

// In-memory verification sessions for Google onboarding (survives requests)
declare global {
    // eslint-disable-next-line no-var
    var __voltrix_google_onboard_otps: Record<string, { sessionId?: string; otpHash?: string; expiry: number; attempts: number }> | undefined;
}
if (!global.__voltrix_google_onboard_otps) {
    global.__voltrix_google_onboard_otps = {};
}
const onboardOtps = global.__voltrix_google_onboard_otps!;

export async function POST(req: NextRequest) {
    await syncDatabaseOnBoot();
    const body = await req.json();
    const { email, phone } = body;

    if (!phone) {
        return NextResponse.json({ error: 'Mobile phone number is required.' }, { status: 400 });
    }

    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
        return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    // Check if phone number is already registered across any user/dealer/customer
    const phoneCheck = await checkPhoneUniqueness(cleanPhone);
    if (phoneCheck.exists) {
        return NextResponse.json({
            error: 'This mobile number is already registered to another account. Please use a unique number.'
        }, { status: 409 });
    }

    const otpRes = await sendOtp({
        phone: cleanPhone,
        purpose: 'onboard'
    });

    if (!otpRes.success) {
        const status = otpRes.status === 'rate_limited' ? 429 : 400;
        return NextResponse.json({ error: otpRes.error || 'Failed to send verification SMS. Please try again.' }, { status });
    }

    const cacheKey = `${cleanPhone}_${(email || '').trim().toLowerCase()}`;
    onboardOtps[cacheKey] = {
        sessionId: otpRes.sessionId,
        expiry: Date.now() + 10 * 60 * 1000,
        attempts: 0
    };

    return NextResponse.json({
        success: true,
        message: `OTP sent to ${phone}. Please enter the 6-digit code to verify.`,
        simulated: otpRes.status === 'simulated'
    });
}
