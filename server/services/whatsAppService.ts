/**
 * server/services/whatsAppService.ts
 *
 * Core WhatsApp Cloud API service wrapper.
 * Manages webhook verification, HMAC signature validation, message delivery (text & media/document),
 * and read receipts.
 */

import crypto from 'crypto';
import { formatPhoneNumber } from '@/lib/whatsapp';

export interface SendMessageResult {
    success: boolean;
    status: string;
    messageId?: string;
    error?: string;
}

export class WhatsAppService {
    private static getCredentials() {
        return {
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
            wabaId: process.env.WHATSAPP_WABA_ID || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
            appSecret: process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET || '',
            verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '0this1is2my3personal4whatsapp5verify6token7',
        };
    }

    /**
     * Verifies the Meta Webhook setup challenge (GET request from Meta Developer Portal).
     */
    public static verifyWebhookChallenge(searchParams: URLSearchParams): { status: number; body: string } {
        const { verifyToken } = this.getCredentials();
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('[WhatsAppService] Meta webhook verification successful.');
            return { status: 200, body: challenge || '' };
        }

        console.warn('[WhatsAppService] Meta webhook verification failed: Token mismatch or invalid mode.');
        return { status: 403, body: 'Forbidden' };
    }

    /**
     * Validates Meta HMAC SHA-256 signature on POST payloads.
     */
    public static verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
        const { appSecret } = this.getCredentials();

        if (!appSecret) {
            if (process.env.NODE_ENV === 'production') {
                console.error('[WhatsAppService] META_APP_SECRET is not configured in production.');
                return false;
            }
            console.warn('[WhatsAppService] META_APP_SECRET missing. Permitting in development mode.');
            return true;
        }

        if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
            return false;
        }

        const signature = signatureHeader.slice(7);
        const expectedSignature = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

        try {
            return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
        } catch {
            return false;
        }
    }

    /**
     * Sends a plain or formatted WhatsApp text message.
     */
    public static async sendTextMessage(to: string, textBody: string): Promise<SendMessageResult> {
        const { accessToken, phoneNumberId } = this.getCredentials();
        const formattedPhone = formatPhoneNumber(to);

        if (!formattedPhone) {
            return { success: false, status: 'invalid_phone', error: 'Missing or invalid phone number' };
        }

        if (!accessToken || !phoneNumberId) {
            console.log(`[WhatsAppService SIMULATOR] Outgoing text to ${formattedPhone}:\n${textBody}`);
            return { success: true, status: 'simulated' };
        }

        const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'text',
            text: {
                preview_url: false,
                body: textBody,
            },
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (response.ok) {
                const messageId = data.messages?.[0]?.id;
                console.log(`[WhatsAppService] Message sent to ${formattedPhone}. Message ID: ${messageId}`);
                return { success: true, status: 'success', messageId };
            } else {
                const errorMsg = data.error?.message || `Meta API Error (${response.status})`;
                console.error(`[WhatsAppService] Meta API Error:`, errorMsg);
                return { success: false, status: 'failed', error: errorMsg };
            }
        } catch (err: any) {
            console.error(`[WhatsAppService] Network error sending to ${formattedPhone}:`, err.message);
            return { success: false, status: 'failed', error: err.message };
        }
    }

    /**
     * Sends a document (e.g. PDF invoice or quotation) via WhatsApp Cloud API.
     */
    public static async sendDocumentMessage(
        to: string,
        documentUrl: string,
        filename: string,
        caption?: string
    ): Promise<SendMessageResult> {
        const { accessToken, phoneNumberId } = this.getCredentials();
        const formattedPhone = formatPhoneNumber(to);

        if (!formattedPhone) {
            return { success: false, status: 'invalid_phone', error: 'Missing or invalid phone number' };
        }

        if (!accessToken || !phoneNumberId) {
            console.log(`[WhatsAppService SIMULATOR] Outgoing document to ${formattedPhone}: ${filename} (${documentUrl})`);
            return { success: true, status: 'simulated' };
        }

        const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
        const payload: any = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'document',
            document: {
                link: documentUrl,
                filename: filename,
            },
        };

        if (caption) {
            payload.document.caption = caption;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (response.ok) {
                const messageId = data.messages?.[0]?.id;
                console.log(`[WhatsAppService] Document sent to ${formattedPhone}. Message ID: ${messageId}`);
                return { success: true, status: 'success', messageId };
            } else {
                const errorMsg = data.error?.message || `Meta API Error (${response.status})`;
                console.error(`[WhatsAppService] Meta API Error sending document:`, errorMsg);
                return { success: false, status: 'failed', error: errorMsg };
            }
        } catch (err: any) {
            console.error(`[WhatsAppService] Network error sending document to ${formattedPhone}:`, err.message);
            return { success: false, status: 'failed', error: err.message };
        }
    }

    /**
     * Marks an incoming customer message as read.
     */
    public static async markMessageAsRead(messageId: string): Promise<boolean> {
        const { accessToken, phoneNumberId } = this.getCredentials();
        if (!accessToken || !phoneNumberId || !messageId) return false;

        const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
        const payload = {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
        };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            return res.ok;
        } catch {
            return false;
        }
    }
}
