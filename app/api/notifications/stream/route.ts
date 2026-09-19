/**
 * GET /api/notifications/stream
 *
 * Decommissioned: Real-time notifications have been migrated to WhatsApp Cloud API / Twilio SMS.
 * Returns 410 Gone.
 */
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'retired',
        message: 'Server-Sent Events notifications have been retired. All notifications are delivered via WhatsApp Cloud API / SMS.'
    }, { status: 410 });
}

