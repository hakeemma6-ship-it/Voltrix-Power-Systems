/**
 * server/services/logisticsService.ts
 *
 * Encapsulates order shipment, delivery, and logistics status tracking.
 * Analyzes deal status, dispatch logs, and fulfillment timeline.
 */

import { OrderService } from './orderService';
import type { DealClosure } from '@/types';

export interface LogisticsStatusResult {
    orderId: string;
    productTitle: string;
    status: 'Delivered' | 'In Transit / Dispatched' | 'Processing / Ready for Dispatch' | 'Confirmed / Sourcing';
    details: string;
    dealerContact?: string;
    dealerName?: string;
    date: string;
    invoiceNumber?: string;
}

export class LogisticsService {
    /**
     * Resolves the shipment and delivery status for a customer's order.
     * If orderId is provided, checks that specific order; otherwise checks latest order.
     */
    public static async getOrderLogisticsStatus(
        customerId: string,
        orderId?: string
    ): Promise<LogisticsStatusResult | null> {
        let order: DealClosure | null = null;

        if (orderId) {
            order = await OrderService.getOrderByIdOrInvoice(customerId, orderId);
        }

        if (!order) {
            order = await OrderService.getLatestOrder(customerId);
        }

        if (!order) return null;

        let status: LogisticsStatusResult['status'] = 'Processing / Ready for Dispatch';
        let details = 'Your order has been recorded and is currently being prepared for dispatch by our fulfillment team.';

        if (order.dealStatus === 'closed' || order.adminSettled) {
            status = 'Delivered';
            details = 'Fulfillment complete. Order successfully delivered and installed at your location.';
        } else if (order.dealStatus === 'paid_by_dealer' || order.paymentStatus === 'paid') {
            status = 'In Transit / Dispatched';
            details = 'Payment verified and unit dispatched with authorized partner. Out for logistics delivery and installation.';
        } else if (order.dealStatus === 'pending_payment') {
            status = 'Confirmed / Sourcing';
            details = 'Order verified. Partner is finalizing logistics arrangements and payment processing.';
        }

        return {
            orderId: order.id,
            productTitle: order.productTitle || order.productCategory || 'Voltrix Power Equipment',
            status,
            details,
            dealerName: order.dealerCompanyName,
            dealerContact: order.dealerPhone,
            date: order.closedAt || order.createdAt || new Date().toISOString(),
            invoiceNumber: order.invoiceNumber,
        };
    }
}
