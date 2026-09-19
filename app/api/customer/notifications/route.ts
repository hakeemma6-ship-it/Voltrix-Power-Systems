import { NextRequest, NextResponse } from 'next/server';
import { db, syncDatabaseOnBoot, cleanupOldNotifications } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
    await syncDatabaseOnBoot();
    await cleanupOldNotifications();
    const user = getAuthUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const customerEmail = searchParams.get('customerEmail') || searchParams.get('email');
    if (!customerEmail) {
        return NextResponse.json({ error: 'customerEmail parameter is required.' }, { status: 400 });
    }

    const emailLower = customerEmail.toLowerCase();
    if (user.role === 'customer') {
        if (user.email.toLowerCase() !== emailLower) {
            return NextResponse.json({ error: 'Forbidden: Access denied.' }, { status: 403 });
        }
    } else if (user.role === 'dealer') {
        const dealer = db.dealers?.find((d: any) => d.email && d.email.toLowerCase() === user.email.toLowerCase());
        const customer = db.customers?.find((c: any) => c.email && c.email.toLowerCase() === emailLower);
        const isAssigned = dealer && customer && (
            customer.assignedDealerId === dealer.id ||
            (customer.assignedDealers && customer.assignedDealers.some((ad: any) => ad.id === dealer.id))
        );
        if (!isAssigned) {
            return NextResponse.json({ error: 'Forbidden: You are not assigned to this customer.' }, { status: 403 });
        }
    } else if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const filtered = db.notifications
        .filter((n: any) => n.customerEmail?.toLowerCase() === emailLower)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(filtered);
}
