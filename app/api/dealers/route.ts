/**
 * GET  /api/dealers — Admin: list all dealers | Dealer: get own profile
 * POST /api/dealers — Public: dealer self-registration (single-stage, no auth required)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, persistWrite, deduplicateDealers, syncDatabaseOnBoot, isMongoReady, getMongoDb, escapeRegExp } from '@/lib/db';
import { getAuthUser, sanitizeUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendWhatsAppMessage, sendAdminWhatsAppMessage } from '@/lib/whatsapp';

export async function GET(req: NextRequest) {
    await syncDatabaseOnBoot();
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role === 'admin') {
        if (isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                const remoteData = await mongoDb.collection('dealers').find({}).toArray();
                const clean = remoteData.map((d: any) => {
                    const c = { ...d };
                    if (c._id && typeof c._id !== 'string') c._id = c._id.toString();
                    if (!c.id) c.id = c._id;
                    return c;
                });
                db.dealers = deduplicateDealers(clean);
            } catch (err) {
                console.error('[GET /api/dealers] MongoDB read error:', err);
                db.dealers = deduplicateDealers(db.dealers);
            }
        } else {
            db.dealers = deduplicateDealers(db.dealers);
        }
        return NextResponse.json(db.dealers.map((d: any) => sanitizeUser(d)));
    }

    if (user.role === 'dealer') {
        let d = db.dealers.find((dl: any) => dl.email.toLowerCase() === user.email.toLowerCase());
        if (isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                const doc = await mongoDb.collection('dealers').findOne({ email: new RegExp(`^${escapeRegExp(user.email)}$`, 'i') });
                if (doc) {
                    const c = { ...doc };
                    if (c._id && typeof c._id !== 'string') c._id = c._id.toString();
                    if (!c.id) c.id = c._id;
                    d = c;
                }
            } catch (err) {
                console.error('[GET /api/dealers] MongoDB dealer read error:', err);
            }
        }
        return NextResponse.json(d ? [sanitizeUser(d)] : []);
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
    await syncDatabaseOnBoot();
    // Public endpoint — no auth required for dealer self-registration
    const body = await req.json();
    const {
        name, companyName, email, phone, alternateMobile, city, state,
        gstin, businessType, interestedProducts,
        shopAddress, pinCode, panNumber, aadhaarNumber,
        yearsOfExperience, password,
    } = body;

    if (!name || !companyName || !email || !phone) {
        return NextResponse.json({ error: 'Name, Company Name, Email, and Phone are required.' }, { status: 400 });
    }

    if (
        typeof name !== 'string' ||
        typeof companyName !== 'string' ||
        typeof email !== 'string' ||
        typeof phone !== 'string' ||
        (password && typeof password !== 'string')
    ) {
        return NextResponse.json({ error: 'Name, Company Name, Email, Phone, and Password must be valid strings.' }, { status: 400 });
    }

    if (name.length > 100) return NextResponse.json({ error: 'Name must not exceed 100 characters.' }, { status: 400 });
    if (companyName.length > 150) return NextResponse.json({ error: 'Company Name must not exceed 150 characters.' }, { status: 400 });
    if (email.length > 254) return NextResponse.json({ error: 'Email must not exceed 254 characters.' }, { status: 400 });
    if (phone.length > 25) return NextResponse.json({ error: 'Phone must not exceed 25 characters.' }, { status: 400 });
    if (password && password.length > 128) return NextResponse.json({ error: 'Password must not exceed 128 characters.' }, { status: 400 });

    const formattedEmail = email.trim().toLowerCase();

    // Check for duplicate email
    const exists = db.dealers.find((d: any) => d.email.toLowerCase() === formattedEmail);
    if (exists) {
        return NextResponse.json({ error: 'A dealer with this email already exists.' }, { status: 409 });
    }

    const id = `dealer_${Date.now()}`;
    const hashedPassword = password ? bcrypt.hashSync(password.trim(), 10) : '';

    const dealer = {
        id,
        name: name.trim(),
        companyName: companyName.trim(),
        email: formattedEmail,
        phone: phone.trim(),
        alternateMobile: alternateMobile?.trim() || '',
        city: city?.trim() || '',
        state: state?.trim() || '',
        gstin: gstin?.trim() || '',
        businessType: businessType || 'Proprietorship',
        interestedProducts: interestedProducts || [],
        shopAddress: shopAddress?.trim() || '',
        pinCode: pinCode?.trim() || '',
        panNumber: panNumber?.trim() || '',
        aadhaarNumber: aadhaarNumber?.trim() || '',
        yearsOfExperience: yearsOfExperience || '',
        password: hashedPassword,
        status: 'pending' as const,
        registeredAt: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString().split('T')[0],
        notes: [],
        whatsappLogs: [],
        isSeenByAdmin: false,
    };

    db.dealers.push(dealer);
    await persistWrite('dealers', id, dealer);

    // Sync user record for authentication
    const userRecord = {
        id: `usr_${id}`,
        _id: `usr_${id}`,
        email: formattedEmail,
        password: hashedPassword,
        name: name.trim(),
        companyName: companyName.trim(),
        role: 'dealer',
        status: 'pending',
        dealerId: id,
        createdAt: new Date().toISOString(),
    };
    db.users.push(userRecord);
    await persistWrite('users', userRecord.id, userRecord);

    // Add admin notification
    const notifId = `notif_${Date.now()}`;
    const notif = {
        id: notifId,
        type: 'dealer_registration',
        dealerId: id,
        message: `New dealer registration: ${companyName} (${name}) from ${city || 'N/A'}`,
        isRead: false,
        createdAt: new Date().toISOString(),
    };
    db.notifications.push(notif);
    await persistWrite('notifications', notifId, notif);

    // Send WhatsApp notification to the registering dealer
    await sendWhatsAppMessage({
        to: phone,
        recipientName: name,
        type: 'template',
        templateName: 'dealer_registration_received',
        parameters: [name, companyName],
        associatedDealerId: id
    });

    // Notify Admin about new dealer registration via WhatsApp
    await sendAdminWhatsAppMessage({
        templateName: 'admin_new_dealer_alert',
        parameters: [companyName, city || 'N/A', name]
    });

    return NextResponse.json({ success: true, dealerId: id, message: 'Registration submitted. Admin will review and confirm shortly.' }, { status: 201 });
}
