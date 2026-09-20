/**
 * POST /api/auth/forgot-password/verify-reset
 * Direct password reset for registered dealer or admin accounts (No OTP required).
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, syncDatabaseOnBoot, persistWrite } from '@/lib/db';
import { findAccountByPhone, normalizePhoneNumber, isPhoneNumber } from '@/lib/phone';

export async function POST(req: NextRequest) {
    await syncDatabaseOnBoot();
    const body = await req.json();
    const { phone, identifier, email, newPassword, confirmPassword } = body;
    const lookup = (identifier || phone || email || '').trim();

    if (!lookup || !newPassword) {
        return NextResponse.json({ error: 'Registered mobile number or email and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }

    let foundAccount: any = null;
    let accountType = '';

    if (isPhoneNumber(lookup)) {
        const cleanPhone = normalizePhoneNumber(lookup);
        const result = await findAccountByPhone(cleanPhone);
        if (result && result.account) {
            foundAccount = result.account;
            accountType = result.accountType;
        }
    } else {
        const formattedEmail = lookup.toLowerCase();
        let user = db.users.find((u: any) => u.email && u.email.toLowerCase() === formattedEmail);
        if (user) {
            foundAccount = user;
            accountType = user.role || 'admin';
        } else {
            let dealer = db.dealers.find((d: any) => d.email && d.email.toLowerCase() === formattedEmail);
            if (dealer) {
                foundAccount = dealer;
                accountType = 'dealer';
            }
        }
    }

    if (!foundAccount || accountType === 'customer') {
        return NextResponse.json({ error: 'No registered dealer or administrator account matches those details.' }, { status: 404 });
    }

    const hashedPassword = bcrypt.hashSync(newPassword.trim(), 10);
    foundAccount.password = hashedPassword;
    foundAccount.updatedAt = new Date().toISOString();

    const collectionName = accountType === 'admin' ? 'users' : 'dealers';
    const targetId = foundAccount.id || foundAccount._id;
    await persistWrite(collectionName, targetId, foundAccount);

    // Sync across db.users and db.dealers
    if (accountType === 'dealer') {
        if (!db.users) db.users = [];
        const userAcc = db.users.find((u: any) =>
            u.dealerId === targetId ||
            (foundAccount.email && u.email?.toLowerCase() === foundAccount.email.toLowerCase()) ||
            (foundAccount.phone && u.phone === foundAccount.phone)
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
