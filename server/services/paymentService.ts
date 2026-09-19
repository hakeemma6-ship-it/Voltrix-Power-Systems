/**
 * server/services/paymentService.ts
 *
 * Encapsulates order billing, payment status, and financial verification.
 */

import { OrderService } from './orderService';
import type { DealClosure } from '@/types';

export interface PaymentStatusResult {
    orderId: string;
    invoiceNumber?: string;
    productTitle: string;
    amount: number;
    paymentStatus: 'PAID' | 'PENDING' | 'SETTLED';
    paidAt?: string;
    date: string;
}

export class PaymentService {
    /**
     * Resolves payment details for an order or the latest order.
     */
    public static async getOrderPaymentStatus(
        customerId: string,
        orderId?: string
    ): Promise<PaymentStatusResult | null> {
        let order: DealClosure | null = null;

        if (orderId) {
            order = await OrderService.getOrderByIdOrInvoice(customerId, orderId);
        }

        if (!order) {
            order = await OrderService.getLatestOrder(customerId);
        }

        if (!order) return null;

        let status: PaymentStatusResult['paymentStatus'] = 'PENDING';
        if (order.adminSettled) {
            status = 'SETTLED';
        } else if (order.paymentStatus === 'paid' || order.dealStatus === 'paid_by_dealer' || order.dealStatus === 'closed') {
            status = 'PAID';
        }

        return {
            orderId: order.id,
            invoiceNumber: order.invoiceNumber,
            productTitle: order.productTitle || order.productCategory || 'Voltrix Equipment',
            amount: order.closedAmount || 0,
            paymentStatus: status,
            paidAt: order.paidAt,
            date: order.closedAt || order.createdAt || new Date().toISOString(),
        };
    }

    /**
     * Retrieves overall payment summary across all customer purchases.
     */
    public static async getCustomerPaymentSummary(customerId: string): Promise<{
        totalPurchases: number;
        totalAmountPaid: number;
        pendingOrdersCount: number;
    }> {
        const orders = await OrderService.getCustomerOrders(customerId);
        let totalAmountPaid = 0;
        let pendingOrdersCount = 0;

        orders.forEach(o => {
            const isPaid = o.paymentStatus === 'paid' || o.dealStatus === 'paid_by_dealer' || o.dealStatus === 'closed';
            if (isPaid) {
                totalAmountPaid += (o.closedAmount || 0);
            } else {
                pendingOrdersCount++;
            }
        });

        return {
            totalPurchases: orders.length,
            totalAmountPaid,
            pendingOrdersCount,
        };
    }
}
