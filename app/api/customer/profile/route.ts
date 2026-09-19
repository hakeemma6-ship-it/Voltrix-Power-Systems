/**
 * PATCH /api/customer/profile — Let authenticated customer update profile details (name, phone, password)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, persistWrite, syncDatabaseOnBoot } from '@/lib/db';
import { requireRole, sanitizeUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PATCH(req: NextRequest) {
    try {
        await syncDatabaseOnBoot();
        const authResult = requireRole(req, ['customer']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        const body = await req.json();
        const { name, phone, password } = body;

        // Find customer by email
        if (!db.customers) db.customers = [];
        const custIdx = db.customers.findIndex((c: any) => c.email && c.email.toLowerCase() === user.email.toLowerCase());
        if (custIdx === -1) {
            return NextResponse.json({ error: 'Customer profile not found.' }, { status: 404 });
        }

        let newHashedPassword: string | undefined;

        if (name) {
            db.customers[custIdx].name = name.trim();
        }
        if (phone) {
            db.customers[custIdx].phone = phone.trim();
        }
        if (password) {
            if (password.length < 6 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
                return NextResponse.json({ error: 'Password must be at least 6 characters and contain both letters and numbers.' }, { status: 400 });
            }
            newHashedPassword = bcrypt.hashSync(password, 10);
            (db.customers as any[])[custIdx].password = newHashedPassword;
        }

        db.customers[custIdx].updatedAt = new Date().toISOString();
        await persistWrite('customers', db.customers[custIdx].id, db.customers[custIdx]);

        // Synchronize db.users if customer user account exists
        if (!db.users) db.users = [];
        const userIdx = db.users.findIndex((u: any) =>
            (u.email && u.email.toLowerCase() === user.email.toLowerCase()) ||
            u.customerId === db.customers[custIdx].id
        );
        if (userIdx !== -1) {
            if (name) db.users[userIdx].name = name.trim();
            if (phone) db.users[userIdx].phone = phone.trim();
            if (newHashedPassword) db.users[userIdx].password = newHashedPassword;
            db.users[userIdx].updatedAt = new Date().toISOString();
            await persistWrite('users', db.users[userIdx].id, db.users[userIdx]);
        }

        return NextResponse.json({
            success: true,
            user: sanitizeUser({
                ...db.customers[custIdx],
                role: 'customer'
            })
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
    }
}
