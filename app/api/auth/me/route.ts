import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDb } from '@/lib/db';
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

        if (decoded.role === 'dealer') {
            const decodedEmail = (decoded.email || '').toLowerCase().trim();
            const decodedId = decoded.id;
            let dealer = db.dealers.find((d: any) => (d.email && d.email.toLowerCase() === decodedEmail) || d.id === decodedId || d.id === decoded.dealerId);
            if (!dealer) {
                dealer = db.users.find((u: any) => (u.email && u.email.toLowerCase() === decodedEmail) || u.id === decodedId);
            }
            if (dealer) {
                return NextResponse.json({ success: true, user: sanitizeUser({ ...dealer, role: 'dealer' }) });
            }
        }

        // If role was customer or not found, reject
        return NextResponse.json({ error: 'Valid dealer or administrator session not found.' }, { status: 401 });
    } catch {
        return NextResponse.json({ error: 'Session token has expired or is invalid.' }, { status: 401 });
    }
}
