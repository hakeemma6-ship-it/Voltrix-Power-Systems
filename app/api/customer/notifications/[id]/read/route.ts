import { NextRequest, NextResponse } from 'next/server';
import { db, persistWrite, syncDatabaseOnBoot } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await syncDatabaseOnBoot();
    const authResult = requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const notif = db.notifications.find((n: any) => n.id === id) as any;
    if (!notif) {
        return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
    }

    // Authorization: Customers can only mark their own notifications as read
    if (user.role === 'customer' && notif.customerEmail && notif.customerEmail.toLowerCase() !== user.email.toLowerCase()) {
        return NextResponse.json({ error: 'Forbidden: Access denied to this notification.' }, { status: 403 });
    }

    notif.isRead = true;
    await persistWrite('notifications', notif.id, notif);
    return NextResponse.json({ success: true, notification: notif });
}

