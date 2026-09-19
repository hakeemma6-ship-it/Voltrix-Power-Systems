/**
 * PUT /api/customer/notifications/read-all — Mark all customer notifications read for an email
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, persistWrite, syncDatabaseOnBoot } from '@/lib/db';

import { getAuthUser } from '@/lib/auth';

export async function PUT(req: NextRequest) {
    await syncDatabaseOnBoot();
    const user = getAuthUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const customerEmail = body.customerEmail || body.email;
    if (!customerEmail) {
        return NextResponse.json({ error: 'customerEmail is required' }, { status: 400 });
    }

    const emailLower = customerEmail.toLowerCase();
    if (user.role === 'customer' && user.email.toLowerCase() !== emailLower) {
        return NextResponse.json({ error: 'Forbidden: Access denied.' }, { status: 403 });
    }
    if (user.role !== 'admin' && user.role !== 'customer') {
        return NextResponse.json({ error: 'Forbidden: Insufficient permissions.' }, { status: 403 });
    }
    const filtered = db.notifications.filter((n: any) => n.customerEmail?.toLowerCase() === emailLower && !n.isRead);

    for (const notif of filtered) {
        notif.isRead = true;
        await persistWrite('notifications', notif.id, notif);
    }

    return NextResponse.json({ success: true, count: filtered.length });
}
