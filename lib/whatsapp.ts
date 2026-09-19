/**
 * WhatsApp Cloud API Integration Helper
 * 
 * This module facilitates sending WhatsApp notifications to customers and dealers
 * using the Meta WhatsApp Cloud API. It supports template-based messages (required for 
 * business-initiated contacts) and logs all interactions directly into the database.
 */

import { db, persistWrite, isMongoReady, getMongoDb } from './db';

// Format phone number to WhatsApp international standard (E.164 without '+')
export function formatPhoneNumber(phone: string | undefined): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    // If it is a standard 10-digit Indian number, prefix with '91'
    if (digits.length === 10) {
        return `91${digits}`;
    }
    return digits;
}

interface WhatsAppLog {
    id: string;
    timestamp: string;
    to: string;
    recipientName: string;
    type: 'template' | 'text';
    templateName?: string;
    content: string;
    direction: 'sent';
    status: 'success' | 'failed' | 'simulated';
    error?: string;
}

/**
 * Sends a message via Meta's WhatsApp Cloud API.
 * Uses template messages for initial contact. If credentials are not configured,
 * it acts as a simulator (logging the message to the console and DB for sanity testing).
 */
export async function sendWhatsAppMessage({
    to,
    recipientName,
    type = 'template',
    templateName,
    parameters = [],
    headerImageUrl,
    textBody,
    associatedInquiryId,
    associatedDealerId,
    associatedOrderId,
}: {
    to: string;
    recipientName: string;
    type?: 'template' | 'text';
    templateName?: string;
    parameters?: string[];
    headerImageUrl?: string;
    textBody?: string;
    associatedInquiryId?: string;
    associatedDealerId?: string;
    associatedOrderId?: string;
}): Promise<{ success: boolean; status: string; logId: string }> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    const formattedPhone = formatPhoneNumber(to);
    const logId = `walog_${Date.now()}`;
    const timestamp = new Date().toISOString();

    let messageContent = '';
    if (type === 'template' && templateName) {
        messageContent = `Template: "${templateName}" | Params: ${JSON.stringify(parameters)}`;
    } else {
        messageContent = textBody || '';
    }

    const logEntry: WhatsAppLog = {
        id: logId,
        timestamp,
        to: formattedPhone,
        recipientName,
        type,
        templateName,
        content: messageContent,
        direction: 'sent',
        status: 'simulated',
    };

    const isConfigured = accessToken && accessToken !== 'EAAG...' && phoneId && wabaId;

    if (!formattedPhone) {
        console.warn(`[WhatsApp API] Skip sending to empty phone number for ${recipientName}`);
        return { success: false, status: 'invalid_phone', logId };
    }

    if (!isConfigured) {
        console.log(`[WhatsApp SIMULATOR] Sending message to ${recipientName} (${formattedPhone}):`);
        console.log(` > ${messageContent}`);
        logEntry.status = 'simulated';
    } else {
        try {
            const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
            const payload: any = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: formattedPhone,
            };

            if (type === 'template' && templateName) {
                payload.type = 'template';
                const components: any[] = [];

                const imageHeaderTemplates = [
                    'jaspers_market_image_cta_v1',
                    'customer_signup_welcome',
                    'order_placed',
                    'dealer_approved',
                    'dealer_suspended',
                    'dealer_rejected',
                    'dealer_registration_received',
                    'lead_assigned_to_dealer',
                    'customer_welcome_credentials'
                ];

                const isImageHeaderRequired = imageHeaderTemplates.includes(templateName);

                if (headerImageUrl || isImageHeaderRequired) {
                    const envKey = `WHATSAPP_HEADER_${templateName.toUpperCase()}_URL`;
                    const templateEnvUrl = process.env[envKey];
                    const defaultEnvUrl = process.env.WHATSAPP_DEFAULT_HEADER_IMAGE_URL;
                    const resolvedHeaderUrl = headerImageUrl || templateEnvUrl || defaultEnvUrl || "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1000";

                    components.push({
                        type: 'header',
                        parameters: [
                            {
                                type: 'image',
                                image: {
                                    link: resolvedHeaderUrl
                                }
                            }
                        ]
                    });
                }

                if (parameters && parameters.length > 0) {
                    components.push({
                        type: 'body',
                        parameters: parameters.map(p => ({
                            type: 'text',
                            text: String(p),
                        })),
                    });
                }

                payload.template = {
                    name: templateName,
                    language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en' },
                    components
                };
            } else {
                payload.type = 'text';
                payload.text = {
                    preview_url: false,
                    body: textBody,
                };
            }

            const maxAttempts = 3;
            let lastError = '';
            let isSuccess = false;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });

                    const resData = await response.json();

                    if (response.ok) {
                        console.log(`[WhatsApp API] Message sent successfully to ${formattedPhone} (attempt ${attempt}). Message ID: ${resData.messages?.[0]?.id}`);
                        logEntry.status = 'success';
                        isSuccess = true;
                        break;
                    } else {
                        lastError = resData.error?.message || `Meta API error (${response.status})`;
                        console.warn(`[WhatsApp API] Meta API error on attempt ${attempt}:`, lastError);
                        // Do not retry permanent validation errors (400)
                        if (response.status === 400 && !resData.error?.is_transient) {
                            break;
                        }
                    }
                } catch (err: any) {
                    lastError = err.message || 'Fetch execution failure';
                    console.warn(`[WhatsApp API] Network error on attempt ${attempt}:`, lastError);
                }

                if (attempt < maxAttempts) {
                    const delayMs = Math.pow(2, attempt) * 500; // 1s, 2s
                    await new Promise(r => setTimeout(r, delayMs));
                }
            }

            if (!isSuccess) {
                logEntry.status = 'failed';
                logEntry.error = lastError || 'All retry attempts exhausted';
                console.error(`[WhatsApp API] Failed to send message to ${formattedPhone} after retries:`, logEntry.error);
            }
        } catch (fatalErr: any) {
            console.error(`[WhatsApp API] Fatal exception during sending:`, fatalErr.message);
            logEntry.status = 'failed';
            logEntry.error = fatalErr.message || 'Fatal execution failure';
        }
    }



    // Append notification log details to associated entities
    try {
        // 1. Sync payload with Inquiry if applicable
        if (associatedInquiryId) {
            const inq = db.inquiries.find(i => i.id === associatedInquiryId) as any;
            if (inq) {
                // Ensure logs array exists
                if (!inq.notes) inq.notes = [];
                inq.notes.push(`WhatsApp ${logEntry.status.toUpperCase()}: ${messageContent}`);

                // Add to timeline events
                const timelineEvent = {
                    id: 'tl_wa_' + Date.now(),
                    timestamp,
                    type: 'whatsapp' as const,
                    remarks: `WhatsApp [${logEntry.status}]: ${messageContent}`,
                    userRole: 'system',
                    userName: 'WhatsApp Cloud'
                };
                if (!inq.timeline) inq.timeline = [];
                inq.timeline.push(timelineEvent as any);
                await persistWrite('inquiries', inq.id, inq);
            }
        }

        // 2. Sync payload with Dealer if applicable
        if (associatedDealerId) {
            const dealer = db.dealers.find(d => d.id === associatedDealerId);
            if (dealer) {
                if (!dealer.whatsappLogs) dealer.whatsappLogs = [];
                dealer.whatsappLogs.push({
                    timestamp,
                    message: messageContent,
                    direction: 'sent'
                });
                await persistWrite('dealers', dealer.id, dealer);
            }
        }

        // 3. Sync payload with Customer if order/email matches
        // (Removed to prevent WhatsApp system logs from showing up in customer delivery notes)

    } catch (saveErr: any) {
        console.error(`[WhatsApp API] Failed to attach logs to entities:`, saveErr.message);
    }

    return {
        success: logEntry.status !== 'failed',
        status: logEntry.status,
        logId
    };
}

/**
 * Sends a message specifically to the administrator phone if configured.
 */
export async function sendAdminWhatsAppMessage({
    templateName,
    parameters = []
}: {
    templateName: string;
    parameters?: string[];
}): Promise<{ success: boolean; status: string; logId: string }> {
    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE || '919032372136';
    if (!adminPhone) {
        console.log(`[WhatsApp API] Admin notification skipped — WHATSAPP_ADMIN_PHONE not configured.`);
        return { success: false, status: 'skipped_no_phone', logId: `walog_admin_${Date.now()}` };
    }
    return sendWhatsAppMessage({
        to: adminPhone,
        recipientName: "System Administrator",
        type: 'template',
        templateName,
        parameters
    });
}

export { WhatsAppService } from '@/server/services/whatsAppService';
