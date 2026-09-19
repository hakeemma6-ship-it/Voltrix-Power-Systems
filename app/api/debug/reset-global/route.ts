import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Debug endpoints are disabled in production.' },
            { status: 403 }
        );
    }

    const authResult = requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    delete (global as any).__voltrix_db;
    delete (global as any).__voltrix_dbReady;
    return NextResponse.json({ success: true });
}

