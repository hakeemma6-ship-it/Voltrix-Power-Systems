/**
 * server/services/documentService.ts
 *
 * Encapsulates customer invoices, documents, and spec sheets retrieval.
 * Prepares files for delivery over WhatsApp Cloud API.
 */

import { OrderService } from './orderService';
import type { DealClosure } from '@/types';

export interface InvoiceDocumentResult {
    orderId: string;
    invoiceNumber: string;
    productTitle: string;
    amount: number;
    date: string;
    documentUrl?: string;
    filename: string;
    mimeType: string;
}

export class DocumentService {
    /**
     * Resolves the latest available invoice or receipt for an authenticated customer.
     */
    public static async getLatestInvoice(customerId: string): Promise<InvoiceDocumentResult | null> {
        const order = await OrderService.getLatestOrder(customerId);
        if (!order) return null;
        return this.mapOrderToInvoice(order);
    }

    /**
     * Looks up an invoice by specific order ID or invoice number.
     */
    public static async getOrderInvoice(customerId: string, query: string): Promise<InvoiceDocumentResult | null> {
        const order = await OrderService.getOrderByIdOrInvoice(customerId, query);
        if (!order) return null;
        return this.mapOrderToInvoice(order);
    }

    /**
     * Maps a DealClosure to an InvoiceDocumentResult.
     */
    private static mapOrderToInvoice(order: DealClosure): InvoiceDocumentResult {
        const invNum = order.invoiceNumber || `INV-${order.id.slice(-6).toUpperCase()}`;
        const filename = order.invoiceName || `${invNum}.pdf`;

        // Check if invoiceUrl is a valid URL
        let documentUrl = order.invoiceUrl;
        if (documentUrl && !documentUrl.startsWith('http://') && !documentUrl.startsWith('https://')) {
            // If relative path, prefix with APP_URL if available
            const appUrl = process.env.APP_URL || '';
            if (appUrl) {
                documentUrl = `${appUrl.replace(/\/$/, '')}/${documentUrl.replace(/^\//, '')}`;
            }
        }

        return {
            orderId: order.id,
            invoiceNumber: invNum,
            productTitle: order.productTitle || order.productCategory || 'Voltrix Industrial Unit',
            amount: order.closedAmount || 0,
            date: order.closedAt || order.createdAt || new Date().toISOString(),
            documentUrl: documentUrl || undefined,
            filename,
            mimeType: order.invoiceType || 'application/pdf',
        };
    }
}
