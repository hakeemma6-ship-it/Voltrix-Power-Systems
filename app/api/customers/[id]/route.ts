/**
 * GET    /api/customers/[id]            — Get single customer
 * PATCH  /api/customers/[id]            — Update customer (assign dealer, update status, etc.)
 * DELETE /api/customers/[id]            — Admin: delete customer
 *
 * Special PATCH actions via body.action:
 *   'assign'            — assign to a dealer
 *   'generate_password' — generate login credentials for customer after order is placed
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, persistWrite, syncDatabaseOnBoot, resolveCustomerCategory } from '@/lib/db';
import { requireRole, sanitizeUser, generateSecureToken, hashToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    await syncDatabaseOnBoot();
    const { id } = await params;
    const authResult = requireRole(req, ['admin', 'dealer', 'customer']);
    if (authResult instanceof NextResponse) return authResult;

    if (!db.customers) db.customers = [];
    const customer = db.customers.find((c: any) => c.id === id);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const { user } = authResult;
    if (user.role === 'customer') {
        const isOwn = (user.id === id || user.customerId === id || (customer.email && user.email && customer.email.toLowerCase() === user.email.toLowerCase()));
        if (!isOwn) {
            return NextResponse.json({ error: 'Forbidden: You can only access your own customer record.' }, { status: 403 });
        }
    } else if (user.role === 'dealer') {
        const dealer = db.dealers?.find((d: any) => d.email && d.email.toLowerCase() === user.email.toLowerCase());
        const isAssigned = dealer && (
            customer.assignedDealerId === dealer.id ||
            (customer.assignedDealers && customer.assignedDealers.some((ad: any) => ad.id === dealer.id))
        );
        if (!isAssigned) {
            return NextResponse.json({ error: 'Forbidden: You are not assigned to this customer.' }, { status: 403 });
        }
    }

    return NextResponse.json(sanitizeUser({
        ...customer,
        category: resolveCustomerCategory(customer)
    }));
}

export async function PATCH(req: NextRequest, { params }: Params) {
    await syncDatabaseOnBoot();
    const { id } = await params;
    const authResult = requireRole(req, ['admin', 'dealer', 'customer']);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    if (!db.customers) db.customers = [];
    const idx = db.customers.findIndex((c: any) => c.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const body = await req.json();
    const { action, dealerId, ...updates } = body;

    if (user.role === 'customer') {
        const isOwn = (user.id === id || user.customerId === id || (db.customers[idx].email && user.email && db.customers[idx].email.toLowerCase() === user.email.toLowerCase()));
        if (!isOwn) {
            return NextResponse.json({ error: 'Forbidden: You can only update your own customer record.' }, { status: 403 });
        }
        if (action) {
            return NextResponse.json({ error: 'Forbidden: Administrative actions are not permitted for customer role.' }, { status: 403 });
        }
    }

    if (action === 'accept_lead') {
        const dealer = db.dealers.find((d: any) =>
            (d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
            d.id === user.id ||
            d.id === user.dealerId
        );
        const isAssigned = db.customers[idx].assignedDealerId === dealer?.id ||
            (db.customers[idx].assignedDealers && db.customers[idx].assignedDealers.some((ad: any) => ad.id === dealer?.id));

        if (user.role === 'dealer' && (!dealer || !isAssigned)) {
            return NextResponse.json({ error: 'Forbidden: You are not assigned to this customer.' }, { status: 403 });
        }

        db.customers[idx] = {
            ...db.customers[idx],
            status: 'in_discussion',
            updatedAt: new Date().toISOString(),
        };
        await persistWrite('customers', id, db.customers[idx]);

        // Synchronize linked inquiry in db.inquiries
        if (db.inquiries) {
            const inq = db.inquiries.find((i: any) =>
                (db.customers[idx].linkedInquiryId && i.id === db.customers[idx].linkedInquiryId) ||
                i.linkedCustomerId === id ||
                (db.customers[idx].phone && i.phone === db.customers[idx].phone) ||
                (db.customers[idx].email && i.email && i.email.toLowerCase() === db.customers[idx].email.toLowerCase())
            );
            if (inq) {
                inq.status = 'in_discussion';
                inq.updatedAt = new Date().toISOString();
                await persistWrite('inquiries', inq.id, inq);
            }
        }

        // Dispatch in-app customer notification
        if (db.customers[idx].email) {
            const custNotifId = `notif_lead_accepted_${id}_${Date.now()}`;
            const custNotif = {
                id: custNotifId,
                type: 'lead_accepted',
                customerEmail: db.customers[idx].email.toLowerCase().trim(),
                customerId: id,
                dealerId: dealer?.id || '',
                message: `${dealer?.companyName || dealer?.name || 'Authorized Partner'} has accepted your inquiry and started discussion.`,
                isRead: false,
                createdAt: new Date().toISOString(),
            };
            if (!db.notifications) db.notifications = [];
            db.notifications.push(custNotif);
            await persistWrite('notifications', custNotifId, custNotif);
        }

        // Send WhatsApp customer notification: dealer_accepts_inquiry
        try {
            await sendWhatsAppMessage({
                to: db.customers[idx].phone || '',
                recipientName: db.customers[idx].name || 'Customer',
                type: 'template',
                templateName: 'dealer_accepts_inquiry',
                parameters: [
                    db.customers[idx].name || 'Customer',
                    dealer?.companyName || dealer?.name || 'Voltrix Reseller Partner',
                    db.customers[idx].linkedInquiryId || db.customers[idx].id || 'N/A'
                ],
                associatedInquiryId: db.customers[idx].linkedInquiryId || undefined
            });
        } catch (err) {
            console.error('Failed to send dealer_accepts_inquiry WhatsApp:', err);
        }

        return NextResponse.json(sanitizeUser({
            ...db.customers[idx],
            category: resolveCustomerCategory(db.customers[idx])
        }));
    }

    if (action === 'assign') {
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden: Only admin can perform this action.' }, { status: 403 });
        // Assign customer to a dealer
        if (!dealerId) return NextResponse.json({ error: 'dealerId is required for assign action.' }, { status: 400 });
        const dealer = db.dealers.find((d: any) => d.id === dealerId);
        if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
        if (dealer.status !== 'approved') {
            return NextResponse.json({ error: 'Dealer is not approved yet.' }, { status: 400 });
        }

        let assignedDealers = db.customers[idx].assignedDealers || [];
        if (assignedDealers.length === 0 && db.customers[idx].assignedDealerId) {
            assignedDealers.push({
                id: db.customers[idx].assignedDealerId,
                name: db.customers[idx].assignedDealerName || ''
            });
        }

        const dealerEntry = { id: dealer.id, name: dealer.companyName || dealer.name };
        if (!assignedDealers.some((ad: any) => ad.id === dealer.id)) {
            assignedDealers.push(dealerEntry);
        }

        db.customers[idx] = {
            ...db.customers[idx],
            assignedDealerId: assignedDealers[0].id,
            assignedDealerName: assignedDealers.map((ad: any) => ad.name).join(', '),
            assignedDealers: assignedDealers,
            status: 'assigned',
            updatedAt: new Date().toISOString(),
        };
        await persistWrite('customers', id, db.customers[idx]);

        // Synchronize linked inquiry in db.inquiries
        if (!db.inquiries) db.inquiries = [];
        const inq = db.inquiries.find((i: any) =>
            (db.customers[idx].linkedInquiryId && i.id === db.customers[idx].linkedInquiryId) ||
            (db.customers[idx].phone && i.customerPhone === db.customers[idx].phone) ||
            (db.customers[idx].email && i.customerEmail?.toLowerCase() === db.customers[idx].email.toLowerCase())
        );
        if (inq) {
            inq.assignedDealerId = dealer.id;
            inq.assignedDealerName = dealer.companyName || dealer.name;
            inq.status = 'assigned';
            inq.updatedAt = new Date().toISOString();
            await persistWrite('inquiries', inq.id, inq);
        }

        // In-app notifications for dealer and customer
        if (!db.notifications) db.notifications = [];
        const dealerNotifId = `notif_lead_${id}_${Date.now()}`;
        const dealerNotif = {
            id: dealerNotifId,
            type: 'lead_assigned',
            dealerId: dealer.id,
            dealerEmail: dealer.email?.toLowerCase(),
            customerId: id,
            message: `New customer assigned: ${db.customers[idx].name} (${db.customers[idx].phone || 'N/A'}) for ${db.customers[idx].category || 'Power Systems'}.`,
            isRead: false,
            createdAt: new Date().toISOString(),
        };
        db.notifications.push(dealerNotif);
        await persistWrite('notifications', dealerNotifId, dealerNotif);

        if (db.customers[idx].email) {
            const custNotifId = `notif_assigned_${id}_${Date.now()}`;
            const custNotif = {
                id: custNotifId,
                type: 'dealer_assigned',
                customerEmail: db.customers[idx].email.toLowerCase().trim(),
                customerId: id,
                dealerId: dealer.id,
                message: `Voltrix Partner ${dealer.companyName || dealer.name} has been assigned to support your power system requirement.`,
                isRead: false,
                createdAt: new Date().toISOString(),
            };
            db.notifications.push(custNotif);
            await persistWrite('notifications', custNotifId, custNotif);
        }

        // Send WhatsApp notification to the assigned dealer asynchronously so response returns instantly
        sendWhatsAppMessage({
            to: dealer.phone || '',
            recipientName: dealer.name || 'Dealer Partner',
            type: 'template',
            templateName: 'lead_assigned_to_dealer',
            parameters: [
                dealer.companyName || dealer.name,
                db.customers[idx].linkedInquiryId || db.customers[idx].id || 'N/A',
                db.customers[idx].category || 'Power Systems',
                db.customers[idx].phone || 'N/A'
            ],
            associatedDealerId: dealerId,
            associatedInquiryId: db.customers[idx].linkedInquiryId || undefined
        }).catch(err => {
            console.error('[WhatsApp Async Lead Notification Error]:', err);
        });

        return NextResponse.json(sanitizeUser({
            ...db.customers[idx],
            category: resolveCustomerCategory(db.customers[idx])
        }));
    }

    if (action === 'unassign') {
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Only administrators can unassign dealers.' }, { status: 403 });
        }
        if (!dealerId) return NextResponse.json({ error: 'dealerId is required for unassign action.' }, { status: 400 });

        let assignedDealers = db.customers[idx].assignedDealers || [];
        if (assignedDealers.length === 0 && db.customers[idx].assignedDealerId) {
            assignedDealers.push({
                id: db.customers[idx].assignedDealerId,
                name: db.customers[idx].assignedDealerName || ''
            });
        }

        assignedDealers = assignedDealers.filter((ad: any) => ad.id !== dealerId);

        db.customers[idx] = {
            ...db.customers[idx],
            assignedDealerId: assignedDealers.length > 0 ? assignedDealers[0].id : '',
            assignedDealerName: assignedDealers.map((ad: any) => ad.name).join(', '),
            assignedDealers: assignedDealers,
            status: assignedDealers.length > 0 ? 'assigned' : 'new',
            updatedAt: new Date().toISOString(),
        };
        await persistWrite('customers', id, db.customers[idx]);

        // Synchronize linked inquiry unassignment
        if (!db.inquiries) db.inquiries = [];
        const inq = db.inquiries.find((i: any) =>
            (db.customers[idx].linkedInquiryId && i.id === db.customers[idx].linkedInquiryId) ||
            (db.customers[idx].phone && i.customerPhone === db.customers[idx].phone) ||
            (db.customers[idx].email && i.customerEmail?.toLowerCase() === db.customers[idx].email.toLowerCase())
        );
        if (inq && inq.assignedDealerId === dealerId) {
            inq.assignedDealerId = assignedDealers.length > 0 ? assignedDealers[0].id : undefined;
            inq.assignedDealerName = assignedDealers.length > 0 ? assignedDealers[0].name : undefined;
            inq.status = assignedDealers.length > 0 ? 'assigned' : 'new';
            inq.updatedAt = new Date().toISOString();
            await persistWrite('inquiries', inq.id, inq);
        }

        return NextResponse.json(sanitizeUser({
            ...db.customers[idx],
            category: resolveCustomerCategory(db.customers[idx])
        }));
    }

    if (action === 'generate_password' || action === 'send_activation') {
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Only administrators can dispatch customer activation links.' }, { status: 403 });
        }
        // Admin dispatches one-time secure activation link for customer onboarding
        const customer = db.customers[idx];
        if (!customer.phone && !customer.email) {
            return NextResponse.json({ error: 'Customer must have a phone number or email to receive an activation link.' }, { status: 400 });
        }

        // 1-week (7 days) expiration for cryptographically secure one-time activation token
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        const rawActivationToken = generateSecureToken(32);
        const hashedActivationToken = hashToken(rawActivationToken);
        const activationTokenExpiry = Date.now() + ONE_WEEK_MS;

        // Update customer record: PENDING status, no password, unactivated
        (db.customers as any[])[idx] = {
            ...db.customers[idx],
            status: 'PENDING',
            hasLogin: false,
            password: undefined, // ensure no plaintext or stale password
            activationTokenHash: hashedActivationToken,
            activationTokenExpiry,
            updatedAt: new Date().toISOString()
        };
        await persistWrite('customers', id, db.customers[idx]);

        // Send WhatsApp customer_welcome_credentials notification with secure HTTPS activation link
        try {
            const rawOrigin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://voltrixpowersystems.com';
            const host = req.headers.get('host') || new URL(rawOrigin).host;
            const proto = req.headers.get('x-forwarded-proto') || (rawOrigin.startsWith('https') || !host.includes('localhost') ? 'https' : 'http');
            const origin = `${proto}://${host}`;
            const activationLink = `${origin}/#set-password?token=${encodeURIComponent(rawActivationToken)}`;
            
            await sendWhatsAppMessage({
                to: customer.phone || '',
                recipientName: customer.name,
                type: 'template',
                templateName: 'customer_welcome_credentials',
                parameters: [
                    customer.name,
                    activationLink
                ]
            });
        } catch (err) {
            console.error('Failed to send activation link via WhatsApp:', err);
        }

        return NextResponse.json({
            success: true,
            message: 'One-time activation link dispatched to customer via WhatsApp.',
            email: customer.email,
        });
    }

    // Generic field updates
    let allowedUpdates = updates;
    if (user.role === 'dealer') {
        const dealer = db.dealers?.find((d: any) => d.email && d.email.toLowerCase() === user.email.toLowerCase());
        const isAssigned = dealer && (
            db.customers[idx].assignedDealerId === dealer.id ||
            (db.customers[idx].assignedDealers && db.customers[idx].assignedDealers.some((ad: any) => ad.id === dealer.id))
        );
        if (!isAssigned) {
            return NextResponse.json({ error: 'Forbidden: You are not assigned to this customer.' }, { status: 403 });
        }
        // Dealers can only update customer notes, status, invoiceNumber, or purchaseDate
        allowedUpdates = {};
        if (updates.notes !== undefined) allowedUpdates.notes = updates.notes;
        if (updates.status !== undefined && ['in_discussion', 'assigned', 'completed'].includes(updates.status)) {
            allowedUpdates.status = updates.status;
        }
        if (updates.invoiceNumber !== undefined) allowedUpdates.invoiceNumber = String(updates.invoiceNumber).trim();
        if (updates.purchaseDate !== undefined) allowedUpdates.purchaseDate = updates.purchaseDate;
    }

    if (allowedUpdates.invoiceNumber) {
        const trimmed = String(allowedUpdates.invoiceNumber).trim();
        const currentInvoices = Array.isArray(db.customers[idx].invoiceNumbers) ? db.customers[idx].invoiceNumbers : [];
        if (!currentInvoices.includes(trimmed)) {
            allowedUpdates.invoiceNumbers = [...currentInvoices, trimmed];
        }
    }

    db.customers[idx] = {
        ...db.customers[idx],
        ...allowedUpdates,
        updatedAt: new Date().toISOString(),
    };
    await persistWrite('customers', id, db.customers[idx]);
    return NextResponse.json(sanitizeUser({
        ...db.customers[idx],
        category: resolveCustomerCategory(db.customers[idx])
    }));
}


export async function DELETE(req: NextRequest, { params }: Params) {
    await syncDatabaseOnBoot();
    const { id } = await params;
    const authResult = requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    if (!db.customers) db.customers = [];
    const idx = db.customers.findIndex((c: any) => c.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const customer = db.customers[idx];
    const customerId = customer.id;
    const customerEmail = customer.email?.toLowerCase();
    const customerPhone = customer.phone;
    const linkedInquiryId = customer.linkedInquiryId;

    // 1. Remove the customer
    db.customers.splice(idx, 1);

    // 2. Remove related deal closures
    if (db.deal_closures) {
        db.deal_closures = db.deal_closures.filter((d: any) =>
            d.customerId !== customerId &&
            !(customerPhone && d.customerPhone === customerPhone)
        );
    }

    // 4. Remove related inquiries
    let inquiryIdsToDelete: string[] = [];
    if (db.inquiries) {
        const inquiriesToDelete = db.inquiries.filter((inq: any) => {
            return (linkedInquiryId && inq.id === linkedInquiryId) ||
                inq.linkedCustomerId === customerId ||
                (customerEmail && inq.email?.toLowerCase() === customerEmail) ||
                (customerPhone && inq.phone === customerPhone);
        });
        inquiryIdsToDelete = inquiriesToDelete.map((inq: any) => inq.id);
        db.inquiries = db.inquiries.filter((inq: any) => !inquiryIdsToDelete.includes(inq.id));
    }

    // 5. Remove related customer users (if generated login credentials exist)
    let userIdsToDelete: string[] = [];
    if (db.users) {
        const usersToDelete = db.users.filter((u: any) => {
            return u.role === 'customer' && (
                (customerEmail && u.email?.toLowerCase() === customerEmail) ||
                (customerPhone && u.phone === customerPhone)
            );
        });
        userIdsToDelete = usersToDelete.map((u: any) => u.id);
        db.users = db.users.filter((u: any) => !userIdsToDelete.includes(u.id));
    }

    // MongoDB clean up
    const mongoDb = (global as any).__voltrix_mongoDb;
    if (mongoDb) {
        try {
            await mongoDb.collection('customers').deleteOne({ _id: customerId });

            await mongoDb.collection('deal_closures').deleteMany({ customerId });
            if (inquiryIdsToDelete.length > 0) {
                await mongoDb.collection('inquiries').deleteMany({ _id: { $in: inquiryIdsToDelete } });
            }
            if (userIdsToDelete.length > 0) {
                await mongoDb.collection('Admin').deleteMany({ _id: { $in: userIdsToDelete } });
            }
        } catch (mongoErr: any) {
            console.error('[DB Customer Delete Cascade] MongoDB deletion failed:', mongoErr.message);
        }
    }

    return NextResponse.json({ success: true });
}
