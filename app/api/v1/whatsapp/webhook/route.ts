/**
 * app/api/v1/whatsapp/webhook/route.ts
 *
 * WhatsApp Cloud API Webhook endpoint:
 * - GET:  Verifies Meta developer subscription challenge.
 * - POST: Validates HMAC-SHA256 signature, processes real-time inbound customer messages
 *         via CustomerAssistantService, and tracks delivery status updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService, CustomerAssistantService } from '@/server/services';
import { ensureDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const challengeResult = WhatsAppService.verifyWebhookChallenge(searchParams);
        return new Response(challengeResult.body, { status: challengeResult.status });
    } catch (err: any) {
        console.error('[WhatsApp Webhook GET] Handshake failed:', err.message);
        return new Response('Internal Server Error', { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await ensureDb();

    try {
        const rawBody = await req.text();
        const signatureHeader = req.headers.get('x-hub-signature-256');

        // 1. Strict HMAC-SHA256 signature verification
        const isValidSignature = WhatsAppService.verifyWebhookSignature(rawBody, signatureHeader);
        if (!isValidSignature) {
            console.warn('[WhatsApp Webhook POST] Rejected: Invalid HMAC-SHA256 signature.');
            return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
        }

        let body: any;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: 'Malformed JSON payload.' }, { status: 400 });
        }

        const entry = body?.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (!value) {
            return NextResponse.json({ received: true }, { status: 200 });
        }

        // 2. Track message delivery statuses (sent, delivered, read, failed)
        if (value.statuses && Array.isArray(value.statuses)) {
            for (const status of value.statuses) {
                const msgId = status.id;
                const recipientId = status.recipient_id;
                const statusName = status.status;
                console.log(`[WhatsApp Webhook] Status update: Msg ${msgId} to ${recipientId} is now '${statusName}'`);
            }
        }

        // 3. Process inbound customer messages
        if (value.messages && Array.isArray(value.messages)) {
            for (const msg of value.messages) {
                const from = msg.from;
                const messageId = msg.id;

                let incomingText = '';
                if (msg.type === 'text' && msg.text?.body) {
                    incomingText = msg.text.body;
                } else if (msg.type === 'interactive') {
                    incomingText = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
                } else if (msg.type === 'button') {
                    incomingText = msg.button?.text || '';
                }

                // Sanitize and limit text input
                const sanitizedText = incomingText.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 1000).trim();

                if (!sanitizedText) {
                    console.log(`[WhatsApp Webhook] Ignored non-text or empty message from ${from}`);
                    continue;
                }

                console.log(`[WhatsApp Webhook] Processing customer message from ${from}: "${sanitizedText}"`);

                // Delegate to CustomerAssistantService for authenticated resolution and response
                await CustomerAssistantService.handleIncomingMessage({
                    from,
                    messageId,
                    text: sanitizedText,
                }).catch(err => {
                    console.error(`[WhatsApp Webhook] Error handling message for ${from}:`, err);
                });
            }
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (e: any) {
        console.error('[WhatsApp Webhook POST] Critical error in handler:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
