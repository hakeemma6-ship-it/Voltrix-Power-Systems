/**
 * POST /api/auth/forgot-password/send-otp
 * Accepts phone or identifier, validates account exists, generates 6-digit OTP,
 * hashes OTP, sets expiry, and sends via Twilio SMS.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, syncDatabaseOnBoot, persistWrite } from '@/lib/db';
import { sendOtp } from '@/lib/otp';
import { findAccountByPhone, normalizePhoneNumber, isPhoneNumber } from '@/lib/phone';

export async function POST(req: NextRequest) {
    await syncDatabaseOnBoot();
    const body = await req.json();
    const { phone, identifier } = body;
    const input = (phone || identifier || '').trim();

    if (!input) {
        return NextResponse.json({ error: 'Registered mobile number is required.' }, { status: 400 });
    }

    let targetPhone = input;
    let foundAccount: any = null;
    let collectionName = '';

    if (isPhoneNumber(input)) {
        const clean = normalizePhoneNumber(input);
        const result = await findAccountByPhone(clean);
        if (result) {
            foundAccount = result.account;
            collectionName = result.accountType === 'admin' ? 'users' : result.accountType === 'dealer' ? 'dealers' : 'customers';
            targetPhone = foundAccount.phone || input;
        }
    } else {
        // Look up by email
        const formattedEmail = input.toLowerCase();
        let user = db.users.find((u: any) => u.email && u.email.toLowerCase() === formattedEmail);
        if (user) {
            foundAccount = user;
            collectionName = 'users';
        } else {
            let dealer = db.dealers.find((d: any) => d.email && d.email.toLowerCase() === formattedEmail);
            if (dealer) {
                foundAccount = dealer;
                collectionName = 'dealers';
            } else {
                let customer = db.customers.find((c: any) => c.email && c.email.toLowerCase() === formattedEmail);
                if (customer) {
                    foundAccount = customer;
                    collectionName = 'customers';
                }
            }
        }
        if (foundAccount) {
            targetPhone = foundAccount.phone;
        }
    }

    if (!foundAccount || !targetPhone) {
        // Return friendly message or fail clearly
        return NextResponse.json({ error: 'No account registered with this mobile number.' }, { status: 404 });
    }

    try {
        const otpRes = await sendOtp({
            phone: targetPhone,
            purpose: 'reset'
        });

        if (!otpRes.success) {
            const status = otpRes.status === 'rate_limited' ? 429 : 400;
            return NextResponse.json({ error: otpRes.error || 'Failed to send OTP SMS. Please try again.' }, { status });
        }

        foundAccount.resetTwoFactorSessionId = otpRes.sessionId;
        foundAccount.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        foundAccount.resetOtpAttempts = 0;
        foundAccount.updatedAt = new Date().toISOString();

        await persistWrite(collectionName, foundAccount.id || foundAccount._id, foundAccount);

        return NextResponse.json({
            success: true,
            message: `OTP sent successfully to ${targetPhone.slice(-4).padStart(targetPhone.length, '*')}.`,
            phone: targetPhone,
            simulated: otpRes.status === 'simulated'
        });
    } catch (err: any) {
        console.error('[Forgot Password Send OTP] Error:', err);
        return NextResponse.json({ error: 'Failed to send OTP SMS. Please try again.' }, { status: 500 });
    }
}
