/**
 * PATCH /api/inquiries/[id]/assign — Admin assigns an inquiry to a dealer
 * Body: { dealerId: string }
 * Also creates a Customer record linked to this inquiry if one doesn't exist.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, persistWrite, syncDatabaseOnBoot } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
    await syncDatabaseOnBoot();
    const { id } = await params;
    const authResult = requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { dealerId } = await req.json();
    if (!dealerId) return NextResponse.json({ error: 'dealerId is required.' }, { status: 400 });

    const inquiryIdx = db.inquiries.findIndex((i: any) => i.id === id);
    if (inquiryIdx === -1) return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });

    const dealer = db.dealers.find((d: any) => d.id === dealerId);
    if (!dealer) return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    if (dealer.status !== 'approved') {
        return NextResponse.json({ error: 'Dealer is not approved.' }, { status: 400 });
    }

    // Update the inquiry
    const inquiry = db.inquiries[inquiryIdx];
    db.inquiries[inquiryIdx] = {
        ...inquiry,
        assignedDealerId: dealer.id,
        assignedDealerName: dealer.companyName || dealer.name,
        status: 'assigned',
        isSeenByAdmin: true,
    };
    await persistWrite('inquiries', id, db.inquiries[inquiryIdx]);

    // Send WhatsApp notification to the assigned dealer asynchronously so response returns instantly
    sendWhatsAppMessage({
        to: dealer.phone || '',
        recipientName: dealer.name || 'Dealer Partner',
        type: 'template',
        templateName: 'lead_assigned_to_dealer',
        parameters: [
            dealer.companyName || dealer.name,
            id,
            inquiry.productInterest || inquiry.productCategory || 'Power Stabilizers',
            inquiry.phone
        ],
        associatedDealerId: dealerId,
        associatedInquiryId: id
    }).catch(err => {
        console.error('[WhatsApp Async Error in inquiry assign]:', err);
    });

    // Create a Customer record if one doesn't exist for this inquiry
    if (!db.customers) db.customers = [];
    const existingCust = db.customers.find((c: any) =>
        c.linkedInquiryId === id ||
        (inquiry.email && c.email && c.email.toLowerCase().trim() === inquiry.email.toLowerCase().trim()) ||
        (inquiry.phone && c.phone && c.phone.trim() === inquiry.phone.trim())
    );

    if (!existingCust) {
        const custId = `cust_inq_${Date.now()}`;
        const newCustomer = {
            id: custId,
            name: inquiry.name,
            phone: inquiry.phone,
            email: inquiry.email || '',
            category: inquiry.productCategory || inquiry.productInterest || '',
            notes: inquiry.message || '',
            source: 'inquiry' as const,
            linkedInquiryId: id,
            assignedDealerId: dealer.id,
            assignedDealerName: dealer.companyName || dealer.name,
            assignedDealers: [{ id: dealer.id, name: dealer.companyName || dealer.name }],
            status: 'assigned' as const,
            hasLogin: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        db.customers.push(newCustomer);
        await persistWrite('customers', custId, newCustomer);

        // Link back to inquiry
        db.inquiries[inquiryIdx] = { ...db.inquiries[inquiryIdx], linkedCustomerId: custId };
        await persistWrite('inquiries', id, db.inquiries[inquiryIdx]);
    } else {
        // Update existing customer assignment
        const custIdx = db.customers.findIndex((c: any) => c.id === existingCust.id);
        if (custIdx !== -1) {
            let assignedDealers = db.customers[custIdx].assignedDealers || [];
            if (!assignedDealers.some((ad: any) => ad.id === dealer.id)) {
                assignedDealers = [...assignedDealers, { id: dealer.id, name: dealer.companyName || dealer.name }];
            }

            db.customers[custIdx] = {
                ...db.customers[custIdx],
                linkedInquiryId: db.customers[custIdx].linkedInquiryId || id,
                assignedDealerId: dealer.id,
                assignedDealerName: dealer.companyName || dealer.name,
                assignedDealers,
                status: 'assigned',
                updatedAt: new Date().toISOString(),
            };
            await persistWrite('customers', db.customers[custIdx].id, db.customers[custIdx]);

            // Link back to inquiry
            db.inquiries[inquiryIdx] = { ...db.inquiries[inquiryIdx], linkedCustomerId: existingCust.id };
            await persistWrite('inquiries', id, db.inquiries[inquiryIdx]);
        }
    }

    // In-app notifications
    if (!db.notifications) db.notifications = [];
    const dealerNotifId = `notif_inq_${id}_${Date.now()}`;
    const dealerNotif = {
        id: dealerNotifId,
        type: 'lead_assigned',
        dealerId: dealer.id,
        dealerEmail: dealer.email?.toLowerCase(),
        inquiryId: id,
        message: `New inquiry lead assigned: ${inquiry.name} (${inquiry.phone}) for ${inquiry.productCategory || inquiry.productInterest || 'Power Systems'}.`,
        isRead: false,
        createdAt: new Date().toISOString(),
    };
    db.notifications.push(dealerNotif);
    await persistWrite('notifications', dealerNotifId, dealerNotif);

    if (inquiry.email) {
        const custNotifId = `notif_inq_cust_${id}_${Date.now()}`;
        const custNotif = {
            id: custNotifId,
            type: 'dealer_assigned',
            customerEmail: inquiry.email.toLowerCase().trim(),
            inquiryId: id,
            dealerId: dealer.id,
            message: `Voltrix Partner ${dealer.companyName || dealer.name} has been assigned to assist with your inquiry (${inquiry.subject}).`,
            isRead: false,
            createdAt: new Date().toISOString(),
        };
        db.notifications.push(custNotif);
        await persistWrite('notifications', custNotifId, custNotif);
    }

    return NextResponse.json({ success: true, inquiry: db.inquiries[inquiryIdx] });
}
