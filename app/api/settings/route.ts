import { NextRequest, NextResponse } from 'next/server';
import { db, persistWrite, ensureDb } from '@/lib/db';
import { getAuthUser, requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await ensureDb();
        const settings = db.settings?.find(s => s.id === 'company_settings') || db.settings?.[0] || {};
        const user = getAuthUser(req);
        const isAdmin = user && user.role === 'admin';

        if (isAdmin) {
            return NextResponse.json(settings);
        }

        // Return curated public company profile for visitors, invoices, and navigation
        const publicSettings = {
            id: settings.id || 'company_settings',
            companyName: settings.companyName || 'Voltrix Power Systems',
            logo: settings.logo || '/logo.png',
            address: settings.address || '',
            phone: settings.phone || '',
            email: settings.email || '',
            gstin: settings.gstin || '',
            state: settings.state || 'Telangana',
            stateCode: settings.stateCode || '36',
            bankName: settings.bankName || '',
            accountNumber: settings.accountNumber || '',
            ifscCode: settings.ifscCode || '',
            accountHolderName: settings.accountHolderName || '',
            branch: settings.branch || '',
            upiId: settings.upiId || '',
            warrantyTerms: settings.warrantyTerms || '',
            paymentTerms: settings.paymentTerms || '',
            deliveryTerms: settings.deliveryTerms || '',
        };
        return NextResponse.json(publicSettings);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await ensureDb();
        const authResult = requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) return authResult;

        const body = await req.json();

        let settings = db.settings.find(s => s.id === 'company_settings');
        if (!settings) {
            settings = { id: 'company_settings' };
            db.settings.push(settings);
        }

        const idx = db.settings.findIndex(s => s.id === 'company_settings');
        db.settings[idx] = {
            ...db.settings[idx],
            ...body,
            id: 'company_settings',
            updatedAt: new Date().toISOString()
        };

        // Persist settings
        await persistWrite('settings', 'company_settings', db.settings[idx]);
        return NextResponse.json(db.settings[idx]);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
