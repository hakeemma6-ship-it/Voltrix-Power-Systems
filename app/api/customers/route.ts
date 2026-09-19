/**
 * GET  /api/customers       — Admin: list all customers
 * POST /api/customers       — Admin: create a customer manually
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, persistWrite, ensureDb, resolveCustomerCategory, deduplicateCustomers } from '@/lib/db';
import { requireRole, generateSecureToken, hashToken, sanitizeUser } from '@/lib/auth';
import { normalizePhoneNumber } from '@/lib/phone';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import type { Customer } from '@/types';

function enrichCustomerWithDeals(c: any) {
    const custPhoneNorm = c.phone ? normalizePhoneNumber(c.phone) : '';
    const deals = (db.deal_closures || []).filter((d: any) => {
        if (d.customerId && (d.customerId === c.id || d.customerId === c._id)) return true;
        if (custPhoneNorm && d.customerPhone && normalizePhoneNumber(d.customerPhone) === custPhoneNorm) return true;
        return false;
    });

    const sortedDeals = [...deals].sort((a: any, b: any) =>
        new Date(b.closedAt || b.createdAt || 0).getTime() - new Date(a.closedAt || a.createdAt || 0).getTime()
    );
    const latestDeal = sortedDeals[0];

    const allInvoices: string[] = [];
    if (c.invoiceNumber && typeof c.invoiceNumber === 'string') allInvoices.push(c.invoiceNumber);
    if (Array.isArray(c.invoiceNumbers)) {
        c.invoiceNumbers.forEach((inv: any) => {
            if (typeof inv === 'string' && inv.trim() && !allInvoices.includes(inv.trim())) {
                allInvoices.push(inv.trim());
            }
        });
    }
    sortedDeals.forEach((d: any) => {
        if (d.invoiceNumber && typeof d.invoiceNumber === 'string' && d.invoiceNumber.trim()) {
            const inv = d.invoiceNumber.trim();
            if (!allInvoices.includes(inv)) allInvoices.push(inv);
        }
    });

    const invoiceNumber = c.invoiceNumber || latestDeal?.invoiceNumber || (allInvoices.length > 0 ? allInvoices[0] : '');
    const purchaseDate = c.purchaseDate || latestDeal?.closedAt || latestDeal?.createdAt || '';

    return {
        ...c,
        category: resolveCustomerCategory(c),
        invoiceNumber: invoiceNumber ? String(invoiceNumber).trim() : '',
        invoiceNumbers: allInvoices,
        purchaseDate: purchaseDate ? String(purchaseDate).trim() : '',
        dealsCount: deals.length,
        latestDealAmount: latestDeal?.closedAmount,
        latestDealProduct: latestDeal?.productTitle || latestDeal?.productType,
    };
}

export async function GET(req: NextRequest) {
    await ensureDb();
    const authResult = requireRole(req, ['admin', 'dealer']);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    if (!db.customers) db.customers = [];

    const deduped = deduplicateCustomers(db.customers);

    if (user.role === 'admin') {
        const resolved = deduped.map((c: any) => enrichCustomerWithDeals(c));
        return NextResponse.json(resolved);
    }

    // Dealer: only see their assigned customers
    const dealer = db.dealers.find((d: any) => d.email.toLowerCase() === user.email.toLowerCase());
    if (!dealer) return NextResponse.json([]);
    const resolved = deduped
        .filter((c: any) =>
            c.assignedDealerId === dealer.id ||
            (c.assignedDealers && c.assignedDealers.some((ad: any) => ad.id === dealer.id))
        )
        .map((c: any) => enrichCustomerWithDeals(c));
    return NextResponse.json(resolved);
}

export async function POST(req: NextRequest) {
    await ensureDb();
    const authResult = requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { name, phone, email, category, notes, generateCredentials, invoiceNumber, purchaseDate } = body;

    if (!name || !phone) {
        return NextResponse.json({ error: 'Name and Phone are required.' }, { status: 400 });
    }

    if (typeof name !== 'string' || typeof phone !== 'string') {
        return NextResponse.json({ error: 'Name and Phone must be strings.' }, { status: 400 });
    }

    if (name.length > 100) return NextResponse.json({ error: 'Name must not exceed 100 characters.' }, { status: 400 });
    if (phone.length > 25) return NextResponse.json({ error: 'Phone must not exceed 25 characters.' }, { status: 400 });
    if (email && (typeof email !== 'string' || email.length > 254)) return NextResponse.json({ error: 'Email must not exceed 254 characters.' }, { status: 400 });
    if (notes && (typeof notes !== 'string' || notes.length > 2000)) return NextResponse.json({ error: 'Notes must not exceed 2000 characters.' }, { status: 400 });
    
    if (generateCredentials && !email) {
        return NextResponse.json({ error: 'Email is required to generate credentials.' }, { status: 400 });
    }

    if (!db.customers) db.customers = [];

    // 1-week (7 days) expiration for cryptographically secure one-time activation token
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const rawActivationToken = generateSecureToken(32);
    const hashedActivationToken = hashToken(rawActivationToken);
    const activationTokenExpiry = Date.now() + ONE_WEEK_MS;

    const trimmedInv = invoiceNumber ? String(invoiceNumber).trim() : '';
    const id = `cust_${Date.now()}`;
    const customer: Customer = {
        id,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || '',
        category: category?.trim() || '',
        notes: notes?.trim() || '',
        invoiceNumber: trimmedInv || undefined,
        invoiceNumbers: trimmedInv ? [trimmedInv] : undefined,
        purchaseDate: purchaseDate ? String(purchaseDate).trim() : undefined,
        source: 'manual',
        status: 'PENDING', // Always created with PENDING status until password is set
        hasLogin: false, // strictly false until activation is completed
        activationTokenHash: hashedActivationToken, // Only hashed token stored in DB
        activationTokenExpiry: activationTokenExpiry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    db.customers.push(customer);
    await persistWrite('customers', id, customer);

    // Send welcome WhatsApp notification with secure HTTPS activation link
    try {
        const rawOrigin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://voltrixpowersystems.com';
        const host = req.headers.get('host') || new URL(rawOrigin).host;
        const proto = req.headers.get('x-forwarded-proto') || (rawOrigin.startsWith('https') || !host.includes('localhost') ? 'https' : 'http');
        const origin = `${proto}://${host}`;
        const activationLink = `${origin}/#set-password?token=${encodeURIComponent(rawActivationToken)}`;

        await sendWhatsAppMessage({
            to: customer.phone,
            recipientName: customer.name,
            type: 'template',
            templateName: 'customer_welcome_credentials',
            parameters: [customer.name, activationLink]
        });
    } catch (err) {
        console.error('Failed to send customer_welcome_credentials via WhatsApp:', err);
    }

    return NextResponse.json(sanitizeUser({
        ...customer,
        category: resolveCustomerCategory(customer)
    }), { status: 201 });
}
