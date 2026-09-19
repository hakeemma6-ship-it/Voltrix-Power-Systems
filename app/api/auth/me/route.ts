import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDb, resolveCustomerCategory } from '@/lib/db';
import { verifyToken, sanitizeUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
    await ensureDb();

    let token = req.cookies.get('token')?.value || '';
    if (!token) {
        const auth = req.headers.get('authorization');
        if (auth?.startsWith('Bearer ')) token = auth.slice(7);
    }

    if (!token) return NextResponse.json({ error: 'No active authenticated session.' }, { status: 401 });

    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Session token has expired or is invalid.' }, { status: 401 });
        }

        if (decoded.role === 'admin') {
            const adminEmail = (process.env.ADMIN_EMAIL || (process.env.NODE_ENV === 'production' ? decoded.email : 'admin@voltrixpower.com')).trim().toLowerCase();
            return NextResponse.json({ success: true, user: { role: 'admin', email: adminEmail || decoded.email, name: 'Executive Operations Head' } });
        }

        // Resolve user based on role or search tables
        let user: any = null;
        const decodedEmail = (decoded.email || '').toLowerCase().trim();
        const decodedId = decoded.id;

        if (decoded.role === 'dealer') {
            user = db.dealers.find((d: any) => (d.email && d.email.toLowerCase() === decodedEmail) || d.id === decodedId || d.id === decoded.dealerId);
            if (user) user = { ...user, role: 'dealer' };
        } else if (decoded.role === 'customer') {
            user = db.customers.find((c: any) => (c.email && c.email.toLowerCase() === decodedEmail) || c.id === decodedId);
            if (user) user = { ...user, role: 'customer' };
        }

        // Fallback search across all tables if not specifically resolved
        if (!user) {
            user = db.users.find((u: any) => (u.email && u.email.toLowerCase() === decodedEmail) || u.id === decodedId);
        }
        if (!user) {
            const d = db.dealers.find((dl: any) => (dl.email && dl.email.toLowerCase() === decodedEmail) || dl.id === decodedId || dl.id === decoded.dealerId);
            if (d) user = { ...d, role: 'dealer' };
        }
        if (!user) {
            const c = db.customers.find((cu: any) => (cu.email && cu.email.toLowerCase() === decodedEmail) || cu.id === decodedId);
            if (c) user = { ...c, role: 'customer' };
        }

        if (!user) return NextResponse.json({ error: 'Session identity not found.' }, { status: 404 });

        if (user.role === 'customer' && (user.status === 'PENDING' || !user.hasLogin)) {
            return NextResponse.json({ error: 'Customer account requires activation.' }, { status: 403 });
        }

        let resolvedUser = user;
        if (user.role === 'dealer') {
            resolvedUser = { ...user };
        } else if (user.role === 'customer') {
            const userEmail = (user.email || '').toLowerCase().trim();
            const cust = db.customers?.find((c: any) => (c.email && c.email.toLowerCase().trim() === userEmail) || (user.phone && c.phone === user.phone) || c.id === user.id);
            const inq = db.inquiries?.find((i: any) => (userEmail && i.email && i.email.toLowerCase().trim() === userEmail) || (user.phone && i.phone === user.phone) || (user.id && i.linkedCustomerId === user.id));
            const resolvedCust = cust ? { ...cust, category: resolveCustomerCategory(cust) } : null;

            // Enrich assignedDealers list with contact information
            const enrichedDealers = (resolvedCust?.assignedDealers || []).map((ad: any) => {
                const fullDealer = db.dealers.find((d: any) => d.id === ad.id) as any;
                if (fullDealer) {
                    return {
                        id: fullDealer.id,
                        name: fullDealer.companyName || fullDealer.name,
                        email: fullDealer.email,
                        phone: fullDealer.phone || fullDealer.mobile || '',
                        city: fullDealer.city || '',
                        state: fullDealer.state || '',
                    };
                }
                return ad;
            });
            if (enrichedDealers.length === 0 && resolvedCust?.assignedDealerId) {
                const fullDealer = db.dealers.find((d: any) => d.id === resolvedCust.assignedDealerId) as any;
                if (fullDealer) {
                    enrichedDealers.push({
                        id: fullDealer.id,
                        name: fullDealer.companyName || fullDealer.name,
                        email: fullDealer.email,
                        phone: fullDealer.phone || fullDealer.mobile || '',
                        city: fullDealer.city || '',
                        state: fullDealer.state || '',
                    });
                }
            }

            resolvedUser = {
                ...resolvedCust,
                ...inq,
                ...user,
                name: user.name || cust?.name || inq?.name || '',
                phone: user.phone || cust?.phone || inq?.phone || '',
                email: user.email || cust?.email || inq?.email || '',
                category: resolvedCust?.category || inq?.productCategory || inq?.productInterest || 'General',
                assignedDealers: enrichedDealers
            };
        }

        return NextResponse.json({ success: true, user: sanitizeUser(resolvedUser) });
    } catch {
        return NextResponse.json({ error: 'Session token has expired or is invalid.' }, { status: 401 });
    }
}
