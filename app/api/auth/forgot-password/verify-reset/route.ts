/**
 * POST /api/auth/forgot-password/verify-reset
 * Accepts phone, otp, and newPassword. Verifies OTP and updates password.
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, syncDatabaseOnBoot, persistWrite } from '@/lib/db';
import { verifyOtp } from '@/lib/otp';
import { findAccountByPhone, normalizePhoneNumber } from '@/lib/phone';

export async function POST(req: NextRequest) {
    await syncDatabaseOnBoot();
    const body = await req.json();
    const { phone, otp, newPassword, confirmPassword } = body;

    if (!phone || !otp || !newPassword) {
        return NextResponse.json({ error: 'Phone number, OTP, and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }

    const cleanPhone = normalizePhoneNumber(phone);
    const result = await findAccountByPhone(cleanPhone);

    if (!result || !result.account) {
        return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const account = result.account;
    const collectionName = result.accountType === 'admin' ? 'users' : result.accountType === 'dealer' ? 'dealers' : 'customers';

    const hasSession = account.resetTwoFactorSessionId || account.resetOtpHash;
    if (!hasSession || !account.resetOtpExpiry) {
        return NextResponse.json({ error: 'No active OTP session found. Please request a new OTP.' }, { status: 400 });
    }

    if (Date.now() > account.resetOtpExpiry) {
        return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (account.resetOtpAttempts && account.resetOtpAttempts >= 5) {
        return NextResponse.json({ error: 'Maximum attempts exceeded. Please request a new OTP.' }, { status: 403 });
    }

    const verifyResult = await verifyOtp({
        sessionId: account.resetTwoFactorSessionId,
        otp: otp.trim(),
        fallbackHash: account.resetOtpHash
    });

    if (!verifyResult.success) {
        account.resetOtpAttempts = (account.resetOtpAttempts || 0) + 1;
        await persistWrite(collectionName, account.id || account._id, account);
        return NextResponse.json({ error: verifyResult.error || 'Invalid OTP. Please check and try again.' }, { status: 400 });
    }

    // OTP verified: Update password
    const hashedPassword = bcrypt.hashSync(newPassword.trim(), 10);
    account.password = hashedPassword;
    if (result.accountType === 'customer') {
        account.hasLogin = true;
    }
    account.resetTwoFactorSessionId = undefined;
    account.resetOtpHash = undefined;
    account.resetOtpExpiry = undefined;
    account.resetOtpAttempts = undefined;
    account.updatedAt = new Date().toISOString();
    await persistWrite(collectionName, account.id || account._id, account);

    // Sync across db.users and db.dealers to avoid email login mismatch
    if (result.accountType === 'dealer') {
        if (!db.users) db.users = [];
        const userAcc = db.users.find((u: any) =>
            u.dealerId === (account.id || account._id) ||
            (account.email && u.email?.toLowerCase() === account.email.toLowerCase()) ||
            (account.phone && u.phone === account.phone)
        );
        if (userAcc) {
            userAcc.password = hashedPassword;
            userAcc.updatedAt = new Date().toISOString();
            await persistWrite('users', userAcc.id, userAcc);
        }
    } else if (result.accountType === 'customer') {
        if (!db.users) db.users = [];
        const userAcc = db.users.find((u: any) =>
            u.customerId === (account.id || account._id) ||
            (account.email && u.email?.toLowerCase() === account.email.toLowerCase())
        );
        if (userAcc) {
            userAcc.password = hashedPassword;
            userAcc.updatedAt = new Date().toISOString();
            await persistWrite('users', userAcc.id, userAcc);
        }
    }

    return NextResponse.json({
        success: true,
        message: 'Password reset successfully! You can now log in with your new password.'
    });
}
