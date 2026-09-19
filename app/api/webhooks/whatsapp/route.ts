/**
 * app/api/webhooks/whatsapp/route.ts
 *
 * Backward-compatible endpoint forwarding to /api/v1/whatsapp/webhook.
 */

export { GET, POST } from '@/app/api/v1/whatsapp/webhook/route';
