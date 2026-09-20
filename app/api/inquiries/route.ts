/**
 * GET  /api/inquiries  — Admin: all inquiries | Dealer: assigned inquiries | Customer: own inquiries
 * POST /api/inquiries  — Public: submit inquiry form (no auth required)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, persistWrite, ensureDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import type { Inquiry } from '@/types';
import { sendWhatsAppMessage, sendAdminWhatsAppMessage } from '@/lib/whatsapp';

export async function GET(req: NextRequest) {
    await ensureDb();
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role === 'admin') {
        return NextResponse.json(db.inquiries || []);
    }
    if (user.role === 'dealer') {
        const dealer = db.dealers?.find((d: any) =>
            (d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
            d.id === user.id ||
            d.id === user.dealerId
        );
        if (!dealer) return NextResponse.json([]);
        return NextResponse.json((db.inquiries || []).filter((i: any) => i.assignedDealerId === dealer.id));
    }
    if (user.role === 'customer') {
        const userEmail = (user.email || '').toLowerCase().trim();
        const userPhone = user.phone ? user.phone.trim() : '';
        return NextResponse.json((db.inquiries || []).filter((i: any) =>
            (userEmail && i.email && i.email.toLowerCase().trim() === userEmail) ||
            (userPhone && i.phone && i.phone.trim() === userPhone) ||
            (user.id && i.linkedCustomerId === user.id)
        ));
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
    await ensureDb();
    // Public endpoint — no authentication required
    const body = await req.json();
    const {
        name,
        email,
        phone,
        subject,
        message,
        location,
        productInterest,
        productCategory,
        latitude,
        longitude,
        addressLine1,
        addressLine2,
        zipcode,
        city,
        state,
        country
    } = body;

    if (!name || !phone) {
        return NextResponse.json({ error: 'Name and Phone are required.' }, { status: 400 });
    }

    if (typeof name !== 'string' || typeof phone !== 'string') {
        return NextResponse.json({ error: 'Name and Phone parameters must be strings.' }, { status: 400 });
    }

    if (name.length > 100) return NextResponse.json({ error: 'Name must not exceed 100 characters.' }, { status: 400 });
    if (phone.length > 25) return NextResponse.json({ error: 'Phone must not exceed 25 characters.' }, { status: 400 });
    if (email && (typeof email !== 'string' || email.length > 254)) return NextResponse.json({ error: 'Email must not exceed 254 characters.' }, { status: 400 });
    if (subject && (typeof subject !== 'string' || subject.length > 200)) return NextResponse.json({ error: 'Subject must not exceed 200 characters.' }, { status: 400 });
    if (message && (typeof message !== 'string' || message.length > 2000)) return NextResponse.json({ error: 'Message must not exceed 2000 characters.' }, { status: 400 });
    if (location && (typeof location !== 'string' || location.length > 200)) return NextResponse.json({ error: 'Location must not exceed 200 characters.' }, { status: 400 });
    if (productInterest && (typeof productInterest !== 'string' || productInterest.length > 100)) return NextResponse.json({ error: 'Product interest must not exceed 100 characters.' }, { status: 400 });
    if (productCategory && (typeof productCategory !== 'string' || productCategory.length > 100)) return NextResponse.json({ error: 'Product category must not exceed 100 characters.' }, { status: 400 });
    if (addressLine1 && (typeof addressLine1 !== 'string' || addressLine1.length > 200)) return NextResponse.json({ error: 'Address Line 1 must not exceed 200 characters.' }, { status: 400 });
    if (addressLine2 && (typeof addressLine2 !== 'string' || addressLine2.length > 200)) return NextResponse.json({ error: 'Address Line 2 must not exceed 200 characters.' }, { status: 400 });
    if (zipcode && (typeof zipcode !== 'string' || zipcode.length > 20)) return NextResponse.json({ error: 'Zipcode must not exceed 20 characters.' }, { status: 400 });
    if (city && (typeof city !== 'string' || city.length > 100)) return NextResponse.json({ error: 'City must not exceed 100 characters.' }, { status: 400 });
    if (state && (typeof state !== 'string' || state.length > 100)) return NextResponse.json({ error: 'State must not exceed 100 characters.' }, { status: 400 });
    if (country && (typeof country !== 'string' || country.length > 100)) return NextResponse.json({ error: 'Country must not exceed 100 characters.' }, { status: 400 });

    const id = `inq_${Date.now()}`;
    const userAuth = getAuthUser(req);
    let linkedCustomerId: string | undefined = undefined;
    if (userAuth?.role === 'customer') {
        linkedCustomerId = userAuth.id;
    } else if (db.customers) {
        const existing = db.customers.find((c: any) =>
            (email && c.email && c.email.toLowerCase() === email.toLowerCase().trim()) ||
            (phone && c.phone && c.phone.trim() === phone.trim())
        );
        if (existing) linkedCustomerId = existing.id;
    }

    const inquiry: Inquiry = {
        id,
        name: name.trim(),
        email: (email || '').trim().toLowerCase(),
        phone: phone.trim(),
        subject: (subject || 'Product Inquiry').trim(),
        message: (message || '').trim(),
        status: 'new',
        productInterest: productInterest || '',
        productCategory: productCategory || '',
        location: location || '',
        linkedCustomerId,
        latitude: typeof latitude === 'number' ? latitude : undefined,
        longitude: typeof longitude === 'number' ? longitude : undefined,
        addressLine1: addressLine1 || '',
        addressLine2: addressLine2 || '',
        zipcode: zipcode || '',
        city: city || '',
        state: state || '',
        country: country || '',
        createdAt: new Date().toISOString(),
        isSeenByAdmin: false,
    };

    // 1. If an existing customer matches this phone or email, link to their profile
    if (db.customers && Array.isArray(db.customers)) {
        const cleanPhone = phone ? phone.trim() : '';
        const cleanEmail = email ? email.trim().toLowerCase() : '';
        const existingCust = db.customers.find((c: any) =>
            (cleanPhone && c.phone && c.phone.trim() === cleanPhone) ||
            (cleanEmail && c.email && c.email.toLowerCase().trim() === cleanEmail)
        );
        if (existingCust) {
            inquiry.linkedCustomerId = existingCust.id;
        }
    }

    // 2. Assign Dealer (explicitly passed or matching region/first approved)
    let assignedDealer: any = null;
    if (body.dealerId) {
        assignedDealer = db.dealers?.find((d: any) => d.id === body.dealerId || d._id === body.dealerId);
    }
    if (!assignedDealer && db.dealers && db.dealers.length > 0) {
        const approvedDealers = db.dealers.filter((d: any) => d.status === 'approved');
        if (state) {
            assignedDealer = approvedDealers.find((d: any) => d.state && d.state.toLowerCase() === state.toLowerCase());
        }
        if (!assignedDealer && approvedDealers.length > 0) {
            assignedDealer = approvedDealers[0];
        }
    }

    if (assignedDealer) {
        inquiry.assignedDealerId = assignedDealer.id;
        inquiry.assignedDealerName = assignedDealer.companyName || assignedDealer.name;
    }

    if (!db.inquiries) db.inquiries = [];
    db.inquiries.unshift(inquiry);
    await persistWrite('inquiries', id, inquiry);

    // 3. Notifications
    if (!db.notifications) db.notifications = [];

    // 3a. Admin in-app notification
    const adminNotifId = `notif_admin_inq_${id}_${Date.now()}`;
    const adminNotif = {
        id: adminNotifId,
        type: 'new_inquiry',
        role: 'admin',
        inquiryId: id,
        message: `New Quote Request: ${name} (${phone}) for ${productInterest || productCategory || 'Product'}.`,
        isRead: false,
        createdAt: new Date().toISOString()
    };
    db.notifications.unshift(adminNotif);
    await persistWrite('notifications', adminNotifId, adminNotif);

    // 3b. Dealer in-app & WhatsApp notification
    if (assignedDealer) {
        const dealerNotifId = `notif_dealer_inq_${id}_${Date.now()}`;
        const dealerNotif = {
            id: dealerNotifId,
            type: 'lead_assigned',
            dealerId: assignedDealer.id,
            dealerEmail: assignedDealer.email?.toLowerCase(),
            inquiryId: id,
            message: `New product inquiry lead: ${name} (${phone}) for ${productInterest || productCategory || 'Power Systems'}. Location: ${city || state || location || 'India'}.`,
            isRead: false,
            createdAt: new Date().toISOString()
        };
        db.notifications.unshift(dealerNotif);
        await persistWrite('notifications', dealerNotifId, dealerNotif);

        if (assignedDealer.phone) {
            try {
                await sendWhatsAppMessage({
                    to: assignedDealer.phone,
                    recipientName: assignedDealer.name || 'Partner',
                    templateName: 'dealer_lead_alert',
                    parameters: [assignedDealer.name || 'Partner', name, phone, productInterest || 'Product']
                });
            } catch (err) {
                console.error('Failed to notify dealer via WhatsApp on new inquiry:', err);
            }
        }
    }

    // 3c. Admin WhatsApp Alert
    try {
        await sendAdminWhatsAppMessage({
            templateName: 'admin_new_lead_alert',
            parameters: [name, phone, subject || 'General Sizing & Quote Request']
        });
    } catch (err) {
        console.error('Failed to notify admin on new inquiry:', err);
    }

    return NextResponse.json({ success: true, id, message: 'Inquiry submitted successfully.', ...inquiry }, { status: 201 });
}
