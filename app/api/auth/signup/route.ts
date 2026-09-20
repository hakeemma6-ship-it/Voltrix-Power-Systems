import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, persistWrite, syncDatabaseOnBoot } from '@/lib/db';
import type { Inquiry, Customer } from '@/types';
import { sendWhatsAppMessage, sendAdminWhatsAppMessage } from '@/lib/whatsapp';
import { signToken, sanitizeUser } from '@/lib/auth';

function validateStrongPassword(p: string) {
    return p.length >= 6 && /[a-zA-Z]/.test(p) && /[0-9]/.test(p);
}

export async function POST(req: NextRequest) {
    await syncDatabaseOnBoot();
    const body = await req.json();
    const { role, username, name, email, phone, password, confirmPassword, businessName, ownerName, gstNumber, address } = body;
    const reqConfirm = confirmPassword || password;

    if (!role || !email || !password) {
        return NextResponse.json({ error: 'Required fields (role, email, password) must be provided.' }, { status: 400 });
    }

    if (typeof role !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        return NextResponse.json({ error: 'Required fields (role, email, and password) must be strings.' }, { status: 400 });
    }

    if (username && typeof username !== 'string') return NextResponse.json({ error: 'Invalid username format.' }, { status: 400 });
    if (name && typeof name !== 'string') return NextResponse.json({ error: 'Invalid name format.' }, { status: 400 });
    if (phone && typeof phone !== 'string') return NextResponse.json({ error: 'Invalid phone format.' }, { status: 400 });
    if (confirmPassword && typeof confirmPassword !== 'string') return NextResponse.json({ error: 'Invalid confirm password format.' }, { status: 400 });
    if (businessName && typeof businessName !== 'string') return NextResponse.json({ error: 'Invalid business name format.' }, { status: 400 });
    if (ownerName && typeof ownerName !== 'string') return NextResponse.json({ error: 'Invalid owner name format.' }, { status: 400 });
    if (gstNumber && typeof gstNumber !== 'string') return NextResponse.json({ error: 'Invalid GSTIN format.' }, { status: 400 });
    if (address && typeof address !== 'string') return NextResponse.json({ error: 'Invalid address format.' }, { status: 400 });

    if (password !== reqConfirm) return NextResponse.json({ error: 'Passwords must match.' }, { status: 400 });
    if (!validateStrongPassword(password)) return NextResponse.json({ error: 'Password must be at least 6 characters and contain both letters and numbers.' }, { status: 400 });

    const formattedEmail = email.trim().toLowerCase();
    if (!phone) {
        return NextResponse.json({ error: 'Mobile phone number is required.' }, { status: 400 });
    }

    const { checkPhoneUniqueness } = await import('@/lib/phone');
    const phoneCheck = await checkPhoneUniqueness(phone);
    if (phoneCheck.exists) {
        return NextResponse.json({ error: 'This mobile number is already registered to another account.' }, { status: 400 });
    }

    const existingUser = db.users.find((u: any) => u.email.toLowerCase() === formattedEmail) ||
        db.customers?.find((c: any) => c.email && c.email.toLowerCase() === formattedEmail) ||
        db.dealers?.find((d: any) => d.email && d.email.toLowerCase() === formattedEmail);
    if (existingUser) return NextResponse.json({ error: 'This email address is already associated with an account.' }, { status: 400 });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = `u_${Date.now()}`;

    if (role === 'customer') {
        return NextResponse.json({ error: 'Customer registration is not supported. Only authorized dealers can apply.' }, { status: 403 });
    }

    if (role === 'dealer') {
        if (!businessName || !ownerName) return NextResponse.json({ error: 'Dealer registrations require corporate business name and owner authority.' }, { status: 400 });

        let regId = `VLT-B2B-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        while (db.dealers.some((d: any) => d.id === regId)) regId = `VLT-B2B-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        const newDealer: any = {
            id: regId, _id: regId, businessName, ownerName, email: formattedEmail, phone: phone || '',
            gstNumber: gstNumber || '', gstin: gstNumber || '', address: address || '', status: 'pending',
            createdAt: new Date().toISOString().split('T')[0], registeredAt: new Date().toISOString().split('T')[0],
            companyName: businessName, name: ownerName, username: ownerName, password: hashedPassword, city: '', state: '',
            notes: [], whatsappLogs: []
        };
        db.dealers.unshift(newDealer);
        await persistWrite('dealers', newDealer.id, newDealer);

        const notification = { id: `notif_${Date.now()}`, type: 'dealer_registration', dealerId: regId, message: `New dealer registration request submitted by ${ownerName} from ${businessName}.`, isRead: false, createdAt: new Date().toISOString() };
        db.notifications.unshift(notification);
        await persistWrite('notifications', notification.id, notification);

        // Send WhatsApp notification to the registering dealer
        try {
            await sendWhatsAppMessage({
                to: phone || '',
                recipientName: ownerName,
                type: 'template',
                templateName: 'dealer_registration_received',
                parameters: [ownerName, businessName],
                associatedDealerId: regId
            });
        } catch (err) {
            console.error('Failed to send dealer registration acknowledgment:', err);
        }

        // Notify Admin about new dealer registration via WhatsApp
        try {
            await sendAdminWhatsAppMessage({
                templateName: 'admin_new_dealer_alert',
                parameters: [businessName, 'N/A', ownerName]
            });
        } catch (err) {
            console.error('Failed to send admin notification for new dealer:', err);
        }

        return NextResponse.json({ success: true, message: 'Your dealer application has been submitted successfully.', dealer: sanitizeUser(newDealer) }, { status: 201 });
    }

    return NextResponse.json({ error: 'Specified target signup role is not valid.' }, { status: 400 });
}
