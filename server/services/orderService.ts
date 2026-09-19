/**
 * server/services/orderService.ts
 *
 * Encapsulates all customer order and deal management logic.
 * Reuses the central Voltrix database layer (db.deal_closures and MongoDB).
 */

import { db, ensureDb, isMongoReady, getMongoDb } from '@/lib/db';
import { normalizePhoneNumber } from '@/lib/phone';
import type { DealClosure, Customer } from '@/types';

export class OrderService {
    /**
     * Resolves the customer record by customerId from in-memory db or MongoDB.
     */
    private static async getCustomer(customerId: string): Promise<Customer | null> {
        await ensureDb();
        if (!customerId) return null;

        const cust = db.customers?.find((c: any) => c.id === customerId || (c as any)._id?.toString() === customerId);
        if (cust) return cust;

        if (isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                const doc = await mongoDb.collection('customers').findOne({
                    $or: [{ id: customerId }, { _id: customerId }]
                });
                if (doc) return { ...doc, id: doc._id?.toString() || doc.id };
            } catch (err) {
                console.error('[OrderService.getCustomer] MongoDB lookup failed:', err);
            }
        }
        return null;
    }

    /**
     * Retrieves all orders (closed deals) associated with an authenticated customerId.
     */
    public static async getCustomerOrders(customerId: string): Promise<DealClosure[]> {
        await ensureDb();
        if (!customerId) return [];

        const customer = await this.getCustomer(customerId);
        const normPhone = customer?.phone ? normalizePhoneNumber(customer.phone) : '';
        const userEmail = (customer?.email || '').toLowerCase().trim();

        let deals: DealClosure[] = (db.deal_closures || []) as DealClosure[];

        // If MongoDB is available and has deals, merge/fallback
        if (isMongoReady()) {
            const mongoDb = getMongoDb();
            try {
                const filters: any[] = [{ customerId: customerId }];
                if (normPhone) {
                    filters.push({ customerPhone: new RegExp(normPhone.slice(-10)) });
                }
                if (userEmail) {
                    filters.push({ customerEmail: userEmail });
                }
                const mongoDeals = await mongoDb.collection('deal_closures').find({ $or: filters }).toArray();
                if (mongoDeals && mongoDeals.length > 0) {
                    const mappedMongoDeals = mongoDeals.map((d: any) => ({
                        ...d,
                        id: d.id || d._id?.toString()
                    }));
                    // Merge by ID
                    const dealMap = new Map<string, DealClosure>();
                    deals.forEach(d => dealMap.set(d.id, d));
                    mappedMongoDeals.forEach((d: DealClosure) => dealMap.set(d.id, d));
                    deals = Array.from(dealMap.values());
                }
            } catch (err) {
                console.error('[OrderService.getCustomerOrders] MongoDB query failed:', err);
            }
        }

        // Strictly filter deals belonging to this customer
        const matched = deals.filter((d: any) => {
            const matchId = d.customerId && (d.customerId === customerId);
            const matchPhone = normPhone && d.customerPhone && (normalizePhoneNumber(d.customerPhone).slice(-10) === normPhone.slice(-10));
            const matchEmail = userEmail && d.customerEmail && (d.customerEmail.toLowerCase().trim() === userEmail);
            return matchId || matchPhone || matchEmail;
        });

        // Sort descending by date
        return matched.sort((a, b) => {
            const dateA = new Date(a.closedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.closedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    }

    /**
     * Returns total count of orders for this customer.
     */
    public static async getOrderCount(customerId: string): Promise<number> {
        const orders = await this.getCustomerOrders(customerId);
        return orders.length;
    }

    /**
     * Returns a list of orders (up to limit).
     */
    public static async getOrders(customerId: string, limit: number = 5): Promise<DealClosure[]> {
        const orders = await this.getCustomerOrders(customerId);
        return orders.slice(0, limit);
    }

    /**
     * Returns the customer's most recent order.
     */
    public static async getLatestOrder(customerId: string): Promise<DealClosure | null> {
        const orders = await this.getCustomerOrders(customerId);
        return orders.length > 0 ? orders[0] : null;
    }

    /**
     * Looks up an order by Deal ID or Invoice Number for the customer.
     */
    public static async getOrderByIdOrInvoice(customerId: string, query: string): Promise<DealClosure | null> {
        if (!query) return null;
        const cleanQuery = query.trim().toLowerCase();
        const orders = await this.getCustomerOrders(customerId);

        return orders.find(d => {
            const idMatch = d.id?.toLowerCase() === cleanQuery;
            const invMatch = d.invoiceNumber?.toLowerCase() === cleanQuery;
            const partialInv = d.invoiceNumber?.toLowerCase().includes(cleanQuery);
            return idMatch || invMatch || partialInv;
        }) || null;
    }
}
