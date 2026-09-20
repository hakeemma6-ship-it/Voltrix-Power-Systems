/**
 * POST /api/inquiries/[id]/add-customer — Admin converts an inquiry into a newly registered Customer
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, persistWrite, ensureDb } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { normalizePhoneNumber } from '@/lib/phone';
import type { Customer } from '@/types';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    await ensureDb();
    const { id } = await params;

    // Only administrators can convert inquiries into registered customers
    const authResult = requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    if (!db.inquiries) db.inquiries = [];
    const inquiry = db.inquiries.find((i: any) => i.id === id);
    if (!inquiry) {
        return NextResponse.json({ error: 'Inquiry not found.' }, { status: 404 });
    }

    if (!db.customers) db.customers = [];

    // 1. Check if customer already exists for this inquiry
    let existingCust: any = null;
    if (inquiry.linkedCustomerId) {
        existingCust = db.customers.find((c: any) => c.id === inquiry.linkedCustomerId || c._id === inquiry.linkedCustomerId);
    }

    if (!existingCust && inquiry.phone) {
        const phoneNorm = normalizePhoneNumber(inquiry.phone);
        existingCust = db.customers.find((c: any) => {
            const cp = c.phone ? normalizePhoneNumber(c.phone) : '';
            return cp && cp.endsWith(phoneNorm.slice(-10));
        });
    }

    if (existingCust) {
        // Already registered — ensure inquiry is linked
        if (inquiry.linkedCustomerId !== existingCust.id) {
            inquiry.linkedCustomerId = existingCust.id;
            await persistWrite('inquiries', inquiry.id, inquiry);
        }
        return NextResponse.json({
            success: true,
            message: `Customer "${existingCust.name}" is already registered.`,
            customer: existingCust,
            inquiry
        });
    }

    // 2. Create new Customer record from inquiry details
    const newCustId = `cust_inq_${Date.now()}`;
    const newCustomer: Customer = {
        id: newCustId,
        name: inquiry.name.trim(),
        phone: inquiry.phone.trim(),
        email: inquiry.email ? inquiry.email.trim().toLowerCase() : '',
        companyName: (inquiry as any).companyName || '',
        address: inquiry.addressLine1 || inquiry.location || '',
        city: inquiry.city || '',
        state: inquiry.state || '',
        country: inquiry.country || 'India',
        zipcode: inquiry.zipcode || '',
        category: inquiry.productCategory || inquiry.productInterest || 'Power Equipment',
        notes: inquiry.message ? `Quote Request: ${inquiry.message}` : `Created from inquiry for ${inquiry.productInterest || 'power solutions'}`,
        source: 'inquiry',
        status: 'active',
        linkedInquiryId: inquiry.id,
        assignedDealerId: inquiry.assignedDealerId || undefined,
        assignedDealerName: inquiry.assignedDealerName || undefined,
        assignedDealers: inquiry.assignedDealerId
            ? [{ id: inquiry.assignedDealerId, name: inquiry.assignedDealerName || '' }]
            : [],
        hasLogin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    db.customers.unshift(newCustomer);
    await persistWrite('customers', newCustId, newCustomer);

    // 3. Link customer to inquiry
    inquiry.linkedCustomerId = newCustId;
    if (inquiry.status === 'new') {
        inquiry.status = 'in_discussion';
    }
    inquiry.isSeenByAdmin = true;
    await persistWrite('inquiries', inquiry.id, inquiry);

    // 4. Create admin notification
    if (!db.notifications) db.notifications = [];
    const notifId = `notif_cust_added_${newCustId}_${Date.now()}`;
    const notif = {
        id: notifId,
        type: 'customer_created',
        title: 'Customer Added from Inquiry',
        message: `Admin added "${newCustomer.name}" (${newCustomer.phone}) as a new customer from quote inquiry ${inquiry.id}.`,
        targetRole: 'admin',
        referenceId: newCustId,
        createdAt: new Date().toISOString(),
        isRead: false
    };
    db.notifications.unshift(notif);
    await persistWrite('notifications', notifId, notif);

    return NextResponse.json({
        success: true,
        message: `Customer "${newCustomer.name}" added successfully!`,
        customer: newCustomer,
        inquiry
    }, { status: 201 });
}
